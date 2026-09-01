/**
 * Dhanya In-Memory Source Provenance Repository
 * Application: backend
 */

import { SourceProvenance, UserRole } from '@dhanya/types';
import { PROVENANCE_SOURCES } from '@dhanya/finance-engine';
import { ISourceRepository, IAuditRepository } from '../interfaces';

export class MemorySourceRepository implements ISourceRepository {
  private sources: Map<string, SourceProvenance> = new Map();
  private auditRepo?: IAuditRepository;

  constructor(auditRepo?: IAuditRepository) {
    this.auditRepo = auditRepo;
    Object.values(PROVENANCE_SOURCES).forEach((src) => {
      this.sources.set(src.id, { ...src });
    });
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(): Promise<SourceProvenance[]> {
    return Array.from(this.sources.values());
  }

  public async findById(id: string): Promise<SourceProvenance | null> {
    const src = this.sources.get(id);
    return src ? { ...src } : null;
  }

  public async verify(
    id: string,
    actor: string,
    status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED' = 'VERIFIED',
    actorRole: UserRole = 'CHIEF_ACTUARY'
  ): Promise<SourceProvenance | null> {
    const source = this.sources.get(id);
    if (!source) return null;

    const previousState = { ...source };
    const updated: SourceProvenance = {
      ...source,
      verificationStatus: status,
      verifiedBy: actor,
      lastVerifiedAt: new Date().toISOString(),
    };

    this.sources.set(id, updated);

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
