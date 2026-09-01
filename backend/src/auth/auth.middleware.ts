/**
 * Dhanya Server Authorization & Authentication Middleware
 * Application: backend
 * 
 * Enforces strict role-based access control and tenant token verification.
 * Cryptographically validates identity tokens and records audit logs for authorization violations.
 */

import { Response, NextFunction } from 'express';
import { UserRole } from '@dhanya/types';
import { AuthenticatedRequest } from './auth.types';
import { authService } from './auth.service';
import { dbManager } from '../repositories/database.manager';

/**
 * Extracts and verifies Bearer token from Authorization header.
 * Attaches verified user to req.user.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next();
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return next();
  }

  // Token is cryptographically valid
  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    countryCode: payload.countryCode,
    createdAt: new Date(payload.iat * 1000).toISOString(),
  };

  return next();
}

/**
 * Middleware: Requires valid authentication. Rejects anonymous requests with 401.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      error: 'Authentication required. Please provide a valid Bearer token in the Authorization header.',
    });
    return;
  }
  next();
}

/**
 * Middleware: Allows anonymous access but populates req.user if a valid token is provided.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authenticate(req, res, () => {
    next();
  });
}

/**
 * Role hierarchy checker.
 * OWNER has supreme access.
 * Specific roles have scoped access.
 */
export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === 'OWNER') return true;
  return requiredRoles.includes(userRole);
}

/**
 * Middleware: Requires the authenticated user to possess one of the specified roles.
 * Rejects with 401 if unauthenticated, or 403 if role is unauthorized.
 * Records AUTHORIZATION_DENIED audit log without sensitive data.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        error: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!hasRoleAccess(req.user.role, allowedRoles)) {
      // Record security audit event for denied access
      try {
        await dbManager.audit.record({
          actor: req.user.name,
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'AUTHORIZATION_DENIED',
          targetEntity: req.baseUrl + req.path,
          details: `Role '${req.user.role}' denied access to endpoint requiring [${allowedRoles.join(', ')}]`,
          ipAddress: req.ip || '127.0.0.1',
        });
      } catch (auditErr) {
        console.error('Failed to log authorization denial audit event:', auditErr);
      }

      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        error: `Access denied. Endpoint requires one of [${allowedRoles.join(', ')}] role privileges. Your current role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}

// Named convenience helpers
export const requireAdmin = requireRole('ADMIN', 'OWNER');
export const requireActuary = requireRole('CHIEF_ACTUARY', 'OWNER');
export const requireOwner = requireRole('OWNER');
