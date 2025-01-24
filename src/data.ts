import { db, reportersTable, storiesTable, type Reporter, type Story } from "./airtable";
import { env } from "./env";
import { stageRequest } from "./blocks/approvals/stageRequest";
import type Slack from "@slack/bolt";
import TTLCache from "@isaacs/ttlcache";

export type Details = {
    headline: string,
    shortDescription: string,
    shortDescriptionRt: string,
    longArticle: string,
    longArticleRt: string,
    reporterId: string
};

export async function stageStory(client: Slack.webApi.WebClient, story: Story) {
    await Promise.all([
        db.update(storiesTable, {
            id: story.id,
            status: "Awaiting Review",
        }),
        client.chat.postMessage({
            channel: env.APPROVALS_CHANNEL_ID,
            ...stageRequest(story),
        }),
    ])
}

export async function draftStory(details: Details) {
    await db.insert(storiesTable, {
        headline: details.headline,
        shortDescription: details.shortDescription,
        shortDescriptionRt: details.shortDescriptionRt,
        longArticle: details.longArticle,
        longArticleRt: details.longArticleRt,
        authors: [details.reporterId],
        status: "Draft",
        newsletters: [],
        happenings: [],
    });
}

export async function updateStory(storyId: string, details: Details) {
    await db.update(storiesTable, {
        id: storyId,
        headline: details.headline,
        shortDescription: details.shortDescription,
        longArticle: details.longArticle,
        shortDescriptionRt: JSON.stringify(details.shortDescription),
        longArticleRt: JSON.stringify(details.longArticle),
    });
}

// Cache for 1 hour
const reportersCache = new TTLCache({ ttl: 60 * 60 * 1000 })
export async function getReporterBySlackId(slackId: string) {
    const cacheResponse = reportersCache.get(slackId);
    if (cacheResponse) return cacheResponse as Reporter;

    const reporter = (await db.scan(reportersTable, {
        filterByFormula: `{slack_id} = "${slackId}"`,
    }))[0] as Reporter | undefined;
    if (!reporter) return;

    reportersCache.set(slackId, reporter);
    return reporter;
}

export async function getStoriesByUserId(userId: string) {
    const stories = await db.scan(storiesTable);
    // FIXME: this isn't very efficient - the ideal way to fix this would be to
    // use `filterByFormula` on the `stories` table, but that doesn't work
    return stories.filter(story => story.slackIdRollup.includes(userId));
}

const displayNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 })
export async function getDisplayNameBySlackId(slackId: string, client: Slack.webApi.WebClient) {
    const cacheResponse = displayNamesCache.get(slackId);
    if (cacheResponse) return cacheResponse as string;

    const user = (await client.users.info({
        user: slackId
    }));
    const displayName = user.user?.profile?.display_name || user.user?.name || "Archimedes";
    displayNamesCache.set(slackId, displayName);
    return displayName;
}