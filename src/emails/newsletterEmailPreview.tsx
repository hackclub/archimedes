import type { Story } from "../airtable";
// For dev purposes :)
import Email from "./newsletterEmail";

export default function NewsletterEmailPreview() {
	const stories: Pick<Story, "id" | "headline" | "longArticle" | "image">[] = [
		{
			id: "1",
			headline: ":scrapyard: Scrapyard",
			longArticle:
				"This is a really cool *email preview* with Slack mrkdwn! Here's an emoji: :yay:, and here's a link: https://slack.com. Here's a HTML link: <a href='https://slack.com'>Slack</a>",
			image: null,
		},
		{
			id: "2",
			headline: "Normal",
			longArticle: "This is a normal story. Boring :/",
			image: null,
		},
		{
			id: "3",
			headline: ":yay: WHAT A LEEK LADS :lfg:",
			image:
				"https://hc-cdn.hel1.your-objectstorage.com/s/v3/347db873d955d124e9e6960ec04af243e5540027_image.png",
			longArticle:
				"THAT'S RIGHT FELLAS, *THE LEEKS ARE HERE!* JOIN #hackclub-leeks!!!",
		},
		{
			id: "4",
			headline: "Usergroup/user/channel name",
			longArticle: "@fire-fighters #skyfalls-airport <@U059VC0UDEU>",
			image: null,
		},
	];
	return (
		<Email
			// biome-ignore lint/suspicious/noExplicitAny: doesn't really matter, since the fields aren't even used anyway
			stories={stories as any}
			intro="This is a really cool *email preview* with Slack mrkdwn! Here's an emoji: :yay:, and here's a link: https://slack.com"
			conclusion="This is the conclusion. :lfg:"
		/>
	);
}
