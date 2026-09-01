import { Pool } from 'pg';
import { VersionedFinancialRule } from '@dhanya/types';

export interface RuleHistoryEntry {
  id: string;
  ruleId: string;
  ruleKey: string;
  countryCode: string;
  value: number;
  previousValue?: number;
  unit: string;
  effectiveDate: string;
  source: any;
  version: number;
  changeSummary: string;
  recordedAt: string;
}

export class PostgresRuleHistoryRepository {
  constructor(private readonly pool: Pool) {}

  public async findByRuleId(
    ruleId: string,
  ): Promise<RuleHistoryEntry[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM rule_history
      WHERE rule_id = $1
      ORDER BY effective_date ASC, version ASC
      `,
      [ruleId],
    );

    return result.rows.map(this.mapRow);
  }

  public async findByRuleKey(
    ruleKey: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<RuleHistoryEntry[]> {
    const conditions = ['rule_key = $1'];
    const values: unknown[] = [ruleKey];

    if (fromDate) {
      values.push(fromDate);
      conditions.push(
        `effective_date >= $${values.length}`,
      );
    }

    if (toDate) {
      values.push(toDate);
      conditions.push(
        `effective_date <= $${values.length}`,
      );
    }

    const result = await this.pool.query(
      `
      SELECT *
      FROM rule_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY effective_date ASC, version ASC
      `,
      values,
    );

    return result.rows.map(this.mapRow);
  }

  public async findAll(
    fromDate?: string,
    toDate?: string,
  ): Promise<RuleHistoryEntry[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (fromDate) {
      values.push(fromDate);
      conditions.push(
        `effective_date >= $${values.length}`,
      );
    }

    if (toDate) {
      values.push(toDate);
      conditions.push(
        `effective_date <= $${values.length}`,
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM rule_history
      ${whereClause}
      ORDER BY effective_date ASC, version ASC
      `,
      values,
    );

    return result.rows.map(this.mapRow);
  }

  public async record(
    rule: VersionedFinancialRule,
  ): Promise<RuleHistoryEntry> {
    const history: RuleHistoryEntry = {
      id: `history_${rule.id}_v${rule.version}`,
      ruleId: rule.id,
      ruleKey: rule.ruleKey,
      countryCode: rule.countryCode,
      value: Number(rule.value),
      previousValue:
        rule.previousValue === undefined
          ? undefined
          : Number(rule.previousValue),
      unit: rule.unit,
      effectiveDate: rule.validFrom,
      source: rule.source,
      version: Number(rule.version),
      changeSummary: rule.changeSummary,
      recordedAt: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      INSERT INTO rule_history (
        id,
        rule_id,
        rule_key,
        country_code,
        value,
        previous_value,
        unit,
        effective_date,
        source,
        version,
        change_summary,
        recorded_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
      )
      ON CONFLICT (rule_id, effective_date, version)
      DO NOTHING
      RETURNING *
      `,
      [
        history.id,
        history.ruleId,
        history.ruleKey,
        history.countryCode,
        history.value,
        history.previousValue ?? null,
        history.unit,
        history.effectiveDate,
        JSON.stringify(history.source),
        history.version,
        history.changeSummary,
        history.recordedAt,
      ],
    );

    if (result.rows.length > 0) {
      return this.mapRow(result.rows[0]);
    }

    const existing = await this.pool.query(
      `
      SELECT *
      FROM rule_history
      WHERE rule_id = $1
        AND effective_date = $2
        AND version = $3
      LIMIT 1
      `,
      [
        history.ruleId,
        history.effectiveDate,
        history.version,
      ],
    );

    if (existing.rows.length === 0) {
      throw new Error(
        'Failed to record rule history entry.',
      );
    }

    return this.mapRow(existing.rows[0]);
  }

  private mapRow(row: any): RuleHistoryEntry {
    return {
      id: row.id,
      ruleId: row.rule_id,
      ruleKey: row.rule_key,
      countryCode: row.country_code,
      value: Number(row.value),
      previousValue:
        row.previous_value === null ||
        row.previous_value === undefined
          ? undefined
          : Number(row.previous_value),
      unit: row.unit,
      effectiveDate:
        row.effective_date instanceof Date
          ? row.effective_date
              .toISOString()
              .slice(0, 10)
          : String(row.effective_date),
      source:
        typeof row.source === 'string'
          ? JSON.parse(row.source)
          : row.source,
      version: Number(row.version),
      changeSummary: row.change_summary,
      recordedAt: new Date(
        row.recorded_at,
      ).toISOString(),
    };
  }
}