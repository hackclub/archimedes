const { App } = await import("@slack/bolt");
import { version } from "../package.json";
import { env } from "./env";
import logger from "./logger";

import { LogLevel } from "@slack/bolt";
import * as actions from "./actions";
import * as commands from "./commands";
import * as events from "./events";

logger.debug(`Starting Archimedes v${version}`);
const app = new App({
	token: env.SLACK_BOT_TOKEN,
	appToken: env.SLACK_APP_TOKEN,
	socketMode: true,
	logLevel: LogLevel.INFO,
	logger: {
		// Cannot spread due to https://github.com/pinojs/pino/issues/545
		debug: () => {},
		info: (args) => logger.info(args),
		warn: (args) => logger.warn(args),
		error: (args) => logger.error(args),
		setLevel: () => {},
		getLevel: () => logger.level as LogLevel,
		setName: () => {},
	},
});

if (env.NODE_ENV === "development") {
	logger.warn("Running in development mode");
}

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
