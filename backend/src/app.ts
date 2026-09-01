/**
 * Dhanya Backend Express Application Factory
 * Application: backend
 */

import express, { Express } from 'express';
import { apiRouter } from './routes';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';

export function createBackendApp(): Express {
  const app = express();

  // Security Headers
  app.use(securityHeadersMiddleware);

  // Core middlewares with strict payload limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Custom engine headers
  app.use((_req, res, next) => {
    res.setHeader('X-Dhanya-Engine', 'Deterministic-Actuarial-v1');
    res.setHeader('X-Dhanya-Provenance', 'Verified-Statutory');
    next();
  });

  // Mount API Router under /api/v1
  app.use('/api/v1', apiRouter);

  // Global Safe Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}
