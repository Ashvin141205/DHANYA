/**
 * Dhanya Intelligence Feed ("What Changed") API Routes
 * Application: backend
 * 
 * Public read access; bulletin publishing restricted to CHIEF_ACTUARY or OWNER.
 */

import { Router, Response } from 'express';
import { validateIntelligenceEventInput } from '@dhanya/validation';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, optionalAuth, requireRole } from '../auth/auth.middleware';
import { dbManager } from '../repositories/database.manager';

export const intelligenceRouter = Router();

// GET /api/v1/intelligence, /api/v1/intelligence/events, /api/v1/intelligence/what-changed
const handleListEvents = async (req: AuthenticatedRequest, res: Response) => {
  const country = req.query.country as string | undefined;
  const category = req.query.category as string | undefined;
  let events = await dbManager.intelligence.findAll(country);

  if (category && category !== 'ALL') {
    events = events.filter((e) => e.category === category);
  }

  res.json({
    status: 'success',
    count: events.length,
    data: events,
  });
};

intelligenceRouter.get('/', optionalAuth, handleListEvents);
intelligenceRouter.get('/events', optionalAuth, handleListEvents);
intelligenceRouter.get('/what-changed', optionalAuth, handleListEvents);

// POST /api/v1/intelligence - Publish new intelligence event (Requires ADMIN, CHIEF_ACTUARY, or OWNER)
intelligenceRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'CHIEF_ACTUARY', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateIntelligenceEventInput(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_FAILED',
        error: 'Intelligence bulletin payload failed validation.',
        details: validation.errors,
      });
      return;
    }

    const {
      title,
      category,
      countryCode,
      summary,
      detailedAnalysis,
      effectiveDate,
      impactScore,
      affectedPersonas,
      sourceId,
      previousRuleValue,
      newRuleValue,
    } = validation.data!;

    if (!sourceId) {
      res.status(400).json({
        status: 'error',
        code: 'MISSING_SOURCE_REFERENCE',
        error: 'A valid authoritative sourceId is required to publish an intelligence event.',
      });
      return;
    }

    const source = await dbManager.sources.findById(sourceId);
    if (!source) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_SOURCE_REFERENCE',
        error: `Referenced source '${sourceId}' does not exist in authoritative sources registry.`,
      });
      return;
    }

    const newEvent = {
      id: `wc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      category: category as any,
      countryCode: countryCode as any,
      effectiveDate,
      publishedDate: new Date().toISOString().split('T')[0],
      summary,
      detailedAnalysis,
      impactScore: impactScore as any,
      affectedPersonas,
      source,
      previousRuleValue,
      newRuleValue,
    };

    const created = await dbManager.intelligence.create(
      newEvent,
      req.user!.name,
      req.user!.role
    );

    res.status(201).json({ status: 'success', data: created });
  }
);
