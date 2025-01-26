# Archimedes
A helpful newspaper bot for [Hack Club.](https://hackclub.com/) Archimedes handles **story writing**, **editor approvals** (like the #confessions channel), and **auto-generation** of both Slack messages and emails sent out to folks subscribed.

_Here from High Seas?_ I'd recommend watching [the demo video](https://cloud-40lv302ky-hack-club-bot.vercel.app/0a_storytelling_bot.mp4) to get a better idea of how Archimedes works!

## Features

### Rich text editor

### Staging/approvals system

Reporters initially write **drafts** of their stories in Archimedes' app home. When they're ready, they can click a button to stage their story for publication. A message will then be sent in the approvals channel, where editors can approve or reject the story.

![image](https://cloud-mrbjhqh91-hack-club-bot.vercel.app/0image.png)

### Auto-generation

Archimedes will automatically generate both a Slack message in the #happenings channel, and an email for each issue. Slack-specific features such as user mentions and emojis will be handled automatically.

![image](https://cloud-qolkvumrf-hack-club-bot.vercel.app/0snippetx-2025-01-25.png)

## Development
To install dependencies:

```bash
bun install
```

Now, let's configure our environment variables.

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
export AIRTABLE_API_KEY=...
```

We also need to setup the `airtable.json` file, which contains information about our Airtable base. Let's start by running the schema generator:

```bash
AIRTABLE_API_KEY=... AIRTABLE_BASE_ID=... bunx airtable-ts-codegen
```

You then need to move the `mappings` parts to the `airtable.json` file, as well as the `baseId` and `tableId`s.

To run:

```bash
bun dev
```
