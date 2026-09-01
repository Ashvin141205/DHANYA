/**
 * Dhanya Verified Sources Registry API Routes
 * Application: backend
 * 
 * Public read access; provenance re-verification restricted to CHIEF_ACTUARY or OWNER.
 */

import { Router, Response } from 'express';
import { validateSourceVerificationInput } from '@dhanya/validation';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, optionalAuth, requireRole } from '../auth/auth.middleware';
import { dbManager } from '../repositories/database.manager';

export const sourcesRouter = Router();

// GET /api/v1/sources - List all authoritative sources
sourcesRouter.get('/', optionalAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const sources = await dbManager.sources.findAll();
  res.json({
    status: 'success',
    count: sources.length,
    data: sources,
  });
});

// GET /api/v1/sources/:id - Get specific source
sourcesRouter.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const source = await dbManager.sources.findById(req.params.id);
  if (!source) {
    res.status(404).json({
      status: 'error',
      code: 'SOURCE_NOT_FOUND',
      error: 'Authoritative source not found.',
    });
    return;
  }
  res.json({ status: 'success', data: source });
});

// POST /api/v1/sources/:id/verify - Re-verify provenance (Requires ADMIN, CHIEF_ACTUARY, or OWNER)
sourcesRouter.post(
  '/:id/verify',
  authenticate,
  requireRole('ADMIN', 'CHIEF_ACTUARY', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateSourceVerificationInput(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_FAILED',
        error: 'Invalid source verification payload.',
        details: validation.errors,
      });
      return;
    }

    const { status } = validation.data!;

    const verified = await dbManager.sources.verify(
      req.params.id,
      req.user!.name,
      status,
      req.user!.role
    );

    if (!verified) {
      res.status(404).json({
        status: 'error',
        code: 'SOURCE_NOT_FOUND',
        error: 'Authoritative source not found.',
      });
      return;
    }

    res.json({ status: 'success', data: verified });
  }
);
