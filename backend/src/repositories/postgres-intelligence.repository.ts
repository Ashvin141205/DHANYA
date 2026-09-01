import { Pool } from 'pg';
import { WhatChangedEvent, UserRole } from '@dhanya/types';
import { IIntelligenceRepository, IAuditRepository } from './interfaces';

export class PostgresIntelligenceRepository
  implements IIntelligenceRepository
{
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

  public async findAll(
    countryCode?: string,
  ): Promise<WhatChangedEvent[]> {
    const result =
      countryCode && countryCode !== 'ALL'
        ? await this.pool.query(
            `
            SELECT *
            FROM intelligence_events
            WHERE country_code = $1
            ORDER BY published_date DESC
            `,
            [countryCode],
          )
        : await this.pool.query(
            `
            SELECT *
            FROM intelligence_events
            ORDER BY published_date DESC
            `,
          );

    return result.rows.map(this.mapRow);
  }

  public async create(
    event: WhatChangedEvent,
    actor: string,
    actorRole: UserRole = 'CHIEF_ACTUARY',
  ): Promise<WhatChangedEvent> {
    const result = await this.pool.query(
      `
      INSERT INTO intelligence_events (
        id,
        title,
        category,
        country_code,
        jurisdiction_name,
        effective_date,
        published_date,
        summary,
        detailed_analysis,
        impact_score,
        affected_personas,
        source,
        previous_rule_value,
        new_rule_value
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
      `,
      [
        event.id,
        event.title,
        event.category,
        event.countryCode,
        event.jurisdictionName ?? null,
        event.effectiveDate,
        event.publishedDate,
        event.summary,
        event.detailedAnalysis,
        event.impactScore,
        JSON.stringify(event.affectedPersonas),
        JSON.stringify(event.source),
        event.previousRuleValue,
        event.newRuleValue,
      ],
    );

    const created = this.mapRow(result.rows[0]);

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'PUBLISH_INTELLIGENCE',
        targetEntity: created.title,
        details: `Published intelligence event: ${created.title} (Effective: ${created.effectiveDate}, Impact: ${created.impactScore})`,
        newState: created,
      });
    }

    return created;
  }

  private mapRow(row: any): WhatChangedEvent {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      countryCode: row.country_code,
      ...(row.jurisdiction_name
        ? { jurisdictionName: row.jurisdiction_name }
        : {}),
      effectiveDate:
        row.effective_date instanceof Date
          ? row.effective_date.toISOString().slice(0, 10)
          : String(row.effective_date),
      publishedDate:
        row.published_date instanceof Date
          ? row.published_date.toISOString().slice(0, 10)
          : String(row.published_date),
      summary: row.summary,
      detailedAnalysis: row.detailed_analysis,
      impactScore: row.impact_score,
      affectedPersonas:
        typeof row.affected_personas === 'string'
          ? JSON.parse(row.affected_personas)
          : row.affected_personas,
      source:
        typeof row.source === 'string'
          ? JSON.parse(row.source)
          : row.source,
      previousRuleValue: row.previous_rule_value,
      newRuleValue: row.new_rule_value,
    };
  }
}