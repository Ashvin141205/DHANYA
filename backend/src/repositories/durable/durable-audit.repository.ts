/**
 * Dhanya Durable Audit Repository with SHA-256 Hash Chain
 * Application: backend
 */

import crypto from 'node:crypto';
import { AuditLogEntry, UserRole, AuditAction } from '@dhanya/types';
import { IAuditRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableAuditRepository implements IAuditRepository {
  private engine: DurableDatabaseEngine;

  constructor(engine: DurableDatabaseEngine) {
    this.engine = engine;
  }

  private calculateHash(
    id: string,
    timestamp: string,
    actor: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    details: string,
    previousHash: string
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${id}:${timestamp}:${actor}:${actorRole}:${action}:${targetEntity}:${details}:${previousHash}`)
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
    const schema = this.engine.getSchema();
    const id = `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const previousHash = schema.lastAuditHash || 'GENESIS_HASH_DHANYA_ACTUARIAL_V1';

    const hash = this.calculateHash(
      id,
      timestamp,
      entry.actor,
      entry.actorRole,
      entry.action,
      entry.targetEntity,
      entry.details,
      previousHash
    );

    const fullEntry: AuditLogEntry = {
      id,
      timestamp,
      actor: entry.actor,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      targetEntity: entry.targetEntity,
      details: entry.details,
      previousState: entry.previousState,
      newState: entry.newState,
      previousHash,
      hash,
      ipAddress: entry.ipAddress,
    };

    schema.auditLogs.unshift(fullEntry);
    schema.lastAuditHash = hash;

    // Retain up to 2000 durable audit entries
    if (schema.auditLogs.length > 2000) {
      schema.auditLogs = schema.auditLogs.slice(0, 2000);
    }

    this.engine.persist();
    return fullEntry;
  }

  public async findAll(limit: number = 50): Promise<AuditLogEntry[]> {
    const schema = this.engine.getSchema();
    return schema.auditLogs.slice(0, limit);
  }

  public async verifyIntegrity(): Promise<{ valid: boolean; brokenChainIndex?: number; totalRecords: number }> {
    const schema = this.engine.getSchema();
    if (schema.auditLogs.length === 0) {
      return { valid: true, totalRecords: 0 };
    }

    const chronological = [...schema.auditLogs].reverse();
    let expectedPreviousHash = 'GENESIS_HASH_DHANYA_ACTUARIAL_V1';

    for (let i = 0; i < chronological.length; i++) {
      const record = chronological[i];

      if (record.previousHash !== expectedPreviousHash) {
        return { valid: false, brokenChainIndex: i, totalRecords: schema.auditLogs.length };
      }

      const computedHash = this.calculateHash(
        record.id,
        record.timestamp,
        record.actor,
        record.actorRole,
        record.action,
        record.targetEntity,
        record.details,
        record.previousHash
      );

      if (computedHash !== record.hash) {
        return { valid: false, brokenChainIndex: i, totalRecords: schema.auditLogs.length };
      }

      expectedPreviousHash = record.hash!;
    }

    return { valid: true, totalRecords: schema.auditLogs.length };
  }
}
