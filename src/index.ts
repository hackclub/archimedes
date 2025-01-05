import { z } from "zod";
const { App } = await import("@slack/bolt");
import logger from "./logger";
import { version } from '../package.json';

const Env = z.object({
    SLACK_BOT_TOKEN: z.string(),
    SLACK_APP_TOKEN: z.string(),
    PORT: z.coerce.number().default(3000),
});
const env = Env.parse(process.env);

const app = new App({
    token: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: true,
});

await app.start(env.PORT);
logger.info(`Running Archimedes v${version}`);