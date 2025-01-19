import type Slack from "@slack/bolt";
import { db, storiesTable } from "../airtable";
import logger from "../logger";

export default function (app: Slack.App) {
    app.action("approve-story", async ({ ack, client, body }) => {
        await ack();
        const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
        const storyId = action.value!;
        logger.debug(`Approving story ${storyId}`);
        await db.update(storiesTable, {
            id: storyId,
            status: "Published",
        });
    });

    app.action("reject-story", async ({ ack, client, body }) => {
        await ack();
        const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
        const storyId = action.value!;
        logger.debug(`Rejecting story ${storyId}`);
        await db.update(storiesTable, {
            id: storyId,
            status: "Draft",
        });
    })
};