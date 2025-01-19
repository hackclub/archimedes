import type Slack from "@slack/bolt";
import { db, storiesTable } from "../airtable";
import { stageRequest } from "../blocks/approvals/stageRequest";
import logger from "../logger";
import { env } from "../env";

export default function (app: Slack.App) {
    app.action("approve-story", async ({ ack, client, body, respond }) => {
        await ack();
        const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
        const storyId = action.value!;
        logger.debug(`Approving story ${storyId}`);
        const story = await db.update(storiesTable, {
            id: storyId,
            status: "Published",
        });
        await respond(stageRequest(story, "Published", body.user.id))
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
        await respond(stageRequest(story, "Rejected", body.user.id))

    })
};