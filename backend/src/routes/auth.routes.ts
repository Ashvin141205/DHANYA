/**
 * Dhanya Authentication API Routes
 * Application: backend
 * 
 * Enforces strict environment gating, eliminates dev token leaks, and removes role escalation.
 */

import { Router, Response } from 'express';
import { validateAuthLoginInput } from '@dhanya/validation';
import { authService } from '../auth/auth.service';
import { getAuthProvider } from '../auth/auth.provider';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, requireAuth } from '../auth/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';
import { dbManager } from '../repositories/database.manager';
import { getAuthConfig } from '../config/auth.config';
import { tokenRevocationStore } from '../auth/revocation.store';

export const authRouter = Router();

authRouter.use(authRateLimiter);

/**
 * GET /api/v1/auth/status
 * Diagnostic endpoint reporting active auth architecture and environment status.
 * NEVER exposes secrets, keys, or token values.
 */
authRouter.get('/status', (_req: AuthenticatedRequest, res: Response) => {
  const config = getAuthConfig();
  const provider = getAuthProvider();

  res.json({
    status: 'success',
    data: {
      environment: config.env,
      devAuthEnabled: config.enableDevAuth,
      providerName: provider.providerName,
      isProductionReady: provider.isProductionReady,
    },
  });
});

/**
 * GET /api/v1/auth/dev-users
 * Returns predefined personas for development & testing.
 * Strictly disabled (404) in production or when DHANYA_ENABLE_DEV_AUTH is not explicitly true.
 * NEVER returns pre-minted tokens or privileged keys.
 */
authRouter.get('/dev-users', (_req: AuthenticatedRequest, res: Response) => {
  const config = getAuthConfig();
  if (!config.enableDevAuth || config.isProduction) {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      error: 'Development authentication endpoint is not available in this environment.',
    });
    return;
  }

  const provider = getAuthProvider();
  const personas = provider.listDevPersonas();

  // Return clean list of personas WITHOUT any pre-minted tokens
  res.json({
    status: 'success',
    data: personas,
  });
});

/**
 * POST /api/v1/auth/dev-login
 * Development-only authentication endpoint with fixed, non-spoofable roles & countryCode.
 * Strictly returns 404 in production or when dev auth is disabled.
 */
authRouter.post('/dev-login', async (req: AuthenticatedRequest, res: Response) => {
  const config = getAuthConfig();
  if (!config.enableDevAuth || config.isProduction) {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      error: 'Development authentication is not available in this environment.',
    });
    return;
  }

  const { devUserId, email } = req.body || {};
  const provider = getAuthProvider();

  let user = null;
  if (devUserId && typeof devUserId === 'string') {
    user = await provider.authenticateDevUser(devUserId);
  } else if (email && typeof email === 'string') {
    user = await provider.authenticateDevByEmail(email);
  }

  if (!user) {
    res.status(401).json({
      status: 'error',
      code: 'AUTHENTICATION_FAILED',
      error: 'Unable to authenticate with specified dev persona.',
    });
    return;
  }

  // NOTE: countryCode and role are strictly server-authoritative from the persona.
  // Any client-supplied 'countryCode' or 'role' in request body is intentionally IGNORED.

  const token = authService.generateToken(user);
  const expiresAt = new Date(Date.now() + config.maxSessionLifetimeSeconds * 1000).toISOString();

  // Audit dev auth usage & login event without logging sensitive tokens
  try {
    await dbManager.audit.record({
      actor: user.name,
      actorId: user.id,
      actorRole: user.role,
      action: 'DEV_AUTH_USAGE',
      targetEntity: 'AUTH_SESSION',
      details: `Dev persona '${user.name}' authenticated with server-authoritative role '${user.role}'`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const isPrivileged = user.role === 'OWNER' || user.role === 'ADMIN';
    await dbManager.audit.record({
      actor: user.name,
      actorId: user.id,
      actorRole: user.role,
      action: isPrivileged ? 'ADMIN_LOGIN' : 'AUTH_LOGIN',
      targetEntity: 'AUTH_SESSION',
      details: `${isPrivileged ? 'Administrator' : 'User'} signed in with role '${user.role}' via ${provider.providerName}`,
      ipAddress: req.ip || '127.0.0.1',
    });
  } catch (auditErr) {
    console.error('Audit recording error during dev-login:', auditErr);
  }

  res.json({
    status: 'success',
    data: {
      token,
      user,
      expiresAt,
      provider: provider.providerName,
    },
  });
});

/**
 * POST /api/v1/auth/login
 * Standard email authentication endpoint.
 * Server is 100% authoritative for roles:
 * - If email matches DHANYA_ADMIN_EMAIL -> ADMIN role
 * - Any other email -> USER role
 * Any client-supplied role or countryCode is strictly ignored.
 */
authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const config = getAuthConfig();
  const provider = getAuthProvider();

  const validation = validateAuthLoginInput(req.body);
  if (!validation.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_CREDENTIALS_PAYLOAD',
      error: 'Invalid authentication payload.',
      details: validation.errors,
    });
    return;
  }

  const { email } = validation.data;
  const user = await provider.authenticateDevByEmail(email);

  if (!user) {
    try {
      await dbManager.audit.record({
        actor: email.substring(0, 32),
        actorId: 'unauthenticated',
        actorRole: 'USER',
        action: 'AUTH_LOGIN_FAILED',
        targetEntity: 'AUTH_SESSION',
        details: `Failed authentication attempt for email '${email.substring(0, 32)}'`,
        ipAddress: req.ip || '127.0.0.1',
      });
    } catch (err) {
      console.error('Audit recording error:', err);
    }

    res.status(401).json({
      status: 'error',
      code: 'AUTHENTICATION_FAILED',
      error: 'Unable to authenticate with provided credentials.',
    });
    return;
  }

  const token = authService.generateToken(user);
  const expiresAt = new Date(Date.now() + config.maxSessionLifetimeSeconds * 1000).toISOString();
  const isPrivileged = user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'CHIEF_ACTUARY';

  // Audit login event without logging sensitive tokens
  try {
    await dbManager.audit.record({
      actor: user.name,
      actorId: user.id,
      actorRole: user.role,
      action: isPrivileged ? 'ADMIN_LOGIN' : 'AUTH_LOGIN',
      targetEntity: 'AUTH_SESSION',
      details: `${isPrivileged ? 'Administrator' : 'User'} (${user.email}) signed in with role '${user.role}'`,
      ipAddress: req.ip || '127.0.0.1',
    });
  } catch (auditErr) {
    console.error('Audit recording error during login:', auditErr);
  }

  res.json({
    status: 'success',
    data: {
      token,
      user,
      expiresAt,
      provider: provider.providerName,
    },
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user profile.
 */
authRouter.get('/me', authenticate, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Cryptographically revokes active token session and records audit event.
 */
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    if (rawToken) {
      const payload = authService.verifyToken(rawToken);
      if (payload && payload.jti && payload.exp) {
        tokenRevocationStore.revoke(payload.jti, payload.exp);
      }
    }
  }

  if (req.user) {
    const isPrivileged = req.user.role === 'OWNER' || req.user.role === 'ADMIN';
    try {
      await dbManager.audit.record({
        actor: req.user.name,
        actorId: req.user.id,
        actorRole: req.user.role,
        action: isPrivileged ? 'ADMIN_LOGOUT' : 'AUTH_LOGOUT',
        targetEntity: 'AUTH_SESSION',
        details: `${isPrivileged ? 'Administrator' : 'User'} signed out and revoked session`,
        ipAddress: req.ip || '127.0.0.1',
      });
    } catch (auditErr) {
      console.error('Audit recording error during logout:', auditErr);
    }
  }

  res.json({
    status: 'success',
    message: 'Logged out successfully. Token session revoked.',
  });
});

