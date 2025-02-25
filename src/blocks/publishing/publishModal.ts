import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";

export default (approvedStories: Story[]): Slack.types.ModalView => {
	return {
		type: "modal",
		callback_id: "publish-story-modal",
		title: {
			type: "plain_text",
			text: "Publish Issue",
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
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*${approvedStories.length}* ${approvedStories.length === 1 ? "story" : "stories"} will be published as a #happenings message and as an email.`,
				},
			},
			{
				type: "input",
				block_id: "subject_input",
				element: {
					type: "plain_text_input",
					action_id: "subject",
					placeholder: {
						type: "plain_text",
						text: "e.g. Happenings Issue #25",
					},
				},
				label: {
					type: "plain_text",
					text: "Subject",
					emoji: true,
				},
			},
			{
				type: "input",
				block_id: "intro_input",
				element: {
					type: "rich_text_input",
					action_id: "intro",
				},
				label: {
					type: "plain_text",
					text: "Intro",
					emoji: true,
				},
			},
			{
				type: "input",
				block_id: "conclusion_input",
				element: {
					type: "rich_text_input",
					action_id: "conclusion",
				},
				label: {
					type: "plain_text",
					text: "Conclusion",
					emoji: true,
				},
			},
		],
	};
};
