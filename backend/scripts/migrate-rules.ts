import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type Rule = {
  id: string;
  ruleKey: string;
  title: string;
  category: string;
  countryCode: string;
  value: number;
  previousValue: number;
  unit: string;
  validFrom: string;
  source: Record<string, unknown>;
  version: number;
  changeSummary: string;
  methodologyNotes: string;
  createdAt: string;
};

type Ledger = {
  rules: Record<string, Rule>;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const rules = Object.values(ledger.rules ?? {});

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const rule of rules) {
      await client.query(
        `
        INSERT INTO rules (
          id,
          rule_key,
          title,
          category,
          country_code,
          value,
          previous_value,
          unit,
          valid_from,
          source,
          version,
          change_summary,
          methodology_notes,
          created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (id) DO UPDATE SET
          rule_key = EXCLUDED.rule_key,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          country_code = EXCLUDED.country_code,
          value = EXCLUDED.value,
          previous_value = EXCLUDED.previous_value,
          unit = EXCLUDED.unit,
          valid_from = EXCLUDED.valid_from,
          source = EXCLUDED.source,
          version = EXCLUDED.version,
          change_summary = EXCLUDED.change_summary,
          methodology_notes = EXCLUDED.methodology_notes,
          created_at = EXCLUDED.created_at
        `,
        [
          rule.id,
          rule.ruleKey,
          rule.title,
          rule.category,
          rule.countryCode,
          rule.value,
          rule.previousValue,
          rule.unit,
          rule.validFrom,
          JSON.stringify(rule.source),
          rule.version,
          rule.changeSummary,
          rule.methodologyNotes,
          rule.createdAt,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${rules.length} rules.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Rule migration failed:', error);
  process.exit(1);
});