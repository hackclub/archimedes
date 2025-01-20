import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";

export default (stories: Story[]): Slack.types.ModalView => {
    const approvedStories = stories.filter(story => story.status === "Approved");
    if (approvedStories.length === 0) {
        throw new Error("No stories to publish");
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
                    text: `*${approvedStories.length}* stories will be published as a #happenings message and as an email. Would you like to continue?`
                }
            },
        ]
    };
}