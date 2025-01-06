export default (firstName: string) => {
    return {
        type: "home" as const,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `Hey, ${firstName}!`,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Create a new draft post. You'll be able to review it before it's sent for approval."
                },
                accessory: {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Draft Post",
                        emoji: true
                    },
                    action_id: "draft-post-button"
                }
            }
        ]
    }
}