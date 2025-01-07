export default {
    type: "home" as const,
    blocks: [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "You're not a reporter!",
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Since you're not a reporter, you can't suggest stories. Sorry!"
            }
        }
    ]
}