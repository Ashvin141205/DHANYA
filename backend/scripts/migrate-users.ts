import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type User = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
};

type Ledger = {
  users: Record<string, User>;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const users = Object.values(ledger.users ?? {});

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of users) {
      await client.query(
        `
        INSERT INTO users (
          id,
          tenant_id,
          email,
          name,
          role,
          status,
          country_code,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          country_code = EXCLUDED.country_code,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
        `,
        [
          user.id,
          user.tenantId,
          user.email,
          user.name,
          user.role,
          user.status,
          user.countryCode,
          user.createdAt,
          user.updatedAt,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${users.length} users.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('User migration failed:', error);
  process.exit(1);
});