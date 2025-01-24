import { getChannelNameById, getDisplayNameBySlackId, getReporterBySlackId, getStoriesByUserId } from "../data";
import { db, storiesTable, airtableJson, type Story } from "../airtable";
import { render } from "@react-email/components";
import { env } from "../env";
import { replaceAsync, richTextBlockToMrkdwn } from "../util";
import type Slack from "@slack/bolt";
import Email from "../emails/newsletterEmail";
import publishModal from "../blocks/publishing/publishModal";
import buildHappeningsMessage from "../blocks/publishing/happeningsMessage";
import logger from "../logger";

export default function (app: Slack.App) {
    app.command("/arch-publish", async ({ ack, client, body, respond }) => {
        await ack();
        const reporter = await getReporterBySlackId(body.user_id);
        if (!reporter) {
            await respond({
                text: "You are not a reporter, so you can't publish stories. Sorry :/",
                response_type: "ephemeral"
            });
            return;
        }
        if (!reporter.hasPublishingRights) {
            await respond({
                text: "You don't have publishing rights, so you can't publish stories. Sorry :/",
                response_type: "ephemeral"
            });
            return;
        }

        const stories = await getStoriesByUserId(body.user_id);
        await client.views.open({
            trigger_id: body.trigger_id,
            view: publishModal(stories)
        });
    });

    app.view("publish-story-modal", async ({ ack, client, body, view }) => {
        await ack();
        logger.debug({ requestedBy: body.user.id }, "Processing publish-story-modal");

        const subject = view.state.values.subject_input.subject.value!;
        const introMd = richTextBlockToMrkdwn(view.state.values.intro_input.intro.rich_text_value!);
        const conclusionMd = richTextBlockToMrkdwn(view.state.values.conclusion_input.conclusion.rich_text_value!);

        const approvedStories = await db.scan(storiesTable, {
            filterByFormula: `{status} = "Approved"`
        });
        await db.airtable.base(airtableJson.data!.baseId).table(airtableJson.data!.stories!.tableId);

        await Promise.allSettled([
            sendHappeningsMessage(client, body.user.id, approvedStories, introMd, conclusionMd),
            sendNewsletter(body.user.id, approvedStories, subject, introMd, conclusionMd, client)
        ]);
    })
}

async function sendHappeningsMessage(client: Slack.webApi.WebClient, userId: string, stories: Story[], introMd: string, conclusionMd: string) {
    const userDetails = await client.users.info({
        user: userId
    });

    await client.chat.postMessage({
        channel: env.HAPPENINGS_CHANNEL_ID,
        icon_url: userDetails.user?.profile?.image_original,
        username: userDetails.user?.profile?.display_name || userDetails.user?.name || "Archimedes",
        unfurl_links: false,
        unfurl_media: false,
        ...buildHappeningsMessage(
            introMd,
            conclusionMd,
            stories
        )
    });
    logger.debug({ requestedBy: userId }, "Sent happenings message");
}

async function sendNewsletter(userId: string, stories: Story[], subject: string, introMd: string, conclusionMd: string, client: Slack.webApi.WebClient) {
    logger.debug({ requestedBy: userId }, "sendNewsletter: Running passes on mrkdwn")
    const finalIntroMd = await runPasses(introMd, client);
    const finalConclusionMd = await runPasses(conclusionMd, client);
    logger.debug({ requestedBy: userId }, "sendNewsletter: Finished passes on mrkdwn")

    const emailHtml = await render(Email({
        intro: finalIntroMd, conclusion: finalConclusionMd, stories,
        // intro: introMd, conclusion: conclusionMd, stories,
    }));
    logger.debug({ requestedBy: userId }, "Sending newsletter");

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.PLUNK_API_KEY}`
    };
    const campaignOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify({
            subject,
            body: emailHtml,
            recipients: ["mahadkalam1@proton.me"],
            style: "HTML"
        })
    };
    const campaign = await fetch('https://api.useplunk.com/v1/campaigns', campaignOptions)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to create campaign: ${response.statusText}`);
            return response.json();
        })
    const sendOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.PLUNK_API_KEY}` },
        body: JSON.stringify({
            id: campaign.id,
            live: true,
            delay: 0
        })
    };

    const response = await fetch('https://api.useplunk.com/v1/campaigns/send', sendOptions);
    if (!response.ok) {
        throw new Error(`Failed to send campaign: ${response.statusText}`);
    }

    logger.debug({ requestedBy: userId }, "Sent newsletter");
}

async function runPasses(md: string, client: Slack.webApi.WebClient) {
    const displayNamesPass = await mentionsToDisplayNamesPass(md, client);
    const channelIdsPass = await channelIdsToNamesPass(displayNamesPass, client);
    return channelIdsPass
}

async function mentionsToDisplayNamesPass(md: string, client: Slack.webApi.WebClient): Promise<string> {
    return replaceAsync(md, /<@([A-Z0-9]*)>/g, async (matches) => {
        const userId = matches[1];
        const displayName = await getDisplayNameBySlackId(userId, client);
        return `<https://hackclub.slack.com/team/${userId}|@${displayName}>`;
    });
}

async function channelIdsToNamesPass(md: string, client: Slack.webApi.WebClient): Promise<string> {
    return replaceAsync(md, /<#([A-Z0-9]*)>/g, async (matches) => {
        const channelId = matches[1];
        const channelName = await getChannelNameById(channelId, client);
        //const channelName = "PLACEHOLDER-NAME"
        return `<https://hackclub.slack.com/archives/${channelId}|#${channelName}>`;
    });
}