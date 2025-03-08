import type Slack from "@slack/bolt";
import { db, storiesTable } from "../airtable";
import publishModal from "../blocks/publishing/publishModal";
import { logger } from "../util";

export default function (app: Slack.App) {
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
        `Cannot move story ${storyId} down as it's already at the bottom`
      );
      return;
    }

    // Swap the story with the one below it
    const newOrder = [...storyOrder];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];

    const approvedStories = await db.scan(storiesTable, {
      filterByFormula: `{status} = "Approved"`,
    });

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

  app.action("move_story_to_top", async ({ ack, body, client }) => {
    await ack();

    const action = (body as Slack.BlockAction).actions[0] as Slack.ButtonAction;
    const storyId = action.value!;

    // Get the current story order from private_metadata
    const view = (body as Slack.BlockAction).view!;
    const metadata = JSON.parse(view.private_metadata || "{}");
    const storyOrder = metadata.storyOrder || [];

    // Find the index of the story to move
    const index = storyOrder.indexOf(storyId);
    if (index === -1) {
      logger.debug(`Story ${storyId} not found in the order`);
      return;
    }

    const newOrder = [...storyOrder];
    newOrder.splice(index, 1); // Remove the story from its current position
    newOrder.unshift(storyId); // Add it to the beginning

    const approvedStories = await db.scan(storiesTable, {
      filterByFormula: `{status} = "Approved"`,
    });

    try {
      await client.views.update({
        view_id: view.id,
        view: publishModal(approvedStories, newOrder),
      });
      logger.debug(`Moved story ${storyId} to the top of the order`);
    } catch (error) {
      logger.error(`Error updating view: ${error}`);
    }
  });
}
