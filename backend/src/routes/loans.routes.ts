/**
 * Dhanya Loan Management API Routes
 * Application: backend
 * 
 * Enforces strict multi-tenant user isolation.
 * Every loan operation is authenticated and bound to the authenticated user's ID.
 */

import { Router, Response } from 'express';
import { validateUserTrackedLoanInput, validateRecordPaymentInput } from '@dhanya/validation';
import { UserTrackedLoan } from '@dhanya/types';
import { AuthenticatedRequest } from '../auth/auth.types';
import { authenticate, requireAuth } from '../auth/auth.middleware';
import { dbManager } from '../repositories/database.manager';

export const loansRouter = Router();

// Enforce authentication on all loan endpoints
loansRouter.use(authenticate);
loansRouter.use(requireAuth);

/**
 * GET /api/v1/loans
 * Retrieves all tracked loans belonging exclusively to the authenticated user.
 */
loansRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userLoans = await dbManager.loans.findAllByUserId(userId);

  res.json({
    status: 'success',
    count: userLoans.length,
    data: userLoans,
  });
});

/**
 * GET /api/v1/loans/:id
 * Retrieves an individual loan by ID with tenant ownership verification.
 */
loansRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const loanId = req.params.id;

  const loan = await dbManager.loans.findById(loanId, userId);
  if (!loan) {
    res.status(404).json({
      status: 'error',
      code: 'LOAN_NOT_FOUND',
      error: 'The requested loan was not found or does not belong to your account.',
    });
    return;
  }

  res.json({
    status: 'success',
    data: loan,
  });
});

/**
 * POST /api/v1/loans
 * Creates a new loan associated with the authenticated user.
 */
loansRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const validation = validateUserTrackedLoanInput(req.body);

  if (!validation.isValid) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_LOAN_PAYLOAD',
      error: 'Loan payload failed actuarial validation rules.',
      details: validation.errors,
    });
    return;
  }

  const sanitizedLoan: UserTrackedLoan = {
    ...(validation.sanitized as unknown as UserTrackedLoan),
    userId,
  };

  const saved = await dbManager.loans.save(sanitizedLoan, userId);

  // Record audit log entry
  await dbManager.audit.record({
    actor: req.user!.name,
    actorId: userId,
    actorRole: req.user!.role,
    action: 'CREATE_LOAN',
    targetEntity: saved.name,
    details: `Added new loan '${saved.name}' (${saved.currencyCode} ${saved.originalPrincipal} at ${saved.interestRate}%)`,
    newState: saved,
  });

  res.status(201).json({
    status: 'success',
    data: saved,
  });
});

/**
 * PUT/PATCH /api/v1/loans/:id
 * Updates an existing loan with tenant ownership verification.
 */
loansRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const loanId = req.params.id;

  const existing = await dbManager.loans.findById(loanId, userId);
  if (!existing) {
    res.status(404).json({
      status: 'error',
      code: 'LOAN_NOT_FOUND',
      error: 'The requested loan was not found or does not belong to your account.',
    });
    return;
  }

  const merged = {
    ...existing,
    ...req.body,
    id: loanId,
    userId,
  };

  const validation = validateUserTrackedLoanInput(merged);
  if (!validation.isValid) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_LOAN_PAYLOAD',
      error: 'Loan update payload failed validation.',
      details: validation.errors,
    });
    return;
  }

  const updated = await dbManager.loans.update(
    loanId,
    validation.sanitized as unknown as Partial<UserTrackedLoan>,
    userId
  );

  await dbManager.audit.record({
    actor: req.user!.name,
    actorId: userId,
    actorRole: req.user!.role,
    action: 'UPDATE_LOAN',
    targetEntity: existing.name,
    details: `Updated loan parameters for '${existing.name}'`,
    previousState: existing,
    newState: updated,
  });

  res.json({
    status: 'success',
    data: updated,
  });
});

/**
 * DELETE /api/v1/loans/:id
 * Deletes a loan with tenant ownership verification.
 */
loansRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const loanId = req.params.id;

  const existing = await dbManager.loans.findById(loanId, userId);
  if (!existing) {
    res.status(404).json({
      status: 'error',
      code: 'LOAN_NOT_FOUND',
      error: 'The requested loan was not found or does not belong to your account.',
    });
    return;
  }

  const deleted = await dbManager.loans.delete(loanId, userId);

  await dbManager.audit.record({
    actor: req.user!.name,
    actorId: userId,
    actorRole: req.user!.role,
    action: 'DELETE_LOAN',
    targetEntity: existing.name,
    details: `Deleted loan '${existing.name}' from portfolio`,
    previousState: existing,
  });

  res.json({
    status: 'success',
    deleted,
    message: `Loan '${existing.name}' successfully removed.`,
  });
});

/**
 * POST /api/v1/loans/:id/record-payment
 * Records an installment payment against the private tracking ledger.
 * Note: This is an internal ledger calculation, NOT an external banking debit.
 */
loansRouter.post('/:id/record-payment', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const loanId = req.params.id;

  const paymentValidation = validateRecordPaymentInput(req.body);
  if (!paymentValidation.success) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid payment parameters.',
      details: paymentValidation.errors,
    });
    return;
  }

  const loan = await dbManager.loans.findById(loanId, userId);
  if (!loan) {
    res.status(404).json({
      status: 'error',
      code: 'LOAN_NOT_FOUND',
      error: 'Loan not found or unauthorized.',
    });
    return;
  }

  const extraPrincipal = paymentValidation.data!.extraPrincipal;
  const monthlyRate = loan.interestRate / 100 / 12;
  const interestComponent = Number((loan.currentPrincipal * monthlyRate).toFixed(2));
  const standardPrincipalComponent = Math.max(0, Number((loan.monthlyEmi - interestComponent).toFixed(2)));
  const totalPrincipalReduction = Number((standardPrincipalComponent + extraPrincipal).toFixed(2));

  const newPrincipal = Math.max(0, Number((loan.currentPrincipal - totalPrincipalReduction).toFixed(2)));
  const totalInstallments = loan.totalInstallments || loan.tenureMonths || 1;
  const paidInstallments = (loan.paidInstallments || 0) + 1;
  const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
  const isPaidOff = newPrincipal <= 0.01 || remainingInstallments === 0;

  // Advance next due date by 1 month
  const currentDate = new Date(loan.nextDueDate || Date.now());
  currentDate.setMonth(currentDate.getMonth() + 1);
  const nextDueDate = currentDate.toISOString().split('T')[0];

  const updated = await dbManager.loans.update(
    loanId,
    {
      currentPrincipal: newPrincipal,
      paidInstallments,
      remainingInstallments,
      nextDueDate,
      status: isPaidOff ? 'PAID_OFF' : 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    },
    userId
  );

  await dbManager.audit.record({
    actor: req.user!.name,
    actorId: userId,
    actorRole: req.user!.role,
    action: 'RECORD_PAYMENT',
    targetEntity: loan.name,
    details: `Recorded installment payment on '${loan.name}'. Principal reduced from ${loan.currencyCode} ${loan.currentPrincipal} to ${loan.currencyCode} ${newPrincipal} (Interest: ${loan.currencyCode} ${interestComponent}, Principal: ${loan.currencyCode} ${standardPrincipalComponent}, Extra: ${loan.currencyCode} ${extraPrincipal}). (Private Ledger Tracking Update)`,
    previousState: loan,
    newState: updated,
  });

  res.json({
    status: 'success',
    message: 'Installment recorded in private tracking ledger.',
    data: updated,
  });
});
