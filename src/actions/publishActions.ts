import type Slack from "@slack/bolt";
import { type Story, db, storiesTable } from "../airtable";
import publishModal from "../blocks/publishing/publishModal";
import logger from "../logger";

export default function (app: Slack.App) {
	// Handle the "move_story_up" action
	app.action("move_story_up", async ({ ack, body, client }) => {
		await ack();

		// Get the story ID from the action
		const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
		const storyId = action.value!;

		// Get the current story order from private_metadata
		const view = (body as Slack.BlockAction).view!;
		const metadata = JSON.parse(view.private_metadata || "{}");
		const storyOrder = metadata.storyOrder || [];

		// Find the index of the story to move
		const index = storyOrder.indexOf(storyId);
		if (index <= 0) {
			logger.debug(
				`Cannot move story ${storyId} up as it's already at the top`,
			);
			return;
		}

		// Swap the story with the one above it
		const newOrder = [...storyOrder];
		[newOrder[index - 1], newOrder[index]] = [
			newOrder[index],
			newOrder[index - 1],
		];

    // Fetch the current approved stories
    const approvedStories = await db.scan(storiesTable, {
      filterByFormula: `{status} = "Approved"`,
    });

    // Update the view with the new order
    try {
      await client.views.update({
        view_id: view.id,
        view: publishModal(approvedStories, newOrder),
      });
      logger.debug(`Moved story ${storyId} up in the order`);
    } catch (error) {
      logger.error(`Error updating view: ${error}`);
    }
	});

	// Handle the "move_story_down" action
	app.action("move_story_down", async ({ ack, body, client }) => {
		await ack();

		// Get the story ID from the action
		const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
		const storyId = action.value!;

		// Get the current story order from private_metadata
		const view = (body as Slack.BlockAction).view!;
		const metadata = JSON.parse(view.private_metadata || "{}");
		const storyOrder = metadata.storyOrder || [];

		// Find the index of the story to move
		const index = storyOrder.indexOf(storyId);
		if (index === -1 || index >= storyOrder.length - 1) {
			logger.debug(
				`Cannot move story ${storyId} down as it's already at the bottom`,
			);
			return;
		}

		// Swap the story with the one below it
		const newOrder = [...storyOrder];
		[newOrder[index], newOrder[index + 1]] = [
			newOrder[index + 1],
			newOrder[index],
		];

    // Fetch the current approved stories
    const approvedStories = await db.scan(storiesTable, {
      filterByFormula: `{status} = "Approved"`,
    });

    // Update the view with the new order
    try {
      await client.views.update({
        view_id: view.id,
        view: publishModal(approvedStories, newOrder),
      });
      logger.debug(`Moved story ${storyId} down in the order`);
    } catch (error) {
      logger.error(`Error updating view: ${error}`);
    }
	});
}
