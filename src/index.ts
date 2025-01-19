const { App } = await import("@slack/bolt");
import { version } from '../package.json';
import logger from "./logger";
import { env } from "./env";

import * as events from "./events";
import * as actions from "./actions"
import * as commands from "./commands"

const app = new App({
    token: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: true,
});

for (const [name, event] of Object.entries(events)) {
    event(app);
    logger.info(`Registered event: ${name}`);
}

for (const [name, action] of Object.entries(actions)) {
    action(app);
    logger.info(`Registered action: ${name}`);
}

for (const [name, command] of Object.entries(commands)) {
    command(app);
    logger.info(`Registered command: ${name}`);
}

await app.start();
logger.info(`Running Archimedes v${version}`);