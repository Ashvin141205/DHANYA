import { Pool } from 'pg';
import { SourceProvenance, UserRole } from '@dhanya/types';
import { ISourceRepository, IAuditRepository } from './interfaces';

export class PostgresSourceRepository implements ISourceRepository {
  private auditRepo?: IAuditRepository;

  constructor(
    private readonly pool: Pool,
    auditRepo?: IAuditRepository,
  ) {
    this.auditRepo = auditRepo;
  }

  public setAuditRepo(repo: IAuditRepository): void {
    this.auditRepo = repo;
  }

  public async findAll(): Promise<SourceProvenance[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM sources
      ORDER BY name ASC
      `,
    );

    return result.rows.map(this.mapRow);
  }

  public async findById(
    id: string,
  ): Promise<SourceProvenance | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM sources
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return result.rows.length > 0
      ? this.mapRow(result.rows[0])
      : null;
  }

  public async verify(
    id: string,
    actor: string,
    status:
      | 'VERIFIED'
      | 'PENDING_REVIEW'
      | 'FLAGGED'
      | 'DEPRECATED' = 'VERIFIED',
    actorRole: UserRole = 'CHIEF_ACTUARY',
  ): Promise<SourceProvenance | null> {
    const existingResult = await this.pool.query(
      `
      SELECT *
      FROM sources
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (existingResult.rows.length === 0) {
      return null;
    }

    const existing = this.mapRow(existingResult.rows[0]);
    const previousState = { ...existing };

    const updated: SourceProvenance = {
      ...existing,
      verificationStatus: status,
      verifiedBy: actor,
      lastVerifiedAt: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      UPDATE sources
      SET
        verification_status = $2,
        verified_by = $3,
        last_verified_at = $4
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        updated.verificationStatus,
        updated.verifiedBy,
        updated.lastVerifiedAt,
      ],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const saved = this.mapRow(result.rows[0]);

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'VERIFY_SOURCE',
        targetEntity: existing.name,
        details: `Verified source provenance status as '${status}' against primary gazette: ${existing.officialUrl}`,
        previousState,
        newState: saved,
      });
    }

    return saved;
  }

  private mapRow(row: any): SourceProvenance {
    return {
      id: row.id,
      name: row.name,
      organization: row.organization,
      organizationType: row.organization_type,
      officialUrl: row.official_url,
      lastVerifiedAt: new Date(row.last_verified_at).toISOString(),
      verifiedBy: row.verified_by,
      verificationStatus: row.verification_status,
      notes: row.notes,
    };
  }
}