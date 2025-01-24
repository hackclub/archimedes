import { z } from "zod";

const Env = z.object({
    SLACK_BOT_TOKEN: z.string(),
    SLACK_APP_TOKEN: z.string(),
    AIRTABLE_API_KEY: z.string(),
    PLUNK_API_KEY: z.string(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
    APPROVALS_CHANNEL_ID: z.string(),
    HAPPENINGS_CHANNEL_ID: z.string(),
    NODE_ENV: z.enum(["development", "production"])
});
export const env = Object.freeze(Env.parse(process.env));
