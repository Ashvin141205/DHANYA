/**
 * Dhanya In-Memory User Repository
 * Application: backend
 * 
 * Ephemeral memory-only implementation for isolated testing environments.
 */

import { AuthUser, UserRole, UserStatus } from '@dhanya/types';
import { IUserRepository, IAuditRepository } from '../interfaces';
import { DEV_PERSONAS } from '../../auth/auth.provider';

export class MemoryUserRepository implements IUserRepository {
  private users: Map<string, AuthUser> = new Map();
  private auditRepo?: IAuditRepository;

  constructor(auditRepo?: IAuditRepository) {
    this.auditRepo = auditRepo;
    DEV_PERSONAS.forEach((p) => {
      this.users.set(p.id, { ...p, status: 'ACTIVE' });
    });
  }

  public setAuditRepo(repo: IAuditRepository) {
    this.auditRepo = repo;
  }

  public async findAll(): Promise<AuthUser[]> {
    return Array.from(this.users.values());
  }

  public async findById(id: string): Promise<AuthUser | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  public async findByEmail(email: string): Promise<AuthUser | null> {
    const user = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  public async create(user: AuthUser, actor: string, actorRole: UserRole = 'ADMIN'): Promise<AuthUser> {
    const newUser: AuthUser = {
      ...user,
      status: user.status || 'ACTIVE',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(newUser.id, newUser);

    if (this.auditRepo) {
      await this.auditRepo.record({
        actor,
        actorRole,
        action: 'CHANGE_STATUS',
        targetEntity: `USER:${newUser.id}`,
        details: `Created user account '${newUser.name}' with role '${newUser.role}'`,
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
    const user = this.users.get(id);
    if (!user) return null;

    const previousState = { ...user };
    const updated: AuthUser = {
      ...user,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);

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
