/**
 * Dhanya Authentication Types & Interfaces
 * Application: backend
 */

import { Request } from 'express';
import { AuthUser, AuthTokenPayload, UserRole } from '@dhanya/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface IAuthService {
  generateToken(user: AuthUser, expiresInSeconds?: number): string;
  verifyToken(token: string): AuthTokenPayload | null;
}

export interface DevPersona {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  countryCode?: string;
  createdAt: string;
}

export interface IAuthProvider {
  readonly providerName: string;
  readonly isProductionReady: boolean;

  /**
   * Authenticate against fixed dev personas by identifier (development/test only).
   */
  authenticateDevUser(devUserId: string): Promise<AuthUser | null>;

  /**
   * Authenticate against dev email. Predefined personas retain fixed roles.
   * Any custom email receives strictly 'USER' role and cannot self-elevate.
   */
  authenticateDevByEmail(email: string): Promise<AuthUser | null>;

  /**
   * List available dev personas without pre-minted tokens.
   */
  listDevPersonas(): DevPersona[];

  /**
   * Production authentication boundary (OIDC / OAuth token exchange).
   */
  authenticateProduction(credentials: unknown): Promise<AuthUser | null>;

  /**
   * Retrieve user record by ID.
   */
  getUserById(userId: string): Promise<AuthUser | null>;
}
