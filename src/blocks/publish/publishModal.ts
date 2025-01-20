import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";
import logger from "../../logger";

export default (stories: Story[]): Slack.types.ModalView => {
    const selectOptions = stories.filter(story => story.status === "Approved").map(story => ({
        text: {
            type: "plain_text",
            text: story.headline,
            emoji: true
        },
        value: story.id
    }));
    if (selectOptions.length === 0) {
        throw logger.error("No stories to publish");
    }

    return {
        type: "modal",
        callback_id: "publish-story-modal",
        title: {
            type: "plain_text",
            text: "Publish Issue",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "The selected stories will be published as a #happenings message and as an email. Would you like to continue?"
                }
            }
        ]
    };
}