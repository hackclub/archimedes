import Slack, { type BlockAction } from '@slack/bolt';
import logger from "../logger";
import { db, reportersTable, storiesTable } from "../airtable"
import { richTextBlockToMrkdwn } from '../util';

import notAReporter from "../blocks/appHome/notAReporter";
import reporterHome from "../blocks/appHome/reporterHome";
import storyModal from "../blocks/appHome/storyModal";

export default async (app: Slack.App) => {
    app.action("new-story-button", async ({ ack, client, body }) => {
        await ack();
        await client.views.open({
            trigger_id: (body as BlockAction).trigger_id,
            view: storyModal(body.user.id),
        });
    });

    app.action("edit-story-button", async ({ ack, client, body }) => {
        await ack();
        const action = (body as BlockAction).actions[0] as Slack.ButtonAction;
        logger.debug(`(Edit Story) Fetching story ${action.value}`);
        const story = await db.get(storiesTable, action.value!);
        await client.views.open({
            trigger_id: (body as BlockAction).trigger_id,
            view: storyModal(body.user.id, story),
        });
    });

    app.view("submit-story-modal", async ({ ack, view, client }) => {
        await ack();

        const metadata = JSON.parse(view.private_metadata);
        const userId: string = metadata.userId;
        const storyId: string | undefined = metadata.storyId;

        const headline = view.state.values.headline_input.headline.value!;
        const shortDescriptionRt = view.state.values.short_description_input.short_description.rich_text_value!;
        const shortDescription = richTextBlockToMrkdwn(shortDescriptionRt);
        const longArticleRt = view.state.values.long_article_input.long_article.rich_text_value!;
        const longArticle = richTextBlockToMrkdwn(longArticleRt);

        logger.debug(`Fetching reporter for ${userId}`);
        const reporter = (await db.scan(reportersTable, {
            filterByFormula: `{slack_id} = "${userId}"`,
        }))[0]

        if (storyId) {
            logger.debug(`Updating story for ${userId} (${headline})`);
            await db.update(storiesTable, {
                id: storyId,
                headline,
                shortDescription,
                longArticle,
                shortDescriptionRt: JSON.stringify(shortDescriptionRt),
                longArticleRt: JSON.stringify(longArticleRt),
            });
        } else {
            logger.debug(`Inserting story for ${userId} (${headline})`);
            await db.insert(storiesTable, {
                headline,
                shortDescription,
                longArticle,
                shortDescriptionRt: JSON.stringify(shortDescriptionRt),
                longArticleRt: JSON.stringify(longArticleRt),
                authors: [reporter.id],
                status: "Draft",
                newsletters: [],
                happenings: [],
            });
        }

        logger.debug(`Headline: ${headline}`);

        await client.views.publish({
            user_id: userId,
            view: await reporterHome(reporter.firstName, reporter.slackId),
        });
    })

    app.event("app_home_opened", async ({ event, client }) => {
        logger.debug(`Received app_home_opened event from ${event.user} - scanning for reporter`);
        const reporter = (await db.scan(reportersTable, {
            filterByFormula: `{slack_id} = "${event.user}"`,
        }))[0];

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
            view: await reporterHome(reporter.firstName, reporter.slackId),
        });
    })
};
