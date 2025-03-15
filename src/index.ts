const { App } = await import("@slack/bolt");
import { version } from "../package.json";
import { db, tokensTable } from "./airtable";
import { env } from "./env";
import { AUTHORIZE_URL, logger } from "./util";

import { LogLevel } from "@slack/bolt";
import * as actions from "./actions";
import * as commands from "./commands";
import * as events from "./events";

logger.debug(`Starting Archimedes v${version}`);
const app = new App({
	token: env.SLACK_BOT_TOKEN,
	appToken: env.SLACK_APP_TOKEN,
	socketMode: true,
	customRoutes: [
		{
			path: "/health-check",
			method: ["GET"],
			handler: (req, res) => {
				res.writeHead(200);
				res.end(`Things are going just fine at ${req.headers.host}!`);
			},
		},
		{
			path: "/authorize-oauth2",
			method: ["GET"],
			handler: (req, res) => {
				const params = new URLSearchParams(req.url!.split("?")[1]);
				const code = params.get("code");

				if (!code) {
					res.writeHead(400);
					res.end("No code provided");
					return;
				}

				app.client.oauth.v2
					.access({
						code,
						client_id: env.SLACK_CLIENT_ID,
						client_secret: env.SLACK_CLIENT_SECRET,
					})
					.then((result) => {
						if (!result.ok) {
							res.writeHead(500);
							res.end(`Error: ${result.error}`);
							return;
						}
						if (result.team?.id !== env.SLACK_TEAM_ID) {
							res.writeHead(400);
							res.end("Please use the Hack Club Slack workspace.");
							return;
						}
						db.insert(tokensTable, {
							slackId: result.authed_user?.id,
							token: result.access_token,
							environment: env.NODE_ENV,
						}).then(() => {
							res.writeHead(200);
							res.end("Done! You can close this window.");
						});
					})
					.catch((error) => {
						res.writeHead(500);
						res.end(`Error: ${error.message}`);
					});
			},
		},
		{
			path: "/login",
			method: ["GET"],
			handler: (_, res) => {
				res.writeHead(302, { Location: AUTHORIZE_URL });
				res.end();
			},
		},
	],

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
