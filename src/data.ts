import { db, reportersTable, storiesTable, type Story } from "./airtable";
import { env } from "./env";
import { stageRequest } from "./blocks/approvals/stageRequest";
import type Slack from "@slack/bolt";

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

export async function getReporterBySlackId(slackId: string) {
    return (await db.scan(reportersTable, {
        filterByFormula: `{Slack ID} = "${slackId}"`,
    }))[0];
}