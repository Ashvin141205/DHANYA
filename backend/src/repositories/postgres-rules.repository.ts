import { Pool } from 'pg';
import { VersionedFinancialRule, UserRole } from '@dhanya/types';
import { IRulesRepository, IAuditRepository } from './interfaces';

export class PostgresRulesRepository implements IRulesRepository {
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
  ): Promise<VersionedFinancialRule[]> {
    const result =
      countryCode && countryCode !== 'ALL'
        ? await this.pool.query(
            `
            SELECT *
            FROM rules
            WHERE country_code = $1
            ORDER BY created_at ASC
            `,
            [countryCode],
          )
        : await this.pool.query(
            `
            SELECT *
            FROM rules
            ORDER BY created_at ASC
            `,
          );

    return result.rows.map(this.mapRow);
  }

  public async findById(
    id: string,
  ): Promise<VersionedFinancialRule | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM rules
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return result.rows.length > 0
      ? this.mapRow(result.rows[0])
      : null;
  }

  public async create(
    ruleData: Omit<
      VersionedFinancialRule,
      'id' | 'version' | 'createdAt'
    >,
    actor: string,
    actorRole: UserRole = 'ADMIN',
  ): Promise<VersionedFinancialRule> {
    const id = `rule_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const rule: VersionedFinancialRule = {
      ...ruleData,
      id,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      INSERT INTO rules (
        id,
        rule_key,
        title,
        category,
        country_code,
        value,
        previous_value,
        unit,
        valid_from,
        source,
        version,
        change_summary,
        methodology_notes,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
      `,
      [
        rule.id,
        rule.ruleKey,
        rule.title,
        rule.category,
        rule.countryCode,
        rule.value,
        rule.previousValue,
        rule.unit,
        rule.validFrom,
        JSON.stringify(rule.source),
        rule.version,
        rule.changeSummary,
        rule.methodologyNotes,
        rule.createdAt,
      ],
    );

    const created = this.mapRow(result.rows[0]);

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'CREATE_RULE',
        targetEntity: created.title,
        details: `Created verified financial rule ${created.ruleKey} (Country: ${created.countryCode}, Value: ${created.value})`,
        newState: created,
      });
    }

    return created;
  }

  public async update(
    id: string,
    updates: Partial<VersionedFinancialRule>,
    actor: string,
    actorRole: UserRole = 'ADMIN',
  ): Promise<VersionedFinancialRule | null> {
    const existingResult = await this.pool.query(
      `
      SELECT *
      FROM rules
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
    const newVersion = existing.version + 1;

    const updated: VersionedFinancialRule = {
      ...existing,
      ...updates,
      id,
      previousValue: existing.value,
      version: newVersion,
      validFrom:
        updates.validFrom ||
        new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      UPDATE rules
      SET
        rule_key = $2,
        title = $3,
        category = $4,
        country_code = $5,
        value = $6,
        previous_value = $7,
        unit = $8,
        valid_from = $9,
        source = $10,
        version = $11,
        change_summary = $12,
        methodology_notes = $13,
        created_at = $14
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        updated.ruleKey,
        updated.title,
        updated.category,
        updated.countryCode,
        updated.value,
        updated.previousValue,
        updated.unit,
        updated.validFrom,
        JSON.stringify(updated.source),
        updated.version,
        updated.changeSummary,
        updated.methodologyNotes,
        updated.createdAt,
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
        action: 'UPDATE_RULE',
        targetEntity: existing.title,
        details: `Updated rule ${existing.ruleKey} from ${existing.value} to ${updates.value}. Bumped version to v${newVersion}.`,
        previousState,
        newState: saved,
      });
    }

    return saved;
  }

  private mapRow(row: any): VersionedFinancialRule {
    return {
      id: row.id,
      ruleKey: row.rule_key,
      title: row.title,
      category: row.category,
      countryCode: row.country_code,
      value: Number(row.value),
      previousValue: Number(row.previous_value),
      unit: row.unit,
      validFrom:
        row.valid_from instanceof Date
          ? row.valid_from.toISOString().slice(0, 10)
          : String(row.valid_from),
      source:
        typeof row.source === 'string'
          ? JSON.parse(row.source)
          : row.source,
      version: Number(row.version),
      changeSummary: row.change_summary,
      methodologyNotes: row.methodology_notes,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}