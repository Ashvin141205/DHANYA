/**
 * Dhanya Authentication Provider Architecture
 * Application: backend
 * 
 * Provides strict separation between Development and Production Identity Providers:
 * - DevAuthProvider: Fixed server-side personas with immutable roles. No client-driven role escalation.
 * - ProductionAuthProvider: Enterprise OIDC / OAuth2 boundary. Fails safely if not configured.
 */

import { AuthUser, UserRole } from '@dhanya/types';
import { IAuthProvider, DevPersona } from './auth.types';
import { getAuthConfig } from '../config/auth.config';

export const DEV_PERSONAS: ReadonlyArray<Readonly<AuthUser>> = Object.freeze([
  Object.freeze({
    id: 'usr_owner_001',
    tenantId: 'tenant_system_internal',
    email: 'owner@dhanya.internal',
    name: 'Platform Principal Owner',
    role: 'OWNER' as UserRole,
    status: 'ACTIVE' as const,
    countryCode: 'US',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }),
  Object.freeze({
    id: 'usr_admin_001',
    tenantId: 'tenant_system_internal',
    email: 'admin@dhanya.com',
    name: 'Systems Administrator',
    role: 'ADMIN' as UserRole,
    status: 'ACTIVE' as const,
    countryCode: 'US',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }),
  Object.freeze({
    id: 'usr_actuary_001',
    tenantId: 'tenant_system_internal',
    email: 'actuary@dhanya.internal',
    name: 'Chief Actuary Officer',
    role: 'CHIEF_ACTUARY' as UserRole,
    status: 'ACTIVE' as const,
    countryCode: 'US',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }),
  Object.freeze({
    id: 'usr_borrower_001',
    tenantId: 'tenant_rivera_001',
    email: 'alex.rivera@example.com',
    name: 'Alex Rivera (Tenant A)',
    role: 'USER' as UserRole,
    status: 'ACTIVE' as const,
    countryCode: 'US',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  }),
  Object.freeze({
    id: 'usr_saver_002',
    tenantId: 'tenant_chen_002',
    email: 'sarah.chen@example.com',
    name: 'Sarah Chen (Tenant B)',
    role: 'USER' as UserRole,
    status: 'ACTIVE' as const,
    countryCode: 'US',
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-01-20T00:00:00.000Z',
  }),
]);

export const DEV_USERS = DEV_PERSONAS;

/**
 * DevAuthProvider
 * Available ONLY in development/testing environments when DHANYA_ENABLE_DEV_AUTH=true.
 * Immutable server-side role assignment; privilege escalation is impossible.
 */
export class DevAuthProvider implements IAuthProvider {
  public readonly providerName = 'Dhanya Isolated Dev Provider (Deterministic)';
  public readonly isProductionReady = false;
  private static customUsers: Map<string, AuthUser> = new Map();

  public static getDevUsers(): ReadonlyArray<Readonly<AuthUser>> {
    return DEV_PERSONAS;
  }

  public static getUserById(userId: string): AuthUser | null {
    const persona = DEV_PERSONAS.find((p) =>
      p.id === userId ||
      (userId === 'usr_dev_alex' && p.id === 'usr_borrower_001') ||
      (userId === 'usr_dev_sarah' && p.id === 'usr_saver_002') ||
      (userId === 'usr_dev_actuary' && p.id === 'usr_actuary_001') ||
      (userId === 'usr_dev_admin' && p.id === 'usr_admin_001') ||
      (userId === 'usr_dev_owner' && p.id === 'usr_owner_001')
    );
    if (persona) return { ...persona };
    return DevAuthProvider.customUsers.get(userId) || null;
  }

  public async authenticateDevUser(devUserId: string): Promise<AuthUser | null> {
    const config = getAuthConfig();
    if (!config.enableDevAuth) {
      return null;
    }

    const persona = DEV_PERSONAS.find((p) =>
      p.id === devUserId ||
      (devUserId === 'usr_dev_alex' && p.id === 'usr_borrower_001') ||
      (devUserId === 'usr_dev_sarah' && p.id === 'usr_saver_002') ||
      (devUserId === 'usr_dev_actuary' && p.id === 'usr_actuary_001') ||
      (devUserId === 'usr_dev_admin' && p.id === 'usr_admin_001') ||
      (devUserId === 'usr_dev_owner' && p.id === 'usr_owner_001')
    );
    if (!persona) {
      return null;
    }

    // Return a clone with immutable server-defined role
    return {
      id: persona.id,
      email: persona.email,
      name: persona.name,
      role: persona.role,
      countryCode: persona.countryCode,
      createdAt: persona.createdAt,
      lastLoginAt: new Date().toISOString(),
    };
  }

  public async authenticateDevByEmail(email: string): Promise<AuthUser | null> {
    const config = getAuthConfig();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if matches the configured DHANYA_ADMIN_EMAIL -> Strictly assigned 'ADMIN' role
    if (config.authorizedAdminEmail && cleanEmail === config.authorizedAdminEmail.toLowerCase()) {
      const adminUser: AuthUser = {
        id: 'usr_admin_configured',
        tenantId: 'tenant_system_internal',
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
        role: 'ADMIN',
        status: 'ACTIVE',
        countryCode: 'US',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      DevAuthProvider.customUsers.set(adminUser.id, adminUser);
      return adminUser;
    }

    // 2. Check if matches a predefined dev persona
    const matchedPersona = DEV_PERSONAS.find((p) => p.email.toLowerCase() === cleanEmail);
    if (matchedPersona) {
      return {
        id: matchedPersona.id,
        email: matchedPersona.email,
        name: matchedPersona.name,
        role: matchedPersona.role,
        countryCode: matchedPersona.countryCode,
        createdAt: matchedPersona.createdAt,
        lastLoginAt: new Date().toISOString(),
      };
    }

    // 3. Dynamic test / normal user account -> STRICTLY assigned 'USER' role
    const newUser: AuthUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
      role: 'USER',
      status: 'ACTIVE',
      countryCode: 'US',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    DevAuthProvider.customUsers.set(newUser.id, newUser);
    return newUser;
  }

  public listDevPersonas(): DevPersona[] {
    const config = getAuthConfig();
    if (!config.enableDevAuth) {
      return [];
    }

    // Return personas WITHOUT tokens
    return DEV_PERSONAS.map((p) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      countryCode: p.countryCode,
      createdAt: p.createdAt,
    }));
  }

  public async authenticateProduction(_credentials: unknown): Promise<AuthUser | null> {
    return null;
  }

  public async getUserById(userId: string): Promise<AuthUser | null> {
    const persona = DEV_PERSONAS.find((p) => p.id === userId);
    if (persona) {
      return { ...persona };
    }
    return DevAuthProvider.customUsers.get(userId) || null;
  }
}

/**
 * ProductionAuthProvider
 * Pluggable boundary for enterprise OIDC / OAuth2 providers.
 * 
 * SECURITY INVARIANT:
 * isProductionReady MUST remain false until an actual cryptographically validated
 * OIDC token exchange adapter is implemented. Merely defining environment variables
 * (OIDC_ISSUER, OIDC_CLIENT_ID) without complete JWKS key verification must NOT claim
 * production readiness.
 */
export class ProductionAuthProvider implements IAuthProvider {
  public readonly providerName = 'Dhanya Production Identity Provider (Not Configured)';
  public readonly isProductionReady: boolean = false;

  constructor() {
    // Fails safe: no simulated or unvalidated OIDC implementation is claimed
  }

  public async authenticateDevUser(_devUserId: string): Promise<AuthUser | null> {
    // Dev auth is strictly forbidden in production provider
    return null;
  }

  public async authenticateDevByEmail(_email: string): Promise<AuthUser | null> {
    // Dev auth is strictly forbidden in production provider
    return null;
  }

  public listDevPersonas(): DevPersona[] {
    // Dev personas are NEVER exposed in production provider
    return [];
  }

  public async authenticateProduction(_credentials: unknown): Promise<AuthUser | null> {
    // Returns null to force 501 IDP_NOT_CONFIGURED at route layer
    return null;
  }

  public async getUserById(_userId: string): Promise<AuthUser | null> {
    return null;
  }
}

/**
 * Factory function to retrieve the appropriate provider based on active configuration
 */
export function getAuthProvider(): IAuthProvider {
  const config = getAuthConfig();
  if (config.enableDevAuth) {
    return new DevAuthProvider();
  }
  return new ProductionAuthProvider();
}

export const authProvider = getAuthProvider();
