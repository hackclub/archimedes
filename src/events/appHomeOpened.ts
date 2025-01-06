import Slack, { type BlockAction } from '@slack/bolt';
import logger from "../logger";
import { db, reportersTable, storiesTable } from "../airtable"
import slugify from "slugify";
import { richTextBlockToMrkdwn } from '../util';

import notAReporter from "../blocks/appHome/notAReporter";
import reporterHome from "../blocks/appHome/reporterHome";
import submitArticleModal from "../blocks/appHome/submitArticleModal";

export default async (app: Slack.App) => {
    app.action("draft-post-button", async ({ ack, client, body }) => {
        await ack();
        await client.views.open({
            trigger_id: (body as BlockAction).trigger_id,
            view: submitArticleModal(body.user.id),
        });
    });

    app.view("submit-article-modal", async ({ ack, view }) => {
        await ack();

        const userId = view.private_metadata;
        const headline = view.state.values.headline_input.headline.value!;
        const shortDescription = richTextBlockToMrkdwn(view.state.values.short_description_input.short_description.rich_text_value!);
        const longArticle = richTextBlockToMrkdwn(view.state.values.long_article_input.long_article.rich_text_value!);
        const identifier = slugify(headline, { replacement: "_", lower: true });

        await db.insert(storiesTable, {
            headline,
            shortDescription,
            longArticle,
            identifier,
            authors: [userId],
            authorsName: null,
            status: "Draft",
            newsletters: [],
            happenings: [],
        });

        logger.info(`Headline: ${headline}`);
    })

    app.event("app_home_opened", async ({ event, client }) => {
        logger.debug(`Received app_home_opened event from ${event.user}`);
        const reporterNames = await db.scan(reportersTable);
        const reporter = reporterNames.find((reporter) => reporter.slackId === event.user);

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
            view: reporterHome(reporter.firstName),
        });
    })
};