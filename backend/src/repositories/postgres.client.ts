import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

export const postgresPool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function verifyPostgresConnection(): Promise<void> {
  const client = await postgresPool.connect();

  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}