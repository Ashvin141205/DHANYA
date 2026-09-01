import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type AuditLog = {
  id: string;
  timestamp: string;
  actor: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetEntity: string;
  details: string;
  previousHash: string;
  hash: string;
  ipAddress?: string;
  previousState?: unknown;
  newState?: unknown;
};

type Ledger = {
  auditLogs: AuditLog[];
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const auditLogs = ledger.auditLogs ?? [];

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const log of auditLogs) {
      await client.query(
        `
        INSERT INTO audit_logs (
          id,
          timestamp,
          actor,
          actor_id,
          actor_role,
          action,
          target_entity,
          details,
          previous_hash,
          hash,
          ip_address,
          previous_state,
          new_state
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (id) DO UPDATE SET
          timestamp = EXCLUDED.timestamp,
          actor = EXCLUDED.actor,
          actor_id = EXCLUDED.actor_id,
          actor_role = EXCLUDED.actor_role,
          action = EXCLUDED.action,
          target_entity = EXCLUDED.target_entity,
          details = EXCLUDED.details,
          previous_hash = EXCLUDED.previous_hash,
          hash = EXCLUDED.hash,
          ip_address = EXCLUDED.ip_address,
          previous_state = EXCLUDED.previous_state,
          new_state = EXCLUDED.new_state
        `,
        [
          log.id,
          log.timestamp,
          log.actor,
          log.actorId ?? null,
          log.actorRole ?? null,
          log.action,
          log.targetEntity,
          log.details,
          log.previousHash,
          log.hash,
          log.ipAddress ?? null,
          log.previousState ?? null,
          log.newState ?? null,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${auditLogs.length} audit logs.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Audit log migration failed:', error);
  process.exit(1);
});