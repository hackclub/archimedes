import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";

export function stageRequest(
	story: Story,
	status: "Awaiting Review" | "Approved" | "Rejected" = "Awaiting Review",
	reviewerId?: string,
) {
	const pfps = story.slackIdRollup.map((slackId) => ({
		type: "image",
		image_url: `https://cachet.dunkirk.sh/users/${slackId}/r`,
		alt_text: `@${slackId} avatar`,
	}));
	return {
		text: `${story.headline} - ${story.shortDescription}`,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: story.headline,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: story.shortDescription,
				},
			},
			story.image
				? {
						type: "image",
						image_url: story.image,
						alt_text: story.headline,
					}
				: undefined,
			{
				type: "divider",
			},
			JSON.parse(story.longArticleRt),
			{
				type: "context",
				elements: [
					...pfps,
					{
						type: "mrkdwn",
						text: `Authored by *${story.authorsName}*`,
					},
				],
			},
			status === "Awaiting Review"
				? {
						type: "actions",
						elements: [
							{
								type: "button",
								text: {
									type: "plain_text",
									text: ":white_check_mark: Approve Story",
									emoji: true,
								},
								value: story.id,
								action_id: "approve-story",
							},
							{
								type: "button",
								text: {
									type: "plain_text",
									text: ":x: Reject Story",
									emoji: true,
								},
								value: story.id,
								action_id: "reject-story",
							},
						],
					}
				: {
						type: "section",
						text: {
							type: "mrkdwn",
							text: `Story *${status.toLowerCase()}* by <@${reviewerId}>`,
						},
					},
		].filter(Boolean) as Slack.types.Block[],
	};
}
