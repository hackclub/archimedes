import type Slack from "@slack/bolt";
import { db, storiesTable, type Story } from "../airtable";
import { stageRequest } from "../blocks/approvals/stageRequest";
import logger from "../logger";
import { env } from "../env";

async function sendResponseMessage(story: Story, type: "Approved" | "Rejected", client: Slack.webApi.WebClient) {
    const message = type === "Approved" ? `Your story *${story.headline}* has been approved! :yay:\nExpect to see it in the next issue.` : `Your story *${story.headline}* has been rejected :blob_sad:\nPlease edit your story and try again.`;
    console.log(`Sending message: ${message}`);
    for (const userId of story.slackIdRollup) {
        logger.debug(`Sending message to ${userId}`);
        const response = await client.chat.postMessage({
            channel: userId,
            text: message
        })
        if (!response.ok) {
            logger.error(`Failed to send message to ${userId}: ${response.error}`)
        }
    }
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