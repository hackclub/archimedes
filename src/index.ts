const { App } = await import("@slack/bolt");
import { version } from '../package.json';
import logger from "./logger";
import { env } from "./env";

import * as events from "./events";
import * as actions from "./actions"
import * as commands from "./commands"
import type { LogLevel } from '@slack/bolt';

const app = new App({
    token: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: true,
    logger: {
        // Cannot spread due to https://github.com/pinojs/pino/issues/545
        debug: (args) => logger.debug(args),
        info: (args) => logger.info(args),
        warn: (args) => logger.warn(args),
        error: (args) => logger.error(args),
        setLevel: (level: string) => {
            logger.level = level
        },
        getLevel: () => logger.level as LogLevel,
        setName: () => { }
    }
});

for (const [name, event] of Object.entries(events)) {
    event(app);
    logger.debug(`Registered event: ${name}`);
}

for (const [name, action] of Object.entries(actions)) {
    action(app);
    logger.debug(`Registered action: ${name}`);
}

for (const [name, command] of Object.entries(commands)) {
    command(app);
    logger.debug(`Registered command: ${name}`);
}

await app.start();
logger.info(`Running Archimedes v${version}`);