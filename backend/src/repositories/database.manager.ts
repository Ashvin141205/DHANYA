/**
 * Dhanya Database & Repository Manager
 * Application: backend
 */

import {
  IUserRepository,
  ILoanRepository,
  IRulesRepository,
  ISourceRepository,
  IIntelligenceRepository,
  IAuditRepository,
} from './interfaces';

import { DurableDatabaseEngine } from './durable/durable-db';
import { DurableUserRepository } from './durable/durable-user.repository';
import { DurableLoanRepository } from './durable/durable-loan.repository';
import { DurableRulesRepository } from './durable/durable-rules.repository';
import { DurableSourceRepository } from './durable/durable-source.repository';
import { DurableIntelligenceRepository } from './durable/durable-intelligence.repository';
import { DurableAuditRepository } from './durable/durable-audit.repository';

import { MemoryUserRepository } from './memory/memory-user.repository';
import { MemoryLoanRepository } from './memory/memory-loan.repository';
import { MemoryRulesRepository } from './memory/memory-rules.repository';
import { MemorySourceRepository } from './memory/memory-source.repository';
import { MemoryIntelligenceRepository } from './memory/memory-intelligence.repository';
import { MemoryAuditRepository } from './memory/memory-audit.repository';

import { postgresPool } from './postgres.pool';
import { PostgresUserRepository } from './postgres-user.repository';
import { PostgresLoanRepository } from './postgres-loan.repository';
import { PostgresRulesRepository } from './postgres-rules.repository';
import { PostgresSourceRepository } from './postgres-source.repository';
import { PostgresIntelligenceRepository } from './postgres-intelligence.repository';
import { PostgresAuditRepository } from './postgres-audit.repository';
import { PostgresRuleHistoryRepository } from './postgres-rule-history.repository';

export interface DatabaseDiagnostics {
  adapter: 'POSTGRESQL' | 'DURABLE_FILE_LEDGER' | 'IN_MEMORY';
  isDurable: boolean;
  storagePath?: string;
  uptimeSeconds: number;
  totalUsers: number;
  totalLoans: number;
  totalRules: number;
  totalSources: number;
  totalIntelligenceEvents: number;
  totalAuditLogs: number;
  hashChainVerified: boolean;
}

export class DatabaseManager {
  public readonly users: IUserRepository;
  public readonly loans: ILoanRepository;
  public readonly rules: IRulesRepository;
  public readonly sources: ISourceRepository;
  public readonly intelligence: IIntelligenceRepository;
  public readonly audit: IAuditRepository;
  public readonly ruleHistory?: PostgresRuleHistoryRepository;

  private readonly engineType:
    | 'POSTGRESQL'
    | 'DURABLE_FILE_LEDGER'
    | 'IN_MEMORY';

  private durableEngine?: DurableDatabaseEngine;
  private startTime = Date.now();

  constructor(forceInMemory: boolean = false) {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.DHANYA_ENV === 'production';

    const storageAdapter =
      process.env.STORAGE_ADAPTER?.toLowerCase();

    if (isProduction && forceInMemory) {
      throw new Error(
        'FATAL: In-memory storage adapter is strictly forbidden in production mode. Durable storage is mandatory.',
      );
    }

    /*
     * PostgreSQL is explicitly selected through:
     * STORAGE_ADAPTER="postgres"
     */
    if (!forceInMemory && storageAdapter === 'postgres') {
      const auditRepo = new PostgresAuditRepository(postgresPool);

      this.audit = auditRepo;
      this.ruleHistory = new PostgresRuleHistoryRepository(postgresPool);
      this.users = new PostgresUserRepository(postgresPool);
      this.users = new PostgresUserRepository(postgresPool);
      this.loans = new PostgresLoanRepository(postgresPool);
      this.rules = new PostgresRulesRepository(
        postgresPool,
        auditRepo,
      );
      this.sources = new PostgresSourceRepository(
        postgresPool,
        auditRepo,
      );
      this.intelligence =
        new PostgresIntelligenceRepository(
          postgresPool,
          auditRepo,
        );

      this.engineType = 'POSTGRESQL';
      return;
    }

    /*
     * Existing durable JSON ledger remains available as fallback
     * unless PostgreSQL is explicitly selected.
     */
    if (!forceInMemory) {
      try {
        const engine = new DurableDatabaseEngine();
        engine.init();

        this.durableEngine = engine;
        this.engineType = 'DURABLE_FILE_LEDGER';

        const auditRepo = new DurableAuditRepository(engine);

        this.audit = auditRepo;
        this.users = new DurableUserRepository(
          engine,
          auditRepo,
        );
        this.loans = new DurableLoanRepository(engine);
        this.rules = new DurableRulesRepository(
          engine,
          auditRepo,
        );
        this.sources = new DurableSourceRepository(
          engine,
          auditRepo,
        );
        this.intelligence =
          new DurableIntelligenceRepository(
            engine,
            auditRepo,
          );

        return;
      } catch (err) {
        if (isProduction) {
          throw new Error(
            `FATAL: Durable persistence initialization failed in production mode: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }

        console.warn(
          'DatabaseManager: Durable storage initialization fallback to memory adapter (development/test only):',
          err,
        );
      }
    }

    this.engineType = 'IN_MEMORY';

    const auditRepo = new MemoryAuditRepository();

    this.audit = auditRepo;
    this.users = new MemoryUserRepository(auditRepo);
    this.loans = new MemoryLoanRepository();
    this.rules = new MemoryRulesRepository(auditRepo);
    this.sources = new MemorySourceRepository(auditRepo);
    this.intelligence =
      new MemoryIntelligenceRepository(auditRepo);
  }

  public getEngineType():
    | 'POSTGRESQL'
    | 'DURABLE_FILE_LEDGER'
    | 'IN_MEMORY' {
    return this.engineType;
  }

  public getDurableEngine(): DurableDatabaseEngine | undefined {
    return this.durableEngine;
  }

  public async getDiagnostics(): Promise<DatabaseDiagnostics> {
    const usersList = await this.users.findAll();
    const rulesList = await this.rules.findAll();
    const sourcesList = await this.sources.findAll();
    const intList = await this.intelligence.findAll();
    const auditList = await this.audit.findAll(2000);

    const integrity = await this.audit.verifyIntegrity();

    let totalLoans = 0;

    if (this.engineType === 'POSTGRESQL') {
      const result = await postgresPool.query(
        'SELECT COUNT(*)::int AS count FROM loans',
      );

      totalLoans = result.rows[0]?.count ?? 0;
    } else if (this.durableEngine) {
      totalLoans = Object.keys(
        this.durableEngine.getSchema().loans,
      ).length;
    }

    return {
      adapter: this.engineType,
      isDurable: this.engineType !== 'IN_MEMORY',
      storagePath: this.durableEngine?.getStoragePath(),
      uptimeSeconds: Math.floor(
        (Date.now() - this.startTime) / 1000,
      ),
      totalUsers: usersList.length,
      totalLoans,
      totalRules: rulesList.length,
      totalSources: sourcesList.length,
      totalIntelligenceEvents: intList.length,
      totalAuditLogs: auditList.length,
      hashChainVerified: integrity.valid,
    };
  }
}

export const dbManager = new DatabaseManager();