import { env } from "./env";
import { AirtableTs, type Table } from 'airtable-ts';
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
});
const ZAirtableJsonSchema = z.object({
    baseId: z.string(),
    reporters: tableInfo
});
const airtableJson = await ZAirtableJsonSchema.safeParseAsync(JSON.parse(await readFile('./airtable.json', 'utf-8')));
if (airtableJson.error) {
    const error = fromError(airtableJson.error);
    logger.error(`Failed to parse airtable.json: ${error.message}`);
    throw airtableJson.error;
}

export const reportersTable: Table<{ id: string, slack_id: string, first_name: string, full_name: string }> = {
    name: 'reporters',
    baseId: airtableJson.data.baseId,
    tableId: airtableJson.data.reporters.tableId,
    schema: { slack_id: 'string', first_name: 'string', full_name: 'string' },
};
