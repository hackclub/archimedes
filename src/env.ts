import { z } from "zod";

const Env = z.object({
	SLACK_BOT_TOKEN: z.string(),
	SLACK_APP_TOKEN: z.string(),
	AIRTABLE_API_KEY: z.string(),
	SLACK_CLIENT_ID: z.string(),
	SLACK_CLIENT_SECRET: z.string(),
	SLACK_TEAM_ID: z.string(),
	SLACK_REDIRECT_URI: z.string().url(),
	SLACK_LOOPS_NOTIFS_CHANNEL_ID: z.string().url().optional(),
	LOG_LEVEL: z
		.enum(["debug", "info", "warn", "error", "fatal"])
		.default("info"),
	APPROVALS_CHANNEL_ID: z.string(),
	HAPPENINGS_CHANNEL_ID: z.string(),
	NODE_ENV: z.enum(["development", "production"]),
	LOOPS_SESSION_TOKEN: z.string(),
});
export const env = Object.freeze(Env.parse(process.env));
