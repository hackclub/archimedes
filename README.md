# archimedes
A helpful newspaper bot for [Hack Club.](https://hackclub.com/)

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
