import type Slack from "@slack/bolt";
import { db, storiesTable, type Story } from "../airtable";
import { stageRequest } from "../blocks/approvals/stageRequest";
import logger from "../logger";

async function sendResponseMessage(story: Story, type: "Approved" | "Rejected", client: Slack.webApi.WebClient) {
    logger.debug(`Sending response message to ${story.slackIdRollup.length} author(s) for story ${story.headline} (${story.id})`)
    const convo = await client.conversations.open({
        users: story.slackIdRollup.join(",")
    });
    if (!convo.ok) {
        logger.error(`Error opening conversation: ${convo.error}`);
        return;
    }
    const message = type === "Approved" ? `Your story ${story.headline} has been approved! :yay:\nExpect to see it in the next issue.` : `Your story ${story.headline} has been rejected :blob_sad:\nPlease edit your story and try again.`;
    await client.chat.postMessage({
        channel: convo.channel!.id!,
        text: message
    });
}

export default function (app: Slack.App) {
    app.action("approve-story", async ({ ack, client, body, respond }) => {
        await ack();
        const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
        const storyId = action.value!;
        logger.debug(`Approving story ${storyId}`);
        const story = await db.update(storiesTable, {
            id: storyId,
            status: "Approved",
        });
        await sendResponseMessage(story, "Approved", client)
        await respond(stageRequest(story, "Approved", body.user.id))
    });

    app.action("reject-story", async ({ ack, client, body, respond }) => {
        await ack();
        const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
        const storyId = action.value!;
        logger.debug(`Rejecting story ${storyId}`);
        const story = await db.update(storiesTable, {
            id: storyId,
            status: "Draft",
        });
        await sendResponseMessage(story, "Rejected", client)
        await respond(stageRequest(story, "Rejected", body.user.id))
    })
};