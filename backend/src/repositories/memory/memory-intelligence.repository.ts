/**
 * Dhanya In-Memory Intelligence Feed Repository
 * Application: backend
 */

import { WhatChangedEvent, UserRole } from '@dhanya/types';
import { INITIAL_WHAT_CHANGED_EVENTS } from '@dhanya/finance-engine';
import { IIntelligenceRepository, IAuditRepository } from '../interfaces';

export class MemoryIntelligenceRepository implements IIntelligenceRepository {
  private events: WhatChangedEvent[] = [];
  private auditRepo?: IAuditRepository;

  constructor(auditRepo?: IAuditRepository) {
    this.auditRepo = auditRepo;
    this.events = [...INITIAL_WHAT_CHANGED_EVENTS];
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(countryCode?: string): Promise<WhatChangedEvent[]> {
    if (countryCode && countryCode !== 'ALL') {
      return this.events.filter((e) => e.countryCode === countryCode);
    }
    return this.events;
  }

  public async create(
    event: WhatChangedEvent,
    actor: string,
    actorRole: UserRole = 'CHIEF_ACTUARY'
  ): Promise<WhatChangedEvent> {
    this.events.unshift(event);

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'PUBLISH_INTELLIGENCE',
        targetEntity: event.title,
        details: `Published intelligence event: ${event.title} (Effective: ${event.effectiveDate}, Impact: ${event.impactScore})`,
        newState: event,
      });
    }

    return event;
  }
}
