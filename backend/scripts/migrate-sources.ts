import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type Source = {
  id: string;
  name: string;
  organization: string;
  organizationType: string;
  officialUrl: string;
  lastVerifiedAt: string;
  verifiedBy: string;
  verificationStatus: string;
  notes: string;
};

type Ledger = {
  sources: Record<string, Source>;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const sources = Object.values(ledger.sources ?? {});

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const source of sources) {
      await client.query(
        `
        INSERT INTO sources (
          id,
          name,
          organization,
          organization_type,
          official_url,
          last_verified_at,
          verified_by,
          verification_status,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          organization = EXCLUDED.organization,
          organization_type = EXCLUDED.organization_type,
          official_url = EXCLUDED.official_url,
          last_verified_at = EXCLUDED.last_verified_at,
          verified_by = EXCLUDED.verified_by,
          verification_status = EXCLUDED.verification_status,
          notes = EXCLUDED.notes
        `,
        [
          source.id,
          source.name,
          source.organization,
          source.organizationType,
          source.officialUrl,
          source.lastVerifiedAt,
          source.verifiedBy,
          source.verificationStatus,
          source.notes,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${sources.length} sources.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Source migration failed:', error);
  process.exit(1);
});