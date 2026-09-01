/**
 * Dhanya Server-Side Data Repository Bridge
 * Application: backend
 * 
 * Re-exports the unified dbManager and provides backward-compatible abstractions.
 */

import { dbManager } from '../repositories/database.manager';

export { dbManager } from '../repositories/database.manager';
export * from '../repositories';

// Legacy adapter bridging for existing imports if any
export const backendStore = {
  getRules: (countryCode?: string) => dbManager.rules.findAll(countryCode),
  getRuleById: (id: string) => dbManager.rules.findById(id),
  getSources: () => dbManager.sources.findAll(),
  getSourceById: (id: string) => dbManager.sources.findById(id),
  getWhatChangedEvents: (countryCode?: string) => dbManager.intelligence.findAll(countryCode),
  getAuditLogs: (limit?: number) => dbManager.audit.findAll(limit),
};
