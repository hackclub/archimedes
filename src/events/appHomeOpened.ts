import Slack, { type BlockAction } from '@slack/bolt';
import logger from "../logger";
import { db, reportersTable } from "../airtable"
import notAReporter from "../blocks/appHome/notAReporter";
import reporterHome from "../blocks/appHome/reporterHome";
import submitArticleModal from "../views/submitArticle";

export default async (app: Slack.App) => {
    app.action("draft-post-button", async ({ ack, client, body }) => {
        await ack();
        await client.views.open({
            trigger_id: (body as BlockAction).trigger_id,
            view: submitArticleModal,
        });
    });

    app.event("app_home_opened", async ({ event, client }) => {
        logger.debug(`Received app_home_opened event from ${event.user}`);
        const reporterNames = await db.scan(reportersTable);
        const reporter = reporterNames.find((reporter) => reporter.slack_id === event.user);

        if (!reporter) {
            logger.warn(`User ${event.user} is not a reporter - showing notAReporter view`);
            await client.views.publish({
                user_id: event.user,
                view: notAReporter,
            });
            return;
        }

        await client.views.publish({
            user_id: event.user,
            view: reporterHome(reporter.first_name),
        });
    })
};