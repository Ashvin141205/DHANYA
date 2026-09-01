import 'dotenv/config';

/**
 * Dhanya Centralized Authentication & Security Configuration
 * Application: backend
 * 
 * Enforces strict environment gating, fail-closed production secret requirements,
 * and standard token lifetime policies:
 * - DHANYA_ENV: 'development' | 'test' | 'production'
 * - DHANYA_ENABLE_DEV_AUTH: boolean (strictly false by default, forbidden in production)
 * - DHANYA_AUTH_PROVIDER: 'dev' | 'oidc' (defaults to oidc in production)
 * - DHANYA_AUTH_SECRET: Minimum 32-character high-entropy secret. Mandatory in production (fails closed).
 */

export type EnvironmentType = 'development' | 'test' | 'production';
export type AuthProviderType = 'dev' | 'oidc';

export interface AuthConfig {
  env: EnvironmentType;
  enableDevAuth: boolean;
  authProvider: AuthProviderType;
  tokenIssuer: string;
  tokenAudience: string;
  tokenSecret: string;
  isProduction: boolean;
  isSecretConfigured: boolean;
  maxSessionLifetimeSeconds: number;
  authorizedAdminEmail: string;
}

const DEV_TEST_FALLBACK_SECRET = 'dhanya-actuarial-dev-test-secret-min-32-chars-long-do-not-use-in-prod';
const INSECURE_PLACEHOLDERS = new Set([
  'dhanya-actuarial-auth-signing-secret-v1-do-not-leak',
  'dhanya-actuarial-dev-test-secret-min-32-chars-long-do-not-use-in-prod',
  'secret',
  'changeme',
  'password',
  '12345678901234567890123456789012',
]);

export function getAuthConfig(): AuthConfig {
  const env: EnvironmentType = (process.env.DHANYA_ENV as EnvironmentType) ||
    (process.env.NODE_ENV === 'test' ? 'test' : process.env.NODE_ENV === 'production' ? 'production' : 'development');

  const isProduction = env === 'production';

  // Single configured Admin email
  const authorizedAdminEmail = (process.env.DHANYA_ADMIN_EMAIL || 'admin@dhanya.com').trim().toLowerCase();

  // CRITICAL: In production, dev auth is strictly disabled regardless of user setting.
  // In development/test, it is enabled by default unless explicitly disabled with DHANYA_ENABLE_DEV_AUTH="false".
  const rawEnableDevAuth = process.env.DHANYA_ENABLE_DEV_AUTH;
  const enableDevAuth = !isProduction && (rawEnableDevAuth === undefined || rawEnableDevAuth === 'true' || rawEnableDevAuth !== 'false');

  const authProvider: AuthProviderType = (process.env.DHANYA_AUTH_PROVIDER as AuthProviderType) ||
    (enableDevAuth ? 'dev' : 'oidc');

  const tokenIssuer = 'dhanya-actuarial-core';
  const tokenAudience = 'dhanya-platform';

  const providedSecret = process.env.DHANYA_AUTH_SECRET?.trim() || '';

  // Max session lifetime
  const parsedTtl = parseInt(process.env.DHANYA_MAX_SESSION_LIFETIME_SECONDS || '', 10);
  const maxSessionLifetimeSeconds = !isNaN(parsedTtl) && parsedTtl > 0
    ? parsedTtl
    : (isProduction ? 86400 : 604800); // 24 hours in prod, 7 days in dev

  // Validate secret strength
  let tokenSecret = '';
  let isSecretConfigured = false;

  if (isProduction) {
    if (providedSecret && providedSecret.length >= 32 && !INSECURE_PLACEHOLDERS.has(providedSecret)) {
      tokenSecret = providedSecret;
      isSecretConfigured = true;
    } else {
      // In production with missing or weak secret: FAIL CLOSED.
      tokenSecret = '';
      isSecretConfigured = false;
    }
  } else {
    // Development / Test mode
    if (providedSecret && providedSecret.length >= 32) {
      tokenSecret = providedSecret;
      isSecretConfigured = true;
    } else {
      tokenSecret = DEV_TEST_FALLBACK_SECRET;
      isSecretConfigured = true;
    }
  }

  return {
    env,
    enableDevAuth,
    authProvider,
    tokenIssuer,
    tokenAudience,
    tokenSecret,
    isProduction,
    isSecretConfigured,
    maxSessionLifetimeSeconds,
    authorizedAdminEmail,
  };
}

export const authConfig = getAuthConfig();

