import type Slack from "@slack/bolt";
import { getReporterBySlackId, getStoriesByUserId } from "../data";
import publishModal from "../blocks/publish/publishModal";

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

    app.view("publish-story-modal", async ({ ack, view, client, body }) => {
        await ack();
    })
}