export default (userId: string) => ({
    type: "modal" as const,
    private_metadata: userId,
    callback_id: "submit-article-modal",
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
            block_id: "headline_input",
            element: {
                type: "plain_text_input",
                action_id: "headline",
                placeholder: {
                    type: "plain_text",
                    text: "e.g. Wild Orpheus spotted in the streets of Vermont"
                },
            },
            label: {
                type: "plain_text",
                text: "Headline",
                emoji: true
            }
        },
        {
            type: "input",
            block_id: "short_description_input",
            element: {
                type: "rich_text_input",
                action_id: "short_description",
            },
            label: {
                type: "plain_text",
                text: "Short description",
                emoji: true
            }
        },
        {
            type: "input",
            block_id: "long_article_input",
            element: {
                type: "rich_text_input",
                action_id: "long_article",
            },
            label: {
                type: "plain_text",
                text: "Long article",
                emoji: true
            }
        }
    ]
})