import type Slack from "@slack/bolt";

export default {
	type: "home",
	blocks: [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: "You're not a reporter!",
				emoji: true,
			},
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: "Since you're not a reporter, you can't suggest stories. Sorry!",
			},
		},
	],
} as Slack.types.HomeView;
