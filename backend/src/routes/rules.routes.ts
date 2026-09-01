/**
 * Dhanya Financial Rules API Routes
 * Application: backend
 * 
 * Public read access; modifications strictly restricted to ADMIN or OWNER roles.
 */

import { Router, Response } from 'express';
import { validateRuleUpdateInput } from '@dhanya/validation';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, optionalAuth, requireRole } from '../auth/auth.middleware';
import { dbManager } from '../repositories/database.manager';

export const rulesRouter = Router();

// GET /api/v1/rules - List versioned financial rules
rulesRouter.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const country = req.query.country as string | undefined;
  const rules = await dbManager.rules.findAll(country);

  res.json({
    status: 'success',
    count: rules.length,
    data: rules,
  });
});

// GET /api/v1/rules/:id - Get specific rule
rulesRouter.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const rule = await dbManager.rules.findById(req.params.id);
  if (!rule) {
    res.status(404).json({
      status: 'error',
      code: 'RULE_NOT_FOUND',
      error: 'Financial rule not found.',
    });
    return;
  }
  res.json({ status: 'success', data: rule });
});

// GET /api/v1/rules/:id/history - Get complete rule history
rulesRouter.get(
  '/:id/history',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!dbManager.ruleHistory) {
      res.status(503).json({
        status: 'error',
        code: 'HISTORY_UNAVAILABLE',
        error: 'Rule history storage is currently unavailable.',
      });
      return;
    }

    const rule = await dbManager.rules.findById(req.params.id);

    if (!rule) {
      res.status(404).json({
        status: 'error',
        code: 'RULE_NOT_FOUND',
        error: 'Financial rule not found.',
      });
      return;
    }

    const fromDate =
      typeof req.query.from === 'string'
        ? req.query.from
        : undefined;

    const toDate =
      typeof req.query.to === 'string'
        ? req.query.to
        : undefined;

    const history = await dbManager.ruleHistory.findByRuleKey(
      rule.ruleKey,
      fromDate,
      toDate,
    );

    res.json({
      status: 'success',
      rule: {
        id: rule.id,
        ruleKey: rule.ruleKey,
        title: rule.title,
        countryCode: rule.countryCode,
      },
      count: history.length,
      data: history,
    });
  },
);

// POST /api/v1/rules - Create new rule (Requires ADMIN or OWNER)
rulesRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateRuleUpdateInput(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_FAILED',
        error: 'Rule creation payload failed validation.',
        details: validation.errors,
      });
      return;
    }

    const { title, ruleKey, value, countryCode, category, unit, changeSummary } = validation.data!;
    const sources = await dbManager.sources.findAll();
    const source = (req.body.sourceId ? await dbManager.sources.findById(req.body.sourceId) : null) || sources[0];

    const rule = await dbManager.rules.create(
      {
        title,
        ruleKey,
        value,
        countryCode: countryCode as any,
        category: category as any,
        unit: unit as any,
        validFrom: new Date().toISOString().split('T')[0],
        source,
        changeSummary,
      },
      req.user!.name,
      req.user!.role
    );

    res.status(201).json({ status: 'success', data: rule });
  }
);

// PATCH /api/v1/rules/:id - Update existing rule (Requires ADMIN or OWNER)
rulesRouter.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'OWNER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { value, changeSummary, title, validFrom } = req.body;
    if (value === undefined || isNaN(Number(value))) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_VALUE',
        error: 'A valid numeric rule value is required.',
      });
      return;
    }

    const updated = await dbManager.rules.update(
      req.params.id,
      {
        value: Number(value),
        title: typeof title === 'string' && title.trim() ? title.trim() : undefined,
        changeSummary: changeSummary || 'Rule value updated via Actuary API',
        validFrom: typeof validFrom === 'string' ? validFrom : undefined,
      },
      req.user!.name,
      req.user!.role
    );

    if (!updated) {
      res.status(404).json({
        status: 'error',
        code: 'RULE_NOT_FOUND',
        error: 'Rule not found.',
      });
      return;
    }

    res.json({ status: 'success', data: updated });
  }
);
