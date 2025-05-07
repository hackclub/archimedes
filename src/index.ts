const { App } = await import("@slack/bolt");
import { version } from "../package.json";
import { logger, env } from "./util";

import type { LogLevel } from "@slack/bolt";

logger.debug(`Starting Archimedes v${version}`);
const app = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: env.LOG_LEVEL as LogLevel,
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

await app.start();
logger.info(`Running Archimedes v${version}`);
