/**
 * Dhanya In-Memory Sliding-Window Rate Limiter
 * Application: backend
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  // Periodic cleanup of stale records every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1');

    const now = Date.now();
    let record = store.get(key);

    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);

      res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)));
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', '0');

      res.status(429).json({
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        error: message,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(max - record.timestamps.length));

    next();
  };
}

// Preset rate limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'Standard API rate limit reached (1000 req/min). Please slow down.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Authentication rate limit reached (200 req/min). Please try again shortly.',
});

export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Admin operation rate limit reached (60 req/min).',
});
