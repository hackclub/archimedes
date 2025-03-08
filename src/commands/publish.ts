import publishModal from "../blocks/publishing/publishModal";
import { getReporterBySlackId, publishStory } from "../data";
import { env } from "../env";
import { logger, richTextBlockToMrkdwn } from "../util";

import type Slack from "@slack/bolt";
import { type Story, db, storiesTable } from "../airtable";

export default function (app: Slack.App) {
	const PUBLISH_COMMAND =
		env.NODE_ENV === "development" ? "/dev-arch-publish" : "/arch-publish";
	app.command(PUBLISH_COMMAND, async ({ ack, client, body, respond }) => {
		await ack();
		const reporter = await getReporterBySlackId(body.user_id);
		if (!reporter) {
			await respond({
				text: "You are not a reporter, so you can't publish stories. Sorry :/",
				response_type: "ephemeral",
			});
			return;
		}
		if (!reporter.hasPublishingRights) {
			await respond({
				text: "You don't have publishing rights, so you can't publish stories. Sorry :/",
				response_type: "ephemeral",
			});
			return;
		}

		const approvedStories = await db.scan(storiesTable, {
			filterByFormula: `{status} = "Approved"`,
		});
		if (approvedStories.length === 0) {
			await respond({
				text: "No stories are ready to publish.",
				response_type: "ephemeral",
			});
			return;
		}

		await client.views.open({
			trigger_id: body.trigger_id,
			view: publishModal(approvedStories),
		});
	});

	app.view("publish-story-modal", async ({ ack, client, body, view }) => {
		await ack();
		logger.debug(
			{ requestedBy: body.user.id },
			"Processing publish-story-modal",
		);

		const subject = view.state.values.subject_input.subject.value!;
		const introMd = richTextBlockToMrkdwn(
			view.state.values.intro_input.intro.rich_text_value!,
		);
		const conclusionMd = richTextBlockToMrkdwn(
			view.state.values.conclusion_input.conclusion.rich_text_value!,
		);

		// Get all approved stories
		const approvedStories = await db.scan(storiesTable, {
			filterByFormula: `{status} = "Approved"`,
		});

		// Get the story order from the private_metadata
		let orderedStories = [...approvedStories];
		try {
			const metadata = JSON.parse(view.private_metadata || "{}");
			const storyOrder = metadata.storyOrder || [];

			if (storyOrder.length > 0) {
				// Create a map for quick lookup
				const storyMap = new Map(
					approvedStories.map((story) => [story.id, story]),
				);

				// Reorder based on the provided order
				const reorderedStories = storyOrder
					.map((id: string) => storyMap.get(id))
					.filter((story: Story) => !!story);

				// Add any stories that might not be in the order array (e.g., newly approved stories)
				const orderedIds = new Set(storyOrder);
				const missingStories = approvedStories.filter(
					(story) => !orderedIds.has(story.id),
				);

				orderedStories = [...reorderedStories, ...missingStories];
				logger.debug(
					`Using custom story order with ${orderedStories.length} stories`,
				);
			}
		} catch (error) {
			logger.error(`Error parsing story order: ${error}`);
			// Fall back to using the default order
		}

		await publishStory(
			client,
			body.user.id,
			orderedStories,
			subject,
			introMd,
			conclusionMd,
		);
	});
}
