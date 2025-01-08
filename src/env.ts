import { z } from "zod";

const Env = z.object({
    SLACK_BOT_TOKEN: z.string(),
    SLACK_APP_TOKEN: z.string(),
    AIRTABLE_API_KEY: z.string(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
});
export const env = Env.parse(process.env);
