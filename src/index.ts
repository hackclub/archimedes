const { App } = await import("@slack/bolt");
import { version } from "../package.json";
import { logger, env, replaceAsync } from "./util";
import { Client as NotionClient } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";
import slackify from "slackify-markdown";

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

const notion = new NotionClient({
  auth: env.NOTION_SECRET,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

async function exportReadyToPublishPages() {
  // Get all the pages that've been marked as "Ready to publish"
  // (aka queued for publishing)
  const res = await notion.databases.query({
    database_id: env.NOTION_DATABASE_ID,
    filter: {
      property: "Status",
      status: { equals: "Ready to publish" },
    },
  });
  const pages = res.results.filter(
    (p): p is PageObjectResponse => "properties" in p
  );

  // For each page: convert to Markdown, get title, get email subject
  for (const page of pages) {
    const titleProp = page.properties.Name;
    if (titleProp.type !== "title") {
      throw new Error(
        `Title property is not a title type: ${JSON.stringify(titleProp)}. Have you actually set the title?`
      );
    }
    const titleText = titleProp.title[0]?.plain_text || page.id;

    const emailSubjectProp = page.properties["Email subject"];
    if (emailSubjectProp.type !== "rich_text") {
      throw new Error(
        `Email subject property is not a rich text type: ${JSON.stringify(
          emailSubjectProp
        )}. Have you actually set the email subject?`
      );
    }
    const emailSubjectText = emailSubjectProp.rich_text[0]?.plain_text;

    // convert
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks).parent;
    const mrkdwnString = slackify(mdString).replaceAll("\n***\n", ""); // remove any dividers

    const mainAuthors = page.properties["Main author"].people
      .map((person) => person.name)
      .join(", ");

    await app.client.chat.postMessage({
      channel: env.HAPPENINGS_CHANNEL_ID,
      text: mrkdwnString,
      mrkdwn: true,
    });
  }
}

await exportReadyToPublishPages();

if (env.NODE_ENV === "development") {
  logger.warn("Running in development mode");
}

await app.start();
logger.info(`Running Archimedes v${version}`);
