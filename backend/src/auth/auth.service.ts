/**
 * Dhanya Stateless Signed Token Authentication Service
 * Application: backend
 * 
 * Uses HMAC-SHA256 with timing-safe verification, mandatory standard claims (iss, aud, sub, role, iat, exp, jti),
 * server-side revocation validation, and fail-closed secret enforcement.
 */

import crypto from 'node:crypto';
import { AuthUser, AuthTokenPayload, UserRole } from '@dhanya/types';
import { IAuthService } from './auth.types';
import { getAuthConfig } from '../config/auth.config';
import { tokenRevocationStore } from './revocation.store';

const VALID_ROLES: ReadonlyArray<UserRole> = Object.freeze(['USER', 'ADMIN', 'CHIEF_ACTUARY', 'OWNER']);

export class SignedTokenAuthService implements IAuthService {
  private customSecret?: string;

  constructor(secret?: string) {
    this.customSecret = secret;
  }

  private getSecret(): string | null {
    if (this.customSecret) return this.customSecret;
    const config = getAuthConfig();
    if (!config.isSecretConfigured || !config.tokenSecret) {
      return null;
    }
    return config.tokenSecret;
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  private sign(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  public generateToken(user: AuthUser, requestedLifetimeSeconds?: number): string {
    const config = getAuthConfig();
    const secret = this.getSecret();
    if (!secret) {
      throw new Error('Authentication signing failed: DHANYA_AUTH_SECRET is not configured for production environment (Fail Closed).');
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = requestedLifetimeSeconds && requestedLifetimeSeconds > 0
      ? Math.min(requestedLifetimeSeconds, config.maxSessionLifetimeSeconds)
      : config.maxSessionLifetimeSeconds;

    const jti = `jti_${crypto.randomUUID()}`;

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload: AuthTokenPayload = {
      iss: config.tokenIssuer,
      aud: config.tokenAudience,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      countryCode: user.countryCode,
      iat: now,
      exp: now + ttl,
      jti,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public mintToken(user: AuthUser, expiresInSeconds?: number): string {
    return this.generateToken(user, expiresInSeconds);
  }

  public static mintTokenWithClaims(
    claims: Partial<AuthTokenPayload> & { sub: string; email: string; name: string; role: UserRole },
    secret: string = 'dhanya-actuarial-dev-test-secret-min-32-chars-long-do-not-use-in-prod',
    customHeader?: any
  ): string {
    const service = new SignedTokenAuthService(secret);
    const now = Math.floor(Date.now() / 1000);
    const header = customHeader || { alg: 'HS256', typ: 'JWT' };

    const payload: any = {
      iss: 'dhanya-actuarial-core',
      aud: 'dhanya-platform',
      iat: now,
      exp: now + 3600,
      jti: `jti_${crypto.randomUUID()}`,
      ...claims,
    };

    const encodedHeader = service.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = service.base64UrlEncode(JSON.stringify(payload));
    const signature = service.sign(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public verifyToken(token: string): AuthTokenPayload | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = this.getSecret();
    if (!secret) return null;

    // Reject empty signature or header/payload
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`, secret);

    // Timing-safe signature comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    try {
      // 1. Validate Header
      const headerRaw = this.base64UrlDecode(encodedHeader);
      const header = JSON.parse(headerRaw);
      if (header?.alg !== 'HS256' || header?.typ !== 'JWT') {
        return null; // Reject algorithm substitution or non-JWT type
      }

      // 2. Validate Payload JSON
      const payloadRaw = this.base64UrlDecode(encodedPayload);
      const payload: AuthTokenPayload = JSON.parse(payloadRaw);
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const config = getAuthConfig();

      // 3. Mandatory Issuer claim (missing or mismatched iss is strictly rejected)
      if (typeof payload.iss !== 'string' || payload.iss !== config.tokenIssuer) {
        return null;
      }

      // 4. Mandatory Audience claim (missing or mismatched aud is strictly rejected)
      if (typeof payload.aud !== 'string' || payload.aud !== config.tokenAudience) {
        return null;
      }

      // 5. Mandatory Subject claim
      if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
        return null;
      }

      // 6. Mandatory Role claim
      if (!payload.role || !VALID_ROLES.includes(payload.role)) {
        return null;
      }

      // 7. Issued At (iat) validation
      if (typeof payload.iat !== 'number' || !Number.isInteger(payload.iat)) {
        return null;
      }

      // 8. Expiration (exp) validation
      if (typeof payload.exp !== 'number' || !Number.isInteger(payload.exp)) {
        return null;
      }

      // Invariant: exp must be strictly greater than iat
      if (payload.exp <= payload.iat) {
        return null;
      }

      // Invariant: token must not be expired
      if (payload.exp <= now) {
        return null;
      }

      // 9. Mandatory Token Identifier (jti)
      if (typeof payload.jti !== 'string' || payload.jti.trim().length === 0) {
        return null;
      }

      // 10. Server-Side Revocation Check
      if (tokenRevocationStore.isRevoked(payload.jti)) {
        return null; // Token was revoked on logout / invalidation
      }

      return payload;
    } catch {
      return null;
    }
  }
}

export const authService = new SignedTokenAuthService();
export const AuthService = authService;
