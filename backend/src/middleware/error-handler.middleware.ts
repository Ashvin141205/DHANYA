/**
 * Dhanya Safe Error Handler Middleware
 * Application: backend
 * 
 * Intercepts uncaught errors, prevents leaking internal stack traces,
 * database details, or credentials, and formats consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandlerMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Avoid leaking raw stacks or db connection strings to client
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const errorCode = err.code || (statusCode === 400 ? 'INVALID_INPUT' : 'INTERNAL_SERVER_ERROR');
  const message = err.isPublic || statusCode < 500
    ? err.message
    : 'An internal server error occurred. Please contact actuarial support if this persists.';

  // Log privately on server
  console.error('[API Server Error]', {
    code: errorCode,
    status: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    error: message,
    details: err.details || undefined,
    timestamp: new Date().toISOString(),
  });
}
