import { db, storiesTable } from "../../airtable"
import logger from "../../logger";

export default async (firstName: string, slackId: string) => {
    const stories = await db.scan(storiesTable, {
        filterByFormula: `FIND("${slackId}", {slack_id_rollup}) > 0`,
    })
    logger.info(`Found ${stories.length} stories for reporter ${slackId}`);
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