/**
 * Dhanya Durable User Repository
 * Application: backend
 * 
 * Provides production-grade durable storage and status lifecycle for users.
 */

import { AuthUser, UserRole, UserStatus } from '@dhanya/types';
import { IUserRepository, IAuditRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableUserRepository implements IUserRepository {
  private engine: DurableDatabaseEngine;
  private auditRepo?: IAuditRepository;

  constructor(engine: DurableDatabaseEngine, auditRepo?: IAuditRepository) {
    this.engine = engine;
    this.auditRepo = auditRepo;
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(): Promise<AuthUser[]> {
    const schema = this.engine.getSchema();
    return Object.values(schema.users);
  }

  public async findById(id: string): Promise<AuthUser | null> {
    const schema = this.engine.getSchema();
    const user = schema.users[id];
    return user ? { ...user } : null;
  }

  public async findByEmail(email: string): Promise<AuthUser | null> {
    const schema = this.engine.getSchema();
    const user = Object.values(schema.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  public async create(user: AuthUser, actor: string, actorRole: UserRole = 'ADMIN'): Promise<AuthUser> {
    const schema = this.engine.getSchema();
    const newUser: AuthUser = {
      ...user,
      status: user.status || 'ACTIVE',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    schema.users[newUser.id] = newUser;
    this.engine.persist();

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'CHANGE_STATUS',
        targetEntity: `USER:${newUser.id}`,
        details: `Created user account '${newUser.name}' with role '${newUser.role}' and tenant '${newUser.tenantId}'`,
        newState: newUser,
      });
    }

    return { ...newUser };
  }

  public async updateStatus(
    id: string,
    status: UserStatus,
    actor: string,
    actorRole: UserRole = 'ADMIN'
  ): Promise<AuthUser | null> {
    const schema = this.engine.getSchema();
    const user = schema.users[id];
    if (!user) return null;

    const previousState = { ...user };
    const updated: AuthUser = {
      ...user,
      status,
      updatedAt: new Date().toISOString(),
    };

    schema.users[id] = updated;
    this.engine.persist();

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'CHANGE_STATUS',
        targetEntity: `USER:${user.id}`,
        details: `Updated user account '${user.name}' status from '${user.status || 'ACTIVE'}' to '${status}'`,
        previousState,
        newState: updated,
      });
    }

    return { ...updated };
  }
}
