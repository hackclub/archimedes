import TTLCache from "@isaacs/ttlcache";
import JSZip from "jszip";
import LoopsClient from "loops-campaign-api";
import buildHappeningsMessage from "./blocks/publishing/happeningsMessage";
import Email from "./emails/newsletterEmail";

import { render } from "@react-email/components";
import Slack from "@slack/bolt";
import {
	type Reporter,
	type Story,
	db,
	reportersTable,
	storiesTable,
	tokensTable,
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
	const tokenRecord = (
		await db.scan(tokensTable, {
			filterByFormula: `AND({Slack ID} = "${userId}", {Environment} = "${env.NODE_ENV}")`,
		})
	)[0];
	try {
		// TODO: Do I need to make a new client here?
		const userClient = new Slack.webApi.WebClient(tokenRecord.token);
		await userClient.chat.postMessage({
			channel: env.HAPPENINGS_CHANNEL_ID,
			unfurl_links: false,
			unfurl_media: false,
			...buildHappeningsMessage(introMd, conclusionMd, stories),
		});
	} catch (e) {
		logger.error(
			{ requestedBy: userId, error: e },
			"Failed to send happenings message via OAuth2. Falling back to bot token.",
		);
		// The show must go on!
		await client.chat.postMessage({
			channel: env.HAPPENINGS_CHANNEL_ID,
			unfurl_links: false,
			unfurl_media: false,
			...buildHappeningsMessage(introMd, conclusionMd, stories),
		});
	}

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
	console.log("Stage 1");
	const finalIntroMd = await runPasses(introMd, client);
	console.log("Stage 2");
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
				stories.map(async (story) => {
					console.log("Running passes on" + story.headline);
					return {
						...story,
						headline: await runPasses(story.headline, client),
						longArticle: await runPasses(story.longArticle, client),
					};
				}),
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

	try {
		await Bun.write(`${subject}.mjml.zip`, generatedZip);
	} catch {}

	const reporter = await getReporterBySlackId(userId);
	const campaignId = await loopsClient.createAndSendCampaign({
		emoji: "📰",
		name: `Archimedes: ${subject}`,
		subject,
		zipFile: generatedZip as unknown as File,
		audienceFilter: config.loops.audienceFilter,
		audienceSegmentId: config.loops.audienceSegmentId,
		fromName: reporter?.fullName
			? `${reporter?.fullName} (Hack Club)`
			: "Archimedes",
		fromEmailUsername: reporter?.emailUsername || "archimedes",
		replyToEmail: "newspaper@hackclub.com",
	});

	if (env.SLACK_LOOPS_NOTIFS_CHANNEL_ID) {
		await client.chat.postMessage({
			channel: env.SLACK_LOOPS_NOTIFS_CHANNEL_ID,
			text: `:tw_mailbox_with_mail: Email *${subject}* has been sent out! Please approve on Loops: https://app.loops.so/campaigns/${campaignId}/compose?stepName=Compose`,
		});
	}
}

export async function publishStory(
	client: Slack.webApi.WebClient,
	slackId: string,
	stories: Story[],
	subject: string,
	introMd: string,
	emailIntroMd: string,
	conclusionMd: string,
) {
	await Promise.allSettled([
		sendHappeningsMessage(client, slackId, stories, introMd, conclusionMd),
		sendNewsletter(
			slackId,
			stories,
			subject,
			emailIntroMd,
			conclusionMd,
			client,
		),
	]);

	const chunkSize = 10; // Airtable has a limit of 10 updates per request
	for (let i = 0; i < stories.length; i += chunkSize) {
		const chunk = stories.slice(i, i + chunkSize);
		await db.airtable
			.base(airtableJson.data!.baseId)
			.table(airtableJson.data!.stories!.tableId)
			.update(
				chunk.map((story) => ({
					id: story.id,
					fields: {
						status: "Published",
					},
				})),
			);
	}

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
		status: "Draft",
		...details,
		image: details.image || null,
	});
}

// #region Cache
const reportersCache = new TTLCache({ ttl: 60 * 60 * 1000 });
const displayNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });
const channelNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });
const usergroupNamesCache = new TTLCache({ ttl: 60 * 60 * 1000 });

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
		user.user?.profile?.display_name ||
		user.user?.real_name ||
		user.user?.name ||
		"Archimedes";
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

export async function getUsergroupNameById(
	usergroupId: string,
	client: Slack.webApi.WebClient,
) {
	let usergroupsList: Slack.webApi.UsergroupsListResponse;
	const cacheResponse = usergroupNamesCache.get("usergroups");
	if (cacheResponse) {
		usergroupsList = cacheResponse as Slack.webApi.UsergroupsListResponse;
	} else {
		usergroupsList = await client.usergroups.list();
		if (usergroupsList.ok) {
			usergroupNamesCache.set("usergroups", usergroupsList);
		}
	}

	const usergroupName = usergroupsList.usergroups?.find(
		(usergroup) => usergroup.id === usergroupId,
	)?.name;
	if (usergroupName) usergroupNamesCache.set(usergroupId, usergroupName);

	return usergroupName || usergroupId;
}
// #endregion
