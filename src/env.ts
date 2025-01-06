import { z } from "zod";

const Env = z.object({
    SLACK_BOT_TOKEN: z.string(),
    SLACK_APP_TOKEN: z.string(),
    AIRTABLE_API_KEY: z.string(),
});
export const env = Env.parse(process.env);
