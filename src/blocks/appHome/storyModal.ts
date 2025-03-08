import type Slack from "@slack/bolt";
import type { Story } from "../../airtable";

export default (userId: string, story?: Story): Slack.types.ModalView => ({
	type: "modal",
	private_metadata: JSON.stringify({
		userId,
		storyId: story?.id,
	}),
	callback_id: "submit-story-modal",
	title: {
		type: "plain_text",
		text: story ? "Edit story" : "Submit a story",
		emoji: true,
	},
	submit: {
		type: "plain_text",
		text: "Submit",
		emoji: true,
	},
	close: {
		type: "plain_text",
		text: "Cancel",
		emoji: true,
	},
	blocks: [
		{
			type: "input",
			block_id: "headline_input",
			element: {
				type: "plain_text_input",
				action_id: "headline",
				initial_value: story?.headline,
				placeholder: {
					type: "plain_text",
					text: "e.g. Wild Orpheus spotted in the streets of Vermont",
				},
			},
			label: {
				type: "plain_text",
				text: "Headline",
				emoji: true,
			},
		},
		{
			type: "input",
			block_id: "image_url_input",
			optional: true,
			element: {
				type: "url_text_input",
				action_id: "image_url",
				initial_value: story?.image || undefined,
				placeholder: {
					type: "plain_text",
					text: "e.g. https://cdn.skyfall.dev/...",
				},
			},
			label: {
				type: "plain_text",
				text: "Image URL",
				emoji: true,
			},
		},
		{
			type: "input",
			block_id: "short_description_input",
			element: {
				type: "rich_text_input",
				action_id: "short_description",
				initial_value: story?.shortDescription
					? JSON.parse(story.shortDescriptionRt)
					: undefined,
			},
			label: {
				type: "plain_text",
				text: "Short description",
				emoji: true,
			},
		},
		{
			type: "input",
			block_id: "long_article_input",
			element: {
				type: "rich_text_input",
				action_id: "long_article",
				initial_value: story?.longArticle
					? JSON.parse(story.longArticleRt)
					: undefined,
			},
			label: {
				type: "plain_text",
				text: "Long article",
				emoji: true,
			},
		},
	],
});
