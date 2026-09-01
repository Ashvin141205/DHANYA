/**
 * Dhanya In-Memory Audit Repository with SHA-256 Hash Chaining
 * Application: backend
 */

import crypto from 'node:crypto';
import { AuditLogEntry, UserRole, AuditAction } from '@dhanya/types';
import { IAuditRepository } from '../interfaces';

export class MemoryAuditRepository implements IAuditRepository {
  private logs: AuditLogEntry[] = [];
  private lastHash: string = 'GENESIS_HASH_DHANYA_ACTUARIAL_V1';

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
    const id = `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const previousHash = this.lastHash;

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

    this.logs.unshift(fullEntry);
    this.lastHash = hash;

    // Retain up to 500 records in memory
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    return fullEntry;
  }

  public async findAll(limit: number = 50): Promise<AuditLogEntry[]> {
    return this.logs.slice(0, limit);
  }

  public async verifyIntegrity(): Promise<{ valid: boolean; brokenChainIndex?: number; totalRecords: number }> {
    if (this.logs.length === 0) {
      return { valid: true, totalRecords: 0 };
    }

    // Records are stored newest first in logs array, so iterate in reverse (chronological order)
    const chronological = [...this.logs].reverse();
    let expectedPreviousHash = 'GENESIS_HASH_DHANYA_ACTUARIAL_V1';

    for (let i = 0; i < chronological.length; i++) {
      const record = chronological[i];

      if (record.previousHash !== expectedPreviousHash) {
        return { valid: false, brokenChainIndex: i, totalRecords: this.logs.length };
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
        return { valid: false, brokenChainIndex: i, totalRecords: this.logs.length };
      }

      expectedPreviousHash = record.hash!;
    }

    return { valid: true, totalRecords: this.logs.length };
  }
}
