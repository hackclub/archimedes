import { env } from "./env";
import { AirtableTs, type Table, type Item } from 'airtable-ts';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { readFile } from 'node:fs/promises';
import logger from "./logger";

export const db = new AirtableTs({
    apiKey: env.AIRTABLE_API_KEY,
});

const tableInfo = z.object({
    name: z.string(),
    tableId: z.string(),
    mappings: z.record(z.string(), z.string()),
});
const ZAirtableJsonSchema = z.object({
    baseId: z.string(),
    reporters: tableInfo,
    stories: tableInfo,
    newsletters: tableInfo,
    happenings: tableInfo,
});
const airtableJson = await ZAirtableJsonSchema.safeParseAsync(JSON.parse(await readFile('./airtable.json', 'utf-8')));
if (airtableJson.error) {
    const error = fromError(airtableJson.error);
    logger.fatal(`Failed to parse airtable.json: ${error.message}`);
    throw airtableJson.error;
}

// Code below is partially @generated by airtable-ts-codegen
// Changes:
// - Use `airtableJson.data` instead of hardcoded IDs
// - `readonly` modifiers added to certain fields
// - `Storie` -> `Story`
// If you need to make changes, please make those changes to the generated output!
export interface Story extends Item {
    readonly id: string,
    readonly identifier: string | null,
    headline: string,
    shortDescription: string,
    longArticle: string,
    shortDescriptionRt: string,
    longArticleRt: string,
    authors: string[],
    readonly authorsName: string[] | null,
    status: "Draft" | "Awaiting Review" | "Approved" | "Published",
    newsletters: string[],
    happenings: string[],
    readonly autonumber: number,
    readonly slackIdRollup: string[],
}

export const storiesTable: Table<Story> = {
    name: 'stories',
    baseId: airtableJson.data.baseId,
    tableId: airtableJson.data.stories.tableId,
    mappings: airtableJson.data.stories.mappings as Record<keyof Story, string>,
    schema: {
        identifier: 'string | null',
        headline: 'string',
        shortDescription: 'string',
        longArticle: 'string',
        shortDescriptionRt: 'string',
        longArticleRt: 'string',
        authors: 'string[]',
        authorsName: 'string[] | null',
        status: 'string',
        newsletters: 'string[]',
        happenings: 'string[]',
        autonumber: 'number',
        slackIdRollup: 'string[]',
    },
};

export interface Reporter extends Item {
    readonly id: string,
    readonly identifier: string | null,
    bio: string,
    stories: string[],
    firstName: string,
    lastName: string,
    readonly fullName: string | null,
    readonly autonumber: number,
    slackId: string,
    hasPublishingRights: boolean,
}

export const reportersTable: Table<Reporter> = {
    name: 'reporters',
    baseId: airtableJson.data.baseId,
    tableId: airtableJson.data.reporters.tableId,
    mappings: airtableJson.data.reporters.mappings as Record<keyof Reporter, string>,
    schema: {
        identifier: 'string | null',
        bio: 'string',
        stories: 'string[]',
        firstName: 'string',
        lastName: 'string',
        fullName: 'string | null',
        autonumber: 'number',
        slackId: 'string',
        hasPublishingRights: 'boolean',
    },
};

export interface Newsletter extends Item {
    readonly id: string,
    readonly identifier: string | null,
    stories: string[],
    publicationDate: number,
    publicationDateString: string | null,
    readonly autonumber: number,
}

export const newslettersTable: Table<Newsletter> = {
    name: airtableJson.data.newsletters.name,
    baseId: airtableJson.data.baseId,
    tableId: airtableJson.data.newsletters.tableId,
    mappings: airtableJson.data.newsletters.mappings as Record<keyof Newsletter, string>,
    schema: {
        identifier: 'string | null',
        stories: 'string[]',
        publicationDate: 'number',
        publicationDateString: 'string | null',
        autonumber: 'number',
    },
};

export interface Happening extends Item {
    readonly id: string,
    readonly identifier: string | null,
    stories: string[],
    publicationDate: number,
    publicationDateString: string | null,
    readonly autonumber: number,
}

export const happeningsTable: Table<Happening> = {
    name: airtableJson.data.happenings.name,
    baseId: airtableJson.data.baseId,
    tableId: airtableJson.data.happenings.tableId,
    mappings: airtableJson.data.happenings.mappings as Record<keyof Happening, string>,
    schema: {
        identifier: 'string | null',
        stories: 'string[]',
        publicationDate: 'number',
        publicationDateString: 'string | null',
        autonumber: 'number',
    },
};