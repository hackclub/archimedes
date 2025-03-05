import { render } from "@react-email/components";
import type Slack from "@slack/bolt";
import JSZip from "jszip";
import { type Story, airtableJson, db, storiesTable } from "../airtable";
import buildHappeningsMessage from "../blocks/publishing/happeningsMessage";
import publishModal from "../blocks/publishing/publishModal";
import { getReporterBySlackId } from "../data";
import LoopsClient from "../emails/loops";
import Email from "../emails/newsletterEmail";
import { env } from "../env";
import { config } from "../featureConfig";
import logger from "../logger";
import { richTextBlockToMrkdwn, runPasses } from "../util";

export default function (app: Slack.App) {
	app.command("/arch-publish", async ({ ack, client, body, respond }) => {
		await ack();
		const reporter = await getReporterBySlackId(body.user_id);
		if (!reporter) {
			await respond({
				text: "You are not a reporter, so you can't publish stories. Sorry :/",
				response_type: "ephemeral",
			});
			return;
		}
		if (!reporter.hasPublishingRights) {
			await respond({
				text: "You don't have publishing rights, so you can't publish stories. Sorry :/",
				response_type: "ephemeral",
			});
			return;
		}

		const approvedStories = await db.scan(storiesTable, {
			filterByFormula: `{status} = "Approved"`,
		});
		if (approvedStories.length === 0) {
			await respond({
				text: "No stories are ready to publish.",
				response_type: "ephemeral",
			});
			return;
		}

		await client.views.open({
			trigger_id: body.trigger_id,
			view: publishModal(approvedStories),
		});
	});

	app.view("publish-story-modal", async ({ ack, client, body, view }) => {
		await ack();
		logger.debug(
			{ requestedBy: body.user.id },
			"Processing publish-story-modal",
		);

		const subject = view.state.values.subject_input.subject.value!;
		const introMd = richTextBlockToMrkdwn(
			view.state.values.intro_input.intro.rich_text_value!,
		);
		const conclusionMd = richTextBlockToMrkdwn(
			view.state.values.conclusion_input.conclusion.rich_text_value!,
		);

		const approvedStories = await db.scan(storiesTable, {
			filterByFormula: `{status} = "Approved"`,
		});

		await Promise.allSettled([
			sendHappeningsMessage(
				client,
				body.user.id,
				approvedStories,
				introMd,
				conclusionMd,
			),
			sendNewsletter(
				body.user.id,
				approvedStories,
				subject,
				introMd,
				conclusionMd,
				client,
			),
		]);

		// TODO: chunk these in batches of 10
		await db.airtable
			.base(airtableJson.data!.baseId)
			.table(airtableJson.data!.stories!.tableId)
			.update(
				approvedStories.map((story) => ({
					id: story.id,
					fields: {
						status: "Published",
					},
				})),
			);
		logger.debug(`Published ${approvedStories.length} stories!`);
	});
}

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

	await loopsClient.createCampaign({
		emoji: "📰",
		name: `Archimedes: ${subject}`,
		subject,
		zipFile: generatedZip as unknown as File,
		audienceFilter: config.loops.audienceFilter,
		audienceSegmentId: config.loops.audienceSegmentId,
		fromName: "Mahad Kalam",
		fromEmail: "mahad",
		replyToEmail: "mahad@hackclub.com",
	});
}
