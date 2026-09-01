/**
 * Dhanya In-Memory Rules Repository
 * Application: backend
 */

import { VersionedFinancialRule, UserRole } from '@dhanya/types';
import { INITIAL_VERSIONED_RULES } from '@dhanya/finance-engine';
import { IRulesRepository, IAuditRepository } from '../interfaces';

export class MemoryRulesRepository implements IRulesRepository {
  private rules: Map<string, VersionedFinancialRule> = new Map();
  private auditRepo?: IAuditRepository;

  constructor(auditRepo?: IAuditRepository) {
    this.auditRepo = auditRepo;
    INITIAL_VERSIONED_RULES.forEach((rule) => {
      this.rules.set(rule.id, { ...rule });
    });
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(countryCode?: string): Promise<VersionedFinancialRule[]> {
    const list = Array.from(this.rules.values());
    if (countryCode && countryCode !== 'ALL') {
      return list.filter((r) => r.countryCode === countryCode);
    }
    return list;
  }

  public async findById(id: string): Promise<VersionedFinancialRule | null> {
    const rule = this.rules.get(id);
    return rule ? { ...rule } : null;
  }

  public async create(
    ruleData: Omit<VersionedFinancialRule, 'id' | 'version' | 'createdAt'>,
    actor: string,
    actorRole: UserRole = 'ADMIN'
  ): Promise<VersionedFinancialRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rule: VersionedFinancialRule = {
      ...ruleData,
      id,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    this.rules.set(id, rule);

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
    const existing = this.rules.get(id);
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

    this.rules.set(id, updated);

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
