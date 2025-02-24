/*
 * @skyfall says:
 * Welcome to Archimedes' Loops client!
 *
 * This part of the code is responsible for creating a new campaign and sending it to Loops.
 * Issues? Email me at hi@skyfall.dev.
 */

interface UpdateCampaignEmojiAndName {
  campaignId: string;
  emoji: string;
  name: string;
}

interface UseMjml {
  emailMessageId: string;
  zipFile: File;
}

interface UpdateCampaignAudience {
  campaignId: string;
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  audienceFilter: Record<string, any>;
  audienceSegmentId: string;
}

type CreateCampaign = Omit<
  UpdateCampaignEmojiAndName &
    Omit<UseMjml, "emailMessageId"> &
    UpdateCampaignAudience,
  "campaignId"
>;

/**
 * A client for the Loops API.
 *
 * This client is responsible for creating a new campaign and sending it to Loops.
 */
class LoopsClient {
  sessionToken: string;
  cookie: string;

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
    this.cookie = `__Secure-next-auth.session-token=${sessionToken}`;
  }

  /**
   * Creates a new campaign and returns the campaign ID.
   * You'll need to use it later to update the campaign's title, emoji and message content.
   */
  // What's "ckxja0s6q0000yjr6vqouwn8a" you ask? Looks like it's Loops' default, blank template ID.
  // Tested across two different Loops accounts and teams and works as expected.
  async #createCampaignAndReturnId(templateId = "ckxja0s6q0000yjr6vqouwn8a") {
    const response = await fetch("https://app.loops.so/api/campaigns/create", {
      headers: {
        "content-type": "application/json",
        cookie: this.cookie,
        Referer: "https://app.loops.so/home",
      },
      body: JSON.stringify({ templateId }),
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to create campaign: ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`Failed to create campaign: ${json}`);
    }

    return json.campaignId as string;
  }

  async #updateCampaignEmojiAndName(
    body: UpdateCampaignEmojiAndName
  ): Promise<string> {
    const response = await fetch(
      `https://app.loops.so/api/campaigns/${body.campaignId}`,
      {
        headers: {
          "content-type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          ...body,
          campaignId: undefined,
        }),
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update campaign: ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`Failed to update campaign: ${json}`);
    }

    return json.campaign.emailMessage.id;
  }

  async #updateCampaignAudience(body: UpdateCampaignAudience) {
    const response = await fetch(
      `https://app.loops.so/api/campaigns/${body.campaignId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          audienceFilter: body.audienceFilter,
          audienceSegmentId: body.audienceSegmentId,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to update campaign audience: ${response.statusText}`
      );
    }
  }

  async #scheduleCampaignNow(campaignId: string) {
    const setSchedulingMethodResponse = await fetch(
      `https://app.loops.so/api/campaigns/${campaignId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          scheduling: {
            method: "now",
          },
        }),
      }
    );
    if (!setSchedulingMethodResponse.ok) {
      throw new Error(
        `Failed to set scheduling method for campaign: ${setSchedulingMethodResponse.statusText}`
      );
    }

    const updateStatusResponse = await fetch(
      `https://app.loops.so/api/campaigns/${campaignId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({ status: "Scheduled" }),
      }
    );
    if (!updateStatusResponse.ok) {
      throw new Error(
        `Failed to update campaign status: ${updateStatusResponse.statusText}`
      );
    }
  }

  async #uploadMjml(body: UseMjml) {
    const updateEmailTypeResponse = await fetch(
      `https://app.loops.so/api/emailMessages/${body.emailMessageId}/update`,
      {
        headers: {
          "content-type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          editorType: "MJML",
        }),
        method: "PUT",
      }
    );
    if (!updateEmailTypeResponse.ok) {
      throw new Error(
        `Failed to update email type: ${updateEmailTypeResponse.statusText}`
      );
    }

    const getPresignedUrlResponse = await fetch(
      "https://app.loops.so/api/trpc/emailMessages.getPresignedMjmlUpload",
      {
        headers: {
          "content-type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          json: {
            emailMessageId: body.emailMessageId,
          },
        }),
        method: "POST",
      }
    );
    if (!getPresignedUrlResponse.ok) {
      throw new Error(
        `Failed to use MJML: ${getPresignedUrlResponse.statusText}`
      );
    }
    const { filename, presignedUrl } = (await getPresignedUrlResponse.json())
      .result.data.json;

    const s3Response = await fetch(presignedUrl, {
      method: "PUT",
      body: body.zipFile,
      headers: {
        "Content-Type": body.zipFile.type,
      },
    });
    if (!s3Response.ok) {
      throw new Error(`Failed to upload MJML to S3: ${s3Response.statusText}`);
    }

    const addS3FilenameResponse = await fetch(
      `https://app.loops.so/api/emailMessages/${body.emailMessageId}/upload-mjml-zip`,
      {
        headers: {
          "content-type": "application/json",
          cookie: this.cookie,
        },
        body: JSON.stringify({
          filename,
        }),
        method: "POST",
      }
    );
    if (!addS3FilenameResponse.ok) {
      throw new Error(
        `Failed to upload S3 link to Loops: ${addS3FilenameResponse.statusText}`
      );
    }
    const json = await addS3FilenameResponse.json();
    if (!json.success) {
      throw new Error(`Failed to upload S3 link to Loops: ${json}`);
    }
  }

  async createCampaign(campaign: CreateCampaign) {
    const campaignId = await this.#createCampaignAndReturnId();
    const emailMessageId = await this.#updateCampaignEmojiAndName({
      emoji: campaign.emoji,
      name: campaign.name,
      campaignId,
    });
    await this.#uploadMjml({
      emailMessageId,
      zipFile: campaign.zipFile,
    });
    await this.#updateCampaignAudience({
      campaignId,
      audienceFilter: campaign.audienceFilter,
      audienceSegmentId: campaign.audienceSegmentId,
    });
    await this.#scheduleCampaignNow(campaignId);
  }
}

// const client = new LoopsClient(process.env.LOOPS_SESSION_TOKEN!);
// const audienceFilter = {
//   AND: [
//     {
//       key: "email",
//       value: "hi@skyfall.dev",
//       operation: "contains",
//     },
//   ],
// };
// const audienceSegmentId = "cm7j9be4v01dkk2vxh63ey3h9";
// await client.createCampaign({
//   emoji: "🤖",
//   name: Math.random().toString(),
//   zipFile: Bun.file("mjml.zip") as unknown as File,
//   audienceFilter,
//   audienceSegmentId,
// });
