import type { Story } from "../../airtable";

export default (intro: string, conclusion: string, stories: Story[]) => {
	const storyMrkdwn = stories
		.map((story) => `*${story.headline}*\n${story.shortDescription}`)
		.join("\n\n");
	// Is this really the best way to do this?
	// I used to have some stuff with sections and `shortDescriptionRt` and whatnot, but the problem was that it
	// was really annoying to actually *read* the newsletter, so now we just send it as one big mrkdwn message.
	return {
		text: `${intro}\n\n${storyMrkdwn}\n\n${conclusion}`,
		type: "mrkdwn",
	};
};
