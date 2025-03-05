import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";

export default (
	approvedStories: Story[],
	storyOrder?: string[],
): Slack.types.ModalView => {
	// If storyOrder is provided, reorder the stories accordingly
	let orderedStories = [...approvedStories];
	if (storyOrder && storyOrder.length > 0) {
		// Create a map for quick lookup
		const storyMap = new Map(approvedStories.map((story) => [story.id, story]));
		// Reorder based on the provided order
		orderedStories = storyOrder
			.map((id) => storyMap.get(id))
			.filter((story): story is Story => !!story);

		// Add any stories that might not be in the order array (e.g., newly approved stories)
		const orderedIds = new Set(storyOrder);
		const missingStories = approvedStories.filter(
			(story) => !orderedIds.has(story.id),
		);
		orderedStories = [...orderedStories, ...missingStories];
	}
	// Store the current order of story IDs in private_metadata
	const storyIds = orderedStories.map((story) => story.id);

	return {
		type: "modal",
		callback_id: "publish-story-modal",
		private_metadata: JSON.stringify({ storyOrder: storyIds }),
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
					text: `*${orderedStories.length}* ${orderedStories.length === 1 ? "story" : "stories"} will be published as a #happenings message and as an email.`,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "*Story Order*\nYou can reorder the stories using the buttons below. The stories will appear in this order in the published message and email.",
				},
			},
			...orderedStories.map((story, index) => ({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*${index + 1}. ${story.headline}*\n${story.shortDescription.substring(0, 100)}${story.shortDescription.length > 100 ? "..." : ""}`,
				},
				accessory: {
					type: "button",
					text: {
						type: "plain_text",
						text:
							index === orderedStories.length - 1
								? ":arrow_up: Move to Top"
								: ":arrow_down: Move Down",
						emoji: true,
					},
					action_id:
						index === orderedStories.length - 1
							? "move_story_to_top"
							: "move_story_down",
					value: story.id,
				},
			})),
			{
				type: "divider",
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
