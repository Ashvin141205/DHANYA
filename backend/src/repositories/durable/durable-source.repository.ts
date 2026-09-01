/**
 * Dhanya Durable Source Provenance Repository
 * Application: backend
 */

import { SourceProvenance, UserRole } from '@dhanya/types';
import { ISourceRepository, IAuditRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableSourceRepository implements ISourceRepository {
  private engine: DurableDatabaseEngine;
  private auditRepo?: IAuditRepository;

  constructor(engine: DurableDatabaseEngine, auditRepo?: IAuditRepository) {
    this.engine = engine;
    this.auditRepo = auditRepo;
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(): Promise<SourceProvenance[]> {
    const schema = this.engine.getSchema();
    return Object.values(schema.sources);
  }

  public async findById(id: string): Promise<SourceProvenance | null> {
    const schema = this.engine.getSchema();
    const source = schema.sources[id];
    return source ? { ...source } : null;
  }

  public async verify(
    id: string,
    actor: string,
    status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED' = 'VERIFIED',
    actorRole: UserRole = 'CHIEF_ACTUARY'
  ): Promise<SourceProvenance | null> {
    const schema = this.engine.getSchema();
    const source = schema.sources[id];
    if (!source) return null;

    const previousState = { ...source };
    const updated: SourceProvenance = {
      ...source,
      verificationStatus: status,
      verifiedBy: actor,
      lastVerifiedAt: new Date().toISOString(),
    };

    schema.sources[id] = updated;
    this.engine.persist();

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'VERIFY_SOURCE',
        targetEntity: source.name,
        details: `Verified source provenance status as '${status}' against primary gazette: ${source.officialUrl}`,
        previousState,
        newState: updated,
      });
    }

    return { ...updated };
  }
}
