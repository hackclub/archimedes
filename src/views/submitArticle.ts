export default {
    type: "modal" as const,
    title: {
        type: "plain_text" as const,
        text: "Submit an article",
        emoji: true
    },
    submit: {
        type: "plain_text" as const,
        text: "Submit",
        emoji: true
    },
    close: {
        type: "plain_text" as const,
        text: "Cancel",
        emoji: true
    },
    blocks: [
        {
            type: "input",
            element: {
                type: "plain_text_input",
                placeholder: {
                    type: "plain_text",
                    text: "e.g. Wild Orpheus spotted in the streets of Vermont"
                },
                action_id: "plain_text_input-action"
            },
            label: {
                type: "plain_text",
                text: "Headline",
                emoji: true
            }
        },
        {
            type: "input",
            element: {
                type: "rich_text_input",
                action_id: "rich_text_input-action"
            },
            label: {
                type: "plain_text",
                text: "Short description",
                emoji: true
            }
        },
        {
            type: "input",
            element: {
                type: "rich_text_input",
                action_id: "rich_text_input-action"
            },
            label: {
                type: "plain_text",
                text: "Long article",
                emoji: true
            }
        }
    ]
}