import TTLCache from "@isaacs/ttlcache";
import JSZip from "jszip";
import LoopsClient from "loops-campaign-api";
import buildHappeningsMessage from "./blocks/publishing/happeningsMessage";
import Email from "./emails/newsletterEmail";

import { render } from "@react-email/components";
import type Slack from "@slack/bolt";
import {
	type Reporter,
	type Story,
	db,
	reportersTable,
	storiesTable,
} from "./airtable";
import { airtableJson } from "./airtable";
import { stageRequest } from "./blocks/approvals/stageRequest";
import { env } from "./env";
import { config } from "./featureConfig";
import { logger, runPasses } from "./util";

export type Details = Omit<Partial<Story>, "id"> & { reporterId: string };

// #region Publish
async function sendHappeningsMessage(
	client: Slack.webApi.WebClient,
	userId: string,
	stories: Story[],
	introMd: string,
	conclusionMd: string,
) {
	const userDetails = await client.users.info({
		user: userId,
	});

	await client.chat.postMessage({
		channel: env.HAPPENINGS_CHANNEL_ID,
		icon_url: userDetails.user?.profile?.image_original,
		username:
			userDetails.user?.profile?.display_name ||
			userDetails.user?.name ||
			"Archimedes",
		unfurl_links: false,
		unfurl_media: false,
		...buildHappeningsMessage(introMd, conclusionMd, stories),
	});
	logger.debug({ requestedBy: userId }, "Sent happenings message");
}

const loopsClient = new LoopsClient(env.LOOPS_SESSION_TOKEN);
async function sendNewsletter(
	userId: string,
	stories: Story[],
	subject: string,
	introMd: string,
	conclusionMd: string,
	client: Slack.webApi.WebClient,
) {
	logger.debug(
		{ requestedBy: userId },
		"sendNewsletter: Running passes on mrkdwn",
	);
	const finalIntroMd = await runPasses(introMd, client);
	const finalConclusionMd = await runPasses(conclusionMd, client);
	logger.debug(
		{ requestedBy: userId },
		"sendNewsletter: Finished passes on mrkdwn",
	);

	const emailHtml = await render(
		Email({
			intro: finalIntroMd,
			conclusion: finalConclusionMd,
			stories: await Promise.all(
				stories.map(async (story) => ({
					...story,
					headline: await runPasses(story.headline, client),
					longArticle: await runPasses(story.longArticle, client),
				})),
			),
			// intro: introMd, conclusion: conclusionMd, stories,
		}),
	);
	const zip = new JSZip();
	zip.file(
		"index.mjml",
		`
	<mjml>
  		<mj-body>
    		<mj-raw>
      			${emailHtml}
    		</mj-raw>
  		</mj-body>
	</mjml>
	`,
	);
	const generatedZip = new File(
		[await zip.generateAsync({ type: "blob" })],
		"mjml.zip",
	);
	logger.debug({ requestedBy: userId }, "Sending newsletter");

	const reporter = await getReporterBySlackId(userId);
	await loopsClient.createAndSendCampaign({
		emoji: "📰",
		name: `Archimedes: ${subject}`,
		subject,
		zipFile: generatedZip as unknown as File,
		audienceFilter: config.loops.audienceFilter,
		audienceSegmentId: config.loops.audienceSegmentId,
		fromName: reporter?.fullName || "Archimedes",
		fromEmailUsername: reporter?.emailUsername || "archimedes",
		replyToEmail: reporter?.emailUsername
			? `${reporter.emailUsername}@hackclub.com`
			: "mahad+no-reporter-on-reply@hackclub.com",
	});
}

export async function publishStory(
	client: Slack.webApi.WebClient,
	slackId: string,
	stories: Story[],
	subject: string,
	introMd: string,
	conclusionMd: string,
) {
	await Promise.allSettled([
		sendHappeningsMessage(client, slackId, stories, introMd, conclusionMd),
		sendNewsletter(slackId, stories, subject, introMd, conclusionMd, client),
	]);

	// TODO: chunk these in batches of 10
	await db.airtable
		.base(airtableJson.data!.baseId)
		.table(airtableJson.data!.stories!.tableId)
		.update(
			stories.map((story) => ({
				id: story.id,
				fields: {
					status: "Published",
				},
			})),
		);
	logger.debug(`Published ${stories.length} stories!`);
}

// #region Draft/update
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
	await db.update(storiesTable, {
		id: storyId,
		...details,
		image: details.image || null,
	});
}

// #region Cache
const reportersCache = new TTLCache({ ttl: 60 * 60 * 1000 });
const displayNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });
const channelNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });

// #region Get by ID
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
// #endregion
