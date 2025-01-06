const { App } = await import("@slack/bolt");
import { version } from '../package.json';
import logger from "./logger";
import { env } from "./env";

import * as events from "./events";

const app = new App({
    token: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: true,
});

for (const [name, event] of Object.entries(events)) {
    event(app);
    logger.info(`Registered event: ${name}`);
}

await app.start(env.PORT);
logger.info(`Running Archimedes v${version}`);