import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type IntelligenceEvent = {
  id: string;
  title: string;
  category: string;
  countryCode: string;
  jurisdictionName?: string;
  effectiveDate: string;
  publishedDate: string;
  summary: string;
  detailedAnalysis: string;
  impactScore: string;
  affectedPersonas: string[];
  source: Record<string, unknown>;
  previousRuleValue: string;
  newRuleValue: string;
};

type Ledger = {
  intelligenceEvents: IntelligenceEvent[];
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const events = ledger.intelligenceEvents ?? [];

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const event of events) {
      await client.query(
        `
        INSERT INTO intelligence_events (
          id,
          title,
          category,
          country_code,
          jurisdiction_name,
          effective_date,
          published_date,
          summary,
          detailed_analysis,
          impact_score,
          affected_personas,
          source,
          previous_rule_value,
          new_rule_value
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          country_code = EXCLUDED.country_code,
          jurisdiction_name = EXCLUDED.jurisdiction_name,
          effective_date = EXCLUDED.effective_date,
          published_date = EXCLUDED.published_date,
          summary = EXCLUDED.summary,
          detailed_analysis = EXCLUDED.detailed_analysis,
          impact_score = EXCLUDED.impact_score,
          affected_personas = EXCLUDED.affected_personas,
          source = EXCLUDED.source,
          previous_rule_value = EXCLUDED.previous_rule_value,
          new_rule_value = EXCLUDED.new_rule_value
        `,
        [
          event.id,
          event.title,
          event.category,
          event.countryCode,
          event.jurisdictionName ?? null,
          event.effectiveDate,
          event.publishedDate,
          event.summary,
          event.detailedAnalysis,
          event.impactScore,
          JSON.stringify(event.affectedPersonas),
          JSON.stringify(event.source),
          event.previousRuleValue,
          event.newRuleValue,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${events.length} intelligence events.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Intelligence event migration failed:', error);
  process.exit(1);
});