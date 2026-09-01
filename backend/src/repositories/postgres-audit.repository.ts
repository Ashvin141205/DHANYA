import crypto from 'node:crypto';
import { Pool } from 'pg';
import {
  AuditLogEntry,
  UserRole,
  AuditAction,
} from '@dhanya/types';
import { IAuditRepository } from './interfaces';

const GENESIS_HASH = 'GENESIS_HASH_DHANYA_ACTUARIAL_V1';

export class PostgresAuditRepository implements IAuditRepository {
  constructor(private readonly pool: Pool) {}

  private calculateHash(
    id: string,
    timestamp: string,
    actor: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    details: string,
    previousHash: string,
  ): string {
    return crypto
      .createHash('sha256')
      .update(
        `${id}:${timestamp}:${actor}:${actorRole}:${action}:${targetEntity}:${details}:${previousHash}`,
      )
      .digest('hex');
  }

  public async record(entry: {
    actor: string;
    actorId?: string;
    actorRole: UserRole;
    action: AuditAction;
    targetEntity: string;
    details: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
  }): Promise<AuditLogEntry> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      /*
       * Lock the newest audit row while calculating the next hash.
       * This prevents two concurrent audit writes from using the
       * same previous hash.
       */
      const latestResult = await client.query(
        `
        SELECT hash
        FROM audit_logs
        ORDER BY timestamp DESC, id DESC
        LIMIT 1
        FOR UPDATE
        `,
      );

      const previousHash =
        latestResult.rows.length > 0
          ? latestResult.rows[0].hash
          : GENESIS_HASH;

      const id = `audit_${Date.now()}_${crypto
        .randomBytes(3)
        .toString('hex')}`;

      const timestamp = new Date().toISOString();

      const hash = this.calculateHash(
        id,
        timestamp,
        entry.actor,
        entry.actorRole,
        entry.action,
        entry.targetEntity,
        entry.details,
        previousHash,
      );

      const result = await client.query(
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
        RETURNING *
        `,
        [
          id,
          timestamp,
          entry.actor,
          entry.actorId ?? null,
          entry.actorRole,
          entry.action,
          entry.targetEntity,
          entry.details,
          previousHash,
          hash,
          entry.ipAddress ?? null,
          entry.previousState ?? null,
          entry.newState ?? null,
        ],
      );

      await client.query('COMMIT');

      return this.mapRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async findAll(
    limit: number = 50,
  ): Promise<AuditLogEntry[]> {
    const safeLimit = Math.max(1, Math.min(limit, 2000));

    const result = await this.pool.query(
      `
      SELECT *
      FROM audit_logs
      ORDER BY timestamp DESC, id DESC
      LIMIT $1
      `,
      [safeLimit],
    );

    return result.rows.map(this.mapRow);
  }

  public async verifyIntegrity(): Promise<{
    valid: boolean;
    brokenChainIndex?: number;
    totalRecords: number;
  }> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM audit_logs
      ORDER BY timestamp ASC, id ASC
      `,
    );

    if (result.rows.length === 0) {
      return {
        valid: true,
        totalRecords: 0,
      };
    }

    let expectedPreviousHash = GENESIS_HASH;

    for (let i = 0; i < result.rows.length; i++) {
      const record = result.rows[i];

      if (record.previous_hash !== expectedPreviousHash) {
        return {
          valid: false,
          brokenChainIndex: i,
          totalRecords: result.rows.length,
        };
      }

      const computedHash = this.calculateHash(
        record.id,
        new Date(record.timestamp).toISOString(),
        record.actor,
        record.actor_role,
        record.action,
        record.target_entity,
        record.details,
        record.previous_hash,
      );

      if (computedHash !== record.hash) {
        return {
          valid: false,
          brokenChainIndex: i,
          totalRecords: result.rows.length,
        };
      }

      expectedPreviousHash = record.hash;
    }

    return {
      valid: true,
      totalRecords: result.rows.length,
    };
  }

  private mapRow(row: any): AuditLogEntry {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp).toISOString(),
      actor: row.actor,
      actorId: row.actor_id ?? undefined,
      actorRole: row.actor_role as UserRole,
      action: row.action as AuditAction,
      targetEntity: row.target_entity,
      details: row.details,
      previousState: row.previous_state ?? undefined,
      newState: row.new_state ?? undefined,
      previousHash: row.previous_hash,
      hash: row.hash,
      ipAddress: row.ip_address ?? undefined,
    };
  }
}