/**
 * Dhanya Security Headers Middleware
 * Application: backend
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Control framing permissions (allow SAMEORIGIN for AI Studio preview iframe embedding)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Disable legacy XSS filter in favor of CSP
  res.setHeader('X-XSS-Protection', '0');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict feature access
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Content Security Policy safe for Vite + iframe execution
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; connect-src 'self' ws: wss: http: https: data: blob:; frame-ancestors 'self' http://localhost:* https://*.google.com https://*.googleusercontent.com https://*.aistudio.google.com;"
  );

  next();
}
