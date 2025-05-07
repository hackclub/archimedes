import pino from "pino";
import { z } from "zod";

const Env = z.object({
  SLACK_BOT_TOKEN: z.string(),
  SLACK_APP_TOKEN: z.string(),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_TEAM_ID: z.string(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  HAPPENINGS_CHANNEL_ID: z.string(),
  NODE_ENV: z.enum(["development", "production"]),
  LOOPS_SESSION_TOKEN: z.string(),
});
export const env = Object.freeze(Env.parse(process.env));

export const logger = pino({
  level: env.LOG_LEVEL,
});
