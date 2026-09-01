/**
 * Dhanya Server & Multi-App Host
 * 
 * Architectural Role:
 * - Hosts /backend Express API routes on /api/v1/*
 * - Proxies / serves independent /web application on /*
 * - Proxies / serves independent /admin application on /admin/*
 * 
 * Web, Admin, and Backend are 100% independent applications with separate entry points,
 * separate Vite configs, separate tsconfigs, and separate package.json manifests.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/src/routes';
import { securityHeadersMiddleware } from './backend/src/middleware/security-headers.middleware';
import { errorHandlerMiddleware } from './backend/src/middleware/error-handler.middleware';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers
  app.use(securityHeadersMiddleware);

  // JSON Body Parser with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Engine identifiers
  app.use((_req, res, next) => {
    res.setHeader('X-Dhanya-Engine', 'Deterministic-Actuarial-v1');
    res.setHeader('X-Dhanya-Provenance', 'Verified-Statutory');
    next();
  });

  // Backend API Routes (Server Application)
  app.use('/api/v1', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Mount separate Vite development servers for Web and Admin

    // 1. Admin Vite Dev Server (Rooted in /admin)
    const adminVite = await createViteServer({
      root: path.resolve(process.cwd(), 'admin'),
      base: '/admin/',
      server: {
        middlewareMode: true,
        hmr: {
          port: 24678,
        },
      },
      appType: 'spa',
    });

    // 2. Web Vite Dev Server (Rooted in /web)
    const webVite = await createViteServer({
      root: path.resolve(process.cwd(), 'web'),
      base: '/',
      server: {
        middlewareMode: true,
        hmr: {
          port: 24679,
        },
      },
      appType: 'spa',
    });

    // Route dispatching
    app.use('/admin', adminVite.middlewares);
    app.use(webVite.middlewares);

  } else {
    // Production Mode: Serve independently compiled static bundles

    const webDistPath = path.resolve(process.cwd(), 'web/dist');
    const adminDistPath = path.resolve(process.cwd(), 'admin/dist');

    // Admin Static Distribution
    if (fs.existsSync(adminDistPath)) {
      app.use('/admin', express.static(adminDistPath));
      app.get('/admin*', (_req, res) => {
        res.sendFile(path.join(adminDistPath, 'index.html'));
      });
    }

    // Web Static Distribution
    if (fs.existsSync(webDistPath)) {
      app.use(express.static(webDistPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(webDistPath, 'index.html'));
      });
    }
  }

  // Safe global error handler
  app.use(errorHandlerMiddleware);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dhanya Engine] Unified Gateway running on http://0.0.0.0:${PORT}`);
    console.log(`[Dhanya Engine] Public Web:   http://0.0.0.0:${PORT}/`);
    console.log(`[Dhanya Engine] Admin Portal: http://0.0.0.0:${PORT}/admin`);
    console.log(`[Dhanya Engine] API v1:       http://0.0.0.0:${PORT}/api/v1/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Dhanya server:', err);
  process.exit(1);
});
