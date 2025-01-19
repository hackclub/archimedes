import type { Story } from "../../airtable";

export function stageRequest(story: Story) {
    return {
        text: `${story.headline} - ${story.shortDescription}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: story.headline,
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: story.shortDescription
                }
            },
            {
                type: "divider"
            },
            JSON.parse(story.longArticleRt),
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Authored by *${story.authorsName}*`
                    }
                ]
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: ":white_check_mark: Approve Story",
                            emoji: true
                        },
                        value: story.id,
                        action_id: "approve-story"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: ":x: Reject Story",
                            emoji: true
                        },
                        value: story.id,
                        action_id: "reject-story"
                    }
                ]
            }
        ]
    };
}