import type { Story } from "../../airtable";
import type Slack from "@slack/bolt";
import logger from "../../logger";

export default (userId: string, stories: Story[]): Slack.types.ModalView => {
    const selectOptions = stories.filter(story => story.status === "Draft").map(story => ({
        text: {
            type: "plain_text",
            text: story.headline,
            emoji: true
        },
        value: story.id
    }));
    if (selectOptions.length === 0) {
        throw logger.error("No stories to stage");
    }

    return {
        type: "modal",
        private_metadata: userId,
        callback_id: "stage-story-modal",
        title: {
            type: "plain_text",
            text: "Stage a story",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Stage",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "input",
                block_id: "story_selector",
                element: {
                    type: "static_select",
                    initial_option: selectOptions[0],
                    placeholder: {
                        type: "plain_text",
                        text: "e.g. Wild Orpheus spotted in the streets of Vermont",
                        emoji: true
                    },
                    options: selectOptions,
                    action_id: "select_input"
                },
                label: {
                    type: "plain_text",
                    text: "Story being staged",
                    emoji: true
                }
            } as Slack.types.InputBlock
        ]
    };
}