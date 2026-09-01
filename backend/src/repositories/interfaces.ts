/**
 * Dhanya Repository Layer Interfaces
 * Application: backend
 * 
 * Defines strict persistence contracts for loans, rules, sources, intelligence, and audit trails.
 */

import {
  UserTrackedLoan,
  VersionedFinancialRule,
  SourceProvenance,
  WhatChangedEvent,
  AuditLogEntry,
  UserRole,
  AuditAction,
  AuthUser,
  UserStatus,
} from '@dhanya/types';

export interface IUserRepository {
  findAll(): Promise<AuthUser[]>;
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  create(user: AuthUser, actor: string, actorRole?: UserRole): Promise<AuthUser>;
  updateStatus(id: string, status: UserStatus, actor: string, actorRole?: UserRole): Promise<AuthUser | null>;
}

export interface ILoanRepository {
  findAllByUserId(userId: string): Promise<UserTrackedLoan[]>;
  findById(id: string, userId: string): Promise<UserTrackedLoan | null>;
  save(loan: UserTrackedLoan, userId: string): Promise<UserTrackedLoan>;
  update(id: string, updates: Partial<UserTrackedLoan>, userId: string): Promise<UserTrackedLoan | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface IRulesRepository {
  findAll(countryCode?: string): Promise<VersionedFinancialRule[]>;
  findById(id: string): Promise<VersionedFinancialRule | null>;
  create(
    rule: Omit<VersionedFinancialRule, 'id' | 'version' | 'createdAt'>,
    actor: string,
    actorRole?: UserRole
  ): Promise<VersionedFinancialRule>;
  update(
    id: string,
    updates: Partial<VersionedFinancialRule>,
    actor: string,
    actorRole?: UserRole
  ): Promise<VersionedFinancialRule | null>;
}

export interface ISourceRepository {
  findAll(): Promise<SourceProvenance[]>;
  findById(id: string): Promise<SourceProvenance | null>;
  verify(
    id: string,
    actor: string,
    status?: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED',
    actorRole?: UserRole
  ): Promise<SourceProvenance | null>;
}

export interface IIntelligenceRepository {
  findAll(countryCode?: string): Promise<WhatChangedEvent[]>;
  create(
    event: WhatChangedEvent,
    actor: string,
    actorRole?: UserRole
  ): Promise<WhatChangedEvent>;
}

export interface IAuditRepository {
  record(entry: {
    actor: string;
    actorId?: string;
    actorRole: UserRole;
    action: AuditAction;
    targetEntity: string;
    details: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
  }): Promise<AuditLogEntry>;
  findAll(limit?: number): Promise<AuditLogEntry[]>;
  verifyIntegrity(): Promise<{ valid: boolean; brokenChainIndex?: number; totalRecords: number }>;
}
