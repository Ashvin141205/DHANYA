/**
 * Dhanya Admin & Audit API Routes
 * Application: backend
 * 
 * Secured with token-based role authorization (ADMIN, OWNER).
 * Standard USER role is strictly blocked with HTTP 403 Forbidden.
 */

import { Router, Response } from 'express';
import { validatePaginationQuery } from '@dhanya/validation';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { adminRateLimiter } from '../middleware/rate-limiter.middleware';
import { dbManager } from '../repositories/database.manager';

export const adminRouter = Router();

adminRouter.use(adminRateLimiter);

/**
 * GET /api/v1/admin/audit-logs
 * Queries the tamper-resistant system audit trail.
 * Requires: ADMIN or OWNER role.
 */
adminRouter.get(
  '/audit-logs',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { limit } = validatePaginationQuery(req.query);
    const logs = await dbManager.audit.findAll(limit);
    const integrity = await dbManager.audit.verifyIntegrity();

    res.json({
      status: 'success',
      count: logs.length,
      integrity: {
        hashChainVerified: integrity.valid,
        totalRecords: integrity.totalRecords,
        brokenChainIndex: integrity.brokenChainIndex,
      },
      data: logs,
    });
  }
);

/**
 * GET /api/v1/admin/audit-logs/verify-integrity
 * Validates cryptographic SHA-256 hash chain of the entire audit repository.
 * Requires: ADMIN or OWNER role.
 */
adminRouter.get(
  '/audit-logs/verify-integrity',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const integrity = await dbManager.audit.verifyIntegrity();

    res.json({
      status: 'success',
      data: {
        valid: integrity.valid,
        totalVerifiedRecords: integrity.totalRecords,
        brokenChainIndex: integrity.brokenChainIndex ?? null,
        algorithm: 'SHA-256 Hash Chain',
        message: integrity.valid
          ? 'Cryptographic audit ledger integrity verified. Zero tamper events detected.'
          : `Hash chain verification failed at index ${integrity.brokenChainIndex}.`,
      },
    });
  }
);

/**
 * GET /api/v1/admin/health & /diagnostics
 * Returns honest system diagnostics, active storage adapter, and metrics.
 * Requires: ADMIN or OWNER role.
 */
adminRouter.get(
  '/health',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const diagnostics = await dbManager.getDiagnostics();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      engine: 'Dhanya Deterministic Actuarial v1',
      persistence: diagnostics,
    });
  }
);

adminRouter.get(
  '/diagnostics',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const diagnostics = await dbManager.getDiagnostics();
    res.json({
      status: 'success',
      data: diagnostics,
    });
  }
);

/**
 * GET /api/v1/admin/users
 * Lists persistent users, tenant IDs, roles, and lifecycle statuses.
 * Requires: ADMIN or OWNER role.
 */
adminRouter.get(
  '/users',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const users = await dbManager.users.findAll();
    res.json({
      status: 'success',
      count: users.length,
      data: users,
    });
  }
);

/**
 * PATCH /api/v1/admin/users/:id/status
 * Updates user account status (ACTIVE, SUSPENDED, PENDING).
 * Requires: ADMIN or OWNER role.
 */
adminRouter.patch(
  '/users/:id/status',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body || {};
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_USER_STATUS',
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const updated = await dbManager.users.updateStatus(
      req.params.id,
      status,
      req.user!.name,
      req.user!.role
    );

    if (!updated) {
      res.status(404).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        error: 'User not found in system repository.',
      });
      return;
    }

    res.json({
      status: 'success',
      data: updated,
    });
  }
);

