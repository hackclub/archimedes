import TTLCache from "@isaacs/ttlcache";
import type Slack from "@slack/bolt";
import {
	type Reporter,
	type Story,
	db,
	reportersTable,
	storiesTable,
} from "./airtable";
import { stageRequest } from "./blocks/approvals/stageRequest";
import { env } from "./env";

export type Details = {
	headline: string;
	shortDescription: string;
	shortDescriptionRt: string;
	longArticle: string;
	longArticleRt: string;
	reporterId: string;
	image?: string;
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
	]);
}

export async function draftStory(details: Details) {
	console.log(details);
	await db.insert(storiesTable, {
		...details,
		authors: [details.reporterId],
		status: "Draft",
		newsletters: [],
		happenings: [],
		image: details.image || null,
	});
}

export async function updateStory(storyId: string, details: Details) {
	console.log("deets", details);
	await db.update(storiesTable, {
		id: storyId,
		...details,
		image: details.image || null,
	});
}

// Cache for 1 hour
const reportersCache = new TTLCache({ ttl: 60 * 60 * 1000 });
export async function getReporterBySlackId(slackId: string) {
	const cacheResponse = reportersCache.get(slackId);
	if (cacheResponse) return cacheResponse as Reporter;

	const reporter = (
		await db.scan(reportersTable, {
			filterByFormula: `{slack_id} = "${slackId}"`,
		})
	)[0] as Reporter | undefined;
	if (!reporter) return;

	reportersCache.set(slackId, reporter);
	return reporter;
}

export async function getStoriesByUserId(userId: string) {
	const stories = await db.scan(storiesTable);
	// FIXME: this isn't very efficient - the ideal way to fix this would be to
	// use `filterByFormula` on the `stories` table, but that doesn't work
	return stories.filter((story) => story.slackIdRollup.includes(userId));
}

const displayNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });
export async function getDisplayNameBySlackId(
	slackId: string,
	client: Slack.webApi.WebClient,
) {
	const cacheResponse = displayNamesCache.get(slackId);
	if (cacheResponse) return cacheResponse as string;

	const user = await client.users.info({
		user: slackId,
	});
	const displayName =
		user.user?.profile?.display_name || user.user?.name || "Archimedes";
	displayNamesCache.set(slackId, displayName);
	return displayName;
}

const channelNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });
export async function getChannelNameById(
	channelId: string,
	client: Slack.webApi.WebClient,
) {
	const cacheResponse = channelNamesCache.get(channelId);
	if (cacheResponse) return cacheResponse as string;

	const channel = await client.conversations.info({
		channel: channelId,
	});

	const channelName = channel.channel?.name;
	if (channelName) channelNamesCache.set(channelId, channelName);

	return channelName || channelId;
}
