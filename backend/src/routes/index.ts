/**
 * Dhanya Main API Router Aggregator
 * Application: backend
 */

import { Router } from 'express';
import { authRouter } from './auth.routes';
import { calculationsRouter } from './calculations.routes';
import { rulesRouter } from './rules.routes';
import { intelligenceRouter } from './intelligence.routes';
import { sourcesRouter } from './sources.routes';
import { loansRouter } from './loans.routes';
import { adminRouter } from './admin.routes';
import { apiRateLimiter } from '../middleware/rate-limiter.middleware';
import { dbManager } from '../repositories/database.manager';

export const apiRouter = Router();

// Apply general API rate limiter
apiRouter.use(apiRateLimiter);

// Mount API route groups
apiRouter.use('/auth', authRouter);
apiRouter.use('/calculations', calculationsRouter);
apiRouter.use('/rules', rulesRouter);
apiRouter.use('/intelligence', intelligenceRouter);
apiRouter.use('/sources', sourcesRouter);
apiRouter.use('/loans', loansRouter);
apiRouter.use('/admin', adminRouter);

// Health check with active persistence diagnostics
apiRouter.get('/health', async (_req, res) => {
  const diagnostics = await dbManager.getDiagnostics();
  res.json({
    status: 'ok',
    version: '2.0.0-production-persistence',
    timestamp: new Date().toISOString(),
    persistence: diagnostics,
  });
});
