import type Slack from '@slack/bolt';
import type { BlockAction } from '@slack/bolt';
import logger from "../logger";
import { db, storiesTable } from "../airtable"
import { draftStory, stageStory, updateStory, getReporterBySlackId, getStoriesByUserId } from "../data"
import { richTextBlockToMrkdwn } from '../util';

import notAReporter from "../blocks/appHome/notAReporter";
import reporterHome from "../blocks/appHome/reporterHome";
import storyModal from "../blocks/appHome/storyModal";
import stageModal from "../blocks/appHome/stageModal";

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

    app.action("stage-story-button", async ({ ack, client, body }) => {
        await ack();
        logger.debug(`(Stage Story) Fetching stories for ${body.user.id}`);
        const stories = await getStoriesByUserId(body.user.id);

        await client.views.open({
            trigger_id: (body as BlockAction).trigger_id,
            view: stageModal(body.user.id, stories),
        });
    });

    app.action("story-selector", async ({ ack }) => {
        await ack();
    });

    app.view("stage-story-modal", async ({ ack, view, client }) => {
        await ack();

        const userId: string = view.private_metadata;
        // FIXME: BAD BAD BAD. NO. NEIN. NICHT GUT.
        // However, I want to get this working first.
        // This is a band-aid.
        // This is not good.
        // Mahad, please fix this.
        const storyId = view.state.values[Object.keys(view.state.values)[0]].select_input.selected_option!.value;
        const story = await db.get(storiesTable, storyId);
        logger.debug(`(Stage Story) Updating story ${storyId}`);

        logger.debug(`Fetching reporter for ${userId}`);
        const reporter = await getReporterBySlackId(userId);

        await stageStory(client, story);

        await client.views.publish({
            user_id: userId,
            view: await reporterHome(reporter.firstName, reporter.slackId),
        });
    })

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
        const reporter = await getReporterBySlackId(userId);

        if (storyId) {
            logger.debug(`Updating story for ${userId} (${headline})`);
            await updateStory(storyId, {
                headline,
                shortDescription,
                longArticle,
                shortDescriptionRt: JSON.stringify(shortDescriptionRt),
                longArticleRt: JSON.stringify(longArticleRt),
                reporterId: reporter.id
            });
        } else {
            logger.debug(`Inserting story for ${userId} (${headline})`);
            await draftStory({
                headline,
                shortDescription,
                longArticle,
                shortDescriptionRt: JSON.stringify(shortDescriptionRt),
                longArticleRt: JSON.stringify(longArticleRt),
                reporterId: reporter.id
            });
        }

        await client.views.publish({
            user_id: userId,
            view: await reporterHome(reporter.firstName, reporter.slackId),
        });
    })

    app.event("app_home_opened", async ({ event, client }) => {
        logger.debug(`Received app_home_opened event from ${event.user} - scanning for reporter`);
        const reporter = await getReporterBySlackId(event.user);

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
