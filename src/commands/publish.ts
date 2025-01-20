import { getReporterBySlackId, getStoriesByUserId } from "../data";
import { db, storiesTable } from "../airtable";
import { render } from "@react-email/components";
import type Slack from "@slack/bolt";
import Email from "../emails/newsletterEmail";
import publishModal from "../blocks/publishing/publishModal";
import buildHappeningsMessage from "../blocks/publishing/happeningsMessage";
import { env } from "../env";
import Plunk from "@plunk/node";
import logger from "../logger";

export default function (app: Slack.App) {
    const plunk = new Plunk(env.PLUNK_API_KEY);

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

    app.view("publish-story-modal", async ({ ack, client, body }) => {
        await ack();
        logger.debug({ requestedBy: body.user.id }, "Processing publish-story-modal");

        const approvedStories = await db.scan(storiesTable, {
            filterByFormula: `{status} = "Approved"`
        });

        const userDetails = await client.users.info({
            user: body.user.id
        });

        await client.chat.postMessage({
            channel: env.HAPPENINGS_CHANNEL_ID,
            icon_url: userDetails.user?.profile?.image_original,
            username: userDetails.user?.profile?.display_name || userDetails.user?.name || "Archimedes",
            unfurl_links: false,
            unfurl_media: false,
            ...buildHappeningsMessage(
                "Welcome back to #happenings, the weekly newsletter which is now 10 weeks old! Enjoy this double-digit edition :).",
                "P.S. Send me a DM if you have cool community-oriented stuff, I.e. active YSWS, which you want featured\n(Tenth edition :yay: - Written by @Felix Gao, revised by @radioblahaj",
                approvedStories
            )
        });

        // const emailHtml = await render(Email({ intro: "Arch Newsletter", conclusion: "Thanks for reading!", stories: approvedStories }));
        // logger.debug({ requestedBy: body.user.id }, "Sending newsletter");

        // const headers = {
        //     'Content-Type': 'application/json',
        //     Authorization: `Bearer ${env.PLUNK_API_KEY}`
        // };
        // const campaignOptions = {
        //     method: 'POST',
        //     headers,
        //     body: JSON.stringify({
        //         subject: "Arch Newsletter",
        //         body: emailHtml,
        //         recipients: ["mahadkalam1@proton.me"],
        //         style: "HTML"
        //     })
        // };
        // const campaign = await fetch('https://api.useplunk.com/v1/campaigns', campaignOptions)
        //     .then(response => response.json())
        // const sendOptions = {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.PLUNK_API_KEY}` },
        //     body: JSON.stringify({
        //         id: campaign.id,
        //         live: true,
        //         delay: 1
        //     })
        // };

        // const response = await fetch('https://api.useplunk.com/v1/campaigns/send', sendOptions);
        // if (!response.ok) {
        //     throw new Error(`Failed to send campaign: ${response.statusText}`);
        // }

        // logger.debug({ requestedBy: body.user.id }, "Sent newsletter");
    })
}