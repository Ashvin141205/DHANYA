/**
 * Dhanya Durable Intelligence Repository
 * Application: backend
 */

import { WhatChangedEvent, UserRole } from '@dhanya/types';
import { IIntelligenceRepository, IAuditRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableIntelligenceRepository implements IIntelligenceRepository {
  private engine: DurableDatabaseEngine;
  private auditRepo?: IAuditRepository;

  constructor(engine: DurableDatabaseEngine, auditRepo?: IAuditRepository) {
    this.engine = engine;
    this.auditRepo = auditRepo;
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(countryCode?: string): Promise<WhatChangedEvent[]> {
    const schema = this.engine.getSchema();
    if (countryCode && countryCode !== 'ALL') {
      return schema.intelligenceEvents.filter((e) => e.countryCode === countryCode);
    }
    return schema.intelligenceEvents;
  }

  public async create(
    event: WhatChangedEvent,
    actor: string,
    actorRole: UserRole = 'CHIEF_ACTUARY'
  ): Promise<WhatChangedEvent> {
    const schema = this.engine.getSchema();
    schema.intelligenceEvents.unshift(event);
    this.engine.persist();

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
