import type Slack from "@slack/bolt";
import type { BlockAction } from "@slack/bolt";
import { richTextBlockToMrkdwn } from "../util";
import { draftStory, getReporterBySlackId } from "../data";

import reporterHome from "../blocks/appHome/reporterHome";
import storyModal from "../blocks/appHome/storyModal";

export default (app: Slack.App) => {
	app.action("new-story-button", async ({ ack, client, body }) => {
		await ack();
		await client.views.open({
			trigger_id: (body as BlockAction).trigger_id,
			view: storyModal(body.user.id),
		});
	});

	app.view("submit-story-modal", async ({ ack, view, client }) => {
		await ack();

		const userId = view.private_metadata;
		const headline = view.state.values.headline_input.headline.value!;
		const shortDescriptionRt =
			view.state.values.short_description_input.short_description
				.rich_text_value!;
		const shortDescription = richTextBlockToMrkdwn(shortDescriptionRt);
		const longArticleRt =
			view.state.values.long_article_input.long_article.rich_text_value!;
		const longArticle = richTextBlockToMrkdwn(longArticleRt);

		const reporter = await getReporterBySlackId(userId);

		await draftStory({
			headline,
			shortDescription,
			longArticle,
			reporterId: reporter!.id,
			shortDescriptionRt: JSON.stringify(shortDescriptionRt),
			longArticleRt: JSON.stringify(longArticleRt),
		});

		await client.views.publish({
			user_id: userId,
			view: await reporterHome(reporter!.firstName, reporter!.slackId),
		});
	});
};
