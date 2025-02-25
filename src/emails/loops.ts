/*
 * @skyfall says:
 * Welcome to Archimedes' Loops client!
 *
 * Fair warning: this code is quite ugly at the moment - my focus was on the
 * reverse engineering part, not code cleanliness :sweat_smile:
 *
 * That being said, please do open an issue if this comment is still here, so
 * I can get rid of the tech debt.
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
  audienceFilter: Record<string, unknown>;
  audienceSegmentId: string;
}

interface FromNameEmailAndSubject {
  fromName: string;
  fromEmail: string;
  subject: string;
}

type CreateCampaign = Omit<
  UpdateCampaignEmojiAndName &
    Omit<UseMjml, "emailMessageId"> &
    UpdateCampaignAudience &
    FromNameEmailAndSubject,
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
  baseUrl: string;

  constructor(sessionToken: string, baseUrl = "https://app.loops.so/api") {
    this.sessionToken = sessionToken;
    this.cookie = `__Secure-next-auth.session-token=${sessionToken}`;
    this.baseUrl = baseUrl;
  }

  async #apiRequest(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body: Record<string, unknown>
  ) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        "content-type": "application/json",
        cookie: this.cookie,
      },
      body: JSON.stringify(body),
      method,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to send request: ${response.statusText} (${method} ${url})`
      );
    }
    const json = await response.json();
    if (json.success === false) {
      throw new Error(`Failed to send request: ${json} (${method} ${url})`);
    }
    return json;
  }

  /**
   * Creates a new campaign and returns the campaign ID.
   * You'll need to use it later to update the campaign's title, emoji and message content.
   */
  // What's "ckxja0s6q0000yjr6vqouwn8a" you ask? Looks like it's Loops' default, blank template ID.
  // Tested across two different Loops accounts and teams and works as expected.
  async #createCampaignAndReturnId(templateId = "ckxja0s6q0000yjr6vqouwn8a") {
    const { campaignId } = await this.#apiRequest("/campaigns/create", "POST", {
      templateId,
    });
    return campaignId as string;
  }

  async #updateCampaignEmojiAndName(
    body: UpdateCampaignEmojiAndName
  ): Promise<string> {
    const response: { campaign: { emailMessage: { id: string } } } =
      await this.#apiRequest(`/campaigns/${body.campaignId}`, "PUT", {
        ...body,
        campaignId: undefined,
      });
    return response.campaign.emailMessage.id;
  }

  async #updateCampaignAudience(body: UpdateCampaignAudience) {
    await this.#apiRequest(`/campaigns/${body.campaignId}`, "PUT", {
      audienceFilter: body.audienceFilter,
      audienceSegmentId: body.audienceSegmentId,
    });
  }

  async #scheduleCampaignNow(campaignId: string) {
    await this.#apiRequest(`/campaigns/${campaignId}`, "PUT", {
      scheduling: {
        method: "now",
      },
    });

    await this.#apiRequest(`/campaigns/${campaignId}`, "PUT", {
      status: "Scheduled",
    });
  }

  async #setFromName(emailMessageId: string, fromName: string) {
    await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
      fromName,
    });
  }

  async #setFromEmail(emailMessageId: string, fromEmail: string) {
    await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
      fromEmail,
    });
  }

  async #setSubject(emailMessageId: string, subject: string) {
    await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
      subject,
    });
  }

  async #uploadMjml(body: UseMjml) {
    await this.#apiRequest(
      `/emailMessages/${body.emailMessageId}/update`,
      "PUT",
      {
        editorType: "MJML",
      }
    );

    const {
      filename,
      presignedUrl,
    }: { filename: string; presignedUrl: string } = (
      await this.#apiRequest(
        "/trpc/emailMessages.getPresignedMjmlUpload",
        "POST",
        {
          json: {
            emailMessageId: body.emailMessageId,
          },
        }
      )
    ).result.data.json;

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

    await this.#apiRequest(
      `/emailMessages/${body.emailMessageId}/upload-mjml-zip`,
      "POST",
      {
        filename,
      }
    );
  }

  async createCampaign(campaign: CreateCampaign) {
    const campaignId = await this.#createCampaignAndReturnId();
    const emailMessageId = await this.#updateCampaignEmojiAndName({
      emoji: campaign.emoji,
      name: campaign.name,
      campaignId,
    });

    await this.#setFromName(emailMessageId, campaign.fromName);
    await this.#setFromEmail(emailMessageId, campaign.fromEmail);
    await this.#setSubject(emailMessageId, campaign.subject);

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

    return campaignId;
  }
}

const client = new LoopsClient(process.env.LOOPS_SESSION_TOKEN!);
const audienceFilter = {
  AND: [
    {
      key: "email",
      value: "hi@skyfall.dev",
      operation: "contains",
    },
  ],
};
const audienceSegmentId = "cm7j9be4v01dkk2vxh63ey3h9";
await client.createCampaign({
  emoji: "🤖",
  name: `Archimedes ${Math.random().toString()}`,
  subject: `Archimedes ${Math.random().toString()}`,
  zipFile: Bun.file("mjml.zip") as unknown as File,
  audienceFilter,
  audienceSegmentId,
  fromName: "Archimedes",
  fromEmail: "mahad",
});
