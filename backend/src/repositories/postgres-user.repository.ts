import { Pool } from 'pg';
import {
  IUserRepository,
} from './interfaces';
import {
  AuthUser,
  UserRole,
  UserStatus,
} from '@dhanya/types';

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<AuthUser[]> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at ASC
      `,
    );

    return result.rows.map(this.mapRow);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email],
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async create(
    user: AuthUser,
    actor: string,
    actorRole?: UserRole,
  ): Promise<AuthUser> {
    void actor;
    void actorRole;

    const result = await this.pool.query(
      `
      INSERT INTO users (
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      `,
      [
        user.id,
        user.tenantId,
        user.email,
        user.name,
        user.role,
        user.status,
        user.countryCode,
        user.createdAt,
        user.updatedAt,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async updateStatus(
    id: string,
    status: UserStatus,
    actor: string,
    actorRole?: UserRole,
  ): Promise<AuthUser | null> {
    void actor;
    void actorRole;

    const result = await this.pool.query(
      `
      UPDATE users
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        tenant_id,
        email,
        name,
        role,
        status,
        country_code,
        created_at,
        updated_at
      `,
      [id, status],
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: any): AuthUser {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      countryCode: row.country_code,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}