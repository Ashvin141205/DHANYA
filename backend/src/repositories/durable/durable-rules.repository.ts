/**
 * Dhanya Durable Rules Repository
 * Application: backend
 */

import { VersionedFinancialRule, UserRole } from '@dhanya/types';
import { IRulesRepository, IAuditRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableRulesRepository implements IRulesRepository {
  private engine: DurableDatabaseEngine;
  private auditRepo?: IAuditRepository;

  constructor(engine: DurableDatabaseEngine, auditRepo?: IAuditRepository) {
    this.engine = engine;
    this.auditRepo = auditRepo;
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(countryCode?: string): Promise<VersionedFinancialRule[]> {
    const schema = this.engine.getSchema();
    const list = Object.values(schema.rules);
    if (countryCode && countryCode !== 'ALL') {
      return list.filter((r) => r.countryCode === countryCode);
    }
    return list;
  }

  public async findById(id: string): Promise<VersionedFinancialRule | null> {
    const schema = this.engine.getSchema();
    const rule = schema.rules[id];
    return rule ? { ...rule } : null;
  }

  public async create(
    ruleData: Omit<VersionedFinancialRule, 'id' | 'version' | 'createdAt'>,
    actor: string,
    actorRole: UserRole = 'ADMIN'
  ): Promise<VersionedFinancialRule> {
    const schema = this.engine.getSchema();
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rule: VersionedFinancialRule = {
      ...ruleData,
      id,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    schema.rules[id] = rule;
    this.engine.persist();

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'CREATE_RULE',
        targetEntity: rule.title,
        details: `Created verified financial rule ${rule.ruleKey} (Country: ${rule.countryCode}, Value: ${rule.value})`,
        newState: rule,
      });
    }

    return { ...rule };
  }

  public async update(
    id: string,
    updates: Partial<VersionedFinancialRule>,
    actor: string,
    actorRole: UserRole = 'ADMIN'
  ): Promise<VersionedFinancialRule | null> {
    const schema = this.engine.getSchema();
    const existing = schema.rules[id];
    if (!existing) return null;

    const previousState = { ...existing };
    const newVersion = existing.version + 1;

    const updated: VersionedFinancialRule = {
      ...existing,
      ...updates,
      id,
      previousValue: existing.value,
      version: newVersion,
      validFrom: updates.validFrom || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    schema.rules[id] = updated;
    this.engine.persist();

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'UPDATE_RULE',
        targetEntity: existing.title,
        details: `Updated rule ${existing.ruleKey} from ${existing.value} to ${updates.value}. Bumped version to v${newVersion}.`,
        previousState,
        newState: updated,
      });
    }

    return { ...updated };
  }
}
