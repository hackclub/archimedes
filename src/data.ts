import { db, reportersTable, storiesTable } from "./airtable";

export type Details = {
    headline: string,
    shortDescription: string,
    shortDescriptionRt: string,
    longArticle: string,
    longArticleRt: string,
    reporterId: string
};

export async function publishStory(storyId: string) {
    await db.update(storiesTable, {
        id: storyId,
        status: "Awaiting Review",
    });
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
        filterByFormula: `{slack_id} = "${slackId}"`,
    }))[0];
}