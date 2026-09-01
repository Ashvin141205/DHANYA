/**
 * Dhanya Calculation API Routes
 * Application: backend
 * 
 * Enforces strict, zero-default deterministic validation for all actuarial calculation APIs.
 * Reject all invalid inputs (NaN, Infinity, negative values, missing required fields, unsupported enums).
 */

import { Router, Request, Response } from 'express';
import {
  calculateLoanSchedule,
  calculateSIP,
  calculateProgressiveTax,
  calculateRefinanceBreakeven,
  calculateFireTarget,
  TAX_BRACKETS_BY_JURISDICTION,
} from '@dhanya/finance-engine';
import {
  validateLoanCalculationInput,
  validateSIPCalculationInput,
  validateTaxCalculationInput,
  validateRefinanceCalculationInput,
  validateFireCalculationInput,
} from '@dhanya/validation';

export const calculationsRouter = Router();

// POST /api/v1/calculations/loan & POST /api/v1/calculations/mortgage
const handleLoanCalculation = (req: Request, res: Response) => {
  const validation = validateLoanCalculationInput(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid loan calculation parameters.',
      details: validation.errors,
    });
  }

  const { principal, annualRatePct, tenureYears, extraMonthlyPayment, annualPrepayment, compoundingMethod } = validation.data!;
  const result = calculateLoanSchedule(
    principal,
    annualRatePct,
    tenureYears,
    extraMonthlyPayment,
    annualPrepayment,
    compoundingMethod
  );

  res.json({
    status: 'success',
    data: result,
    engine: 'deterministic-actuarial-v1',
    calculatedAt: new Date().toISOString(),
  });
};

calculationsRouter.post('/loan', handleLoanCalculation);
calculationsRouter.post('/mortgage', handleLoanCalculation);

// POST /api/v1/calculations/sip
calculationsRouter.post('/sip', (req: Request, res: Response) => {
  const validation = validateSIPCalculationInput(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid SIP calculation parameters.',
      details: validation.errors,
    });
  }

  const { monthlyInvestment, expectedAnnualReturnPct, timePeriodYears, annualStepUpPct, expectedInflationPct } = validation.data!;
  const result = calculateSIP(
    monthlyInvestment,
    expectedAnnualReturnPct,
    timePeriodYears,
    annualStepUpPct,
    expectedInflationPct
  );

  res.json({
    status: 'success',
    data: result,
    engine: 'deterministic-actuarial-v1',
    calculatedAt: new Date().toISOString(),
  });
});

// POST /api/v1/calculations/tax
calculationsRouter.post('/tax', (req: Request, res: Response) => {
  const validation = validateTaxCalculationInput(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid tax calculation parameters.',
      details: validation.errors,
    });
  }

  const { grossIncome, jurisdictionId, customDeductions } = validation.data!;
  const jConfig = TAX_BRACKETS_BY_JURISDICTION[jurisdictionId];

  if (!jConfig) {
    return res.status(400).json({
      status: 'error',
      code: 'UNSUPPORTED_JURISDICTION',
      error: `Jurisdiction '${jurisdictionId}' is not configured in statutory tables.`,
    });
  }

  const result = calculateProgressiveTax(
    grossIncome,
    jConfig.brackets,
    jConfig.standardDeduction,
    customDeductions,
    jConfig.source,
    jConfig.notes
  );

  res.json({
    status: 'success',
    data: result,
    engine: 'deterministic-actuarial-v1',
    calculatedAt: new Date().toISOString(),
  });
});

// POST /api/v1/calculations/refinance
calculationsRouter.post('/refinance', (req: Request, res: Response) => {
  const validation = validateRefinanceCalculationInput(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid refinance calculation parameters.',
      details: validation.errors,
    });
  }

  const {
    currentBalance,
    currentRatePct,
    currentRemainingTenureMonths,
    newRatePct,
    newTenureMonths,
    closingCosts,
  } = validation.data!;

  const result = calculateRefinanceBreakeven(
    currentBalance,
    currentRatePct,
    currentRemainingTenureMonths,
    newRatePct,
    newTenureMonths,
    closingCosts
  );

  res.json({
    status: 'success',
    data: result,
    engine: 'deterministic-actuarial-v1',
    calculatedAt: new Date().toISOString(),
  });
});

// POST /api/v1/calculations/fire
calculationsRouter.post('/fire', (req: Request, res: Response) => {
  const validation = validateFireCalculationInput(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_FAILED',
      error: 'Invalid FIRE calculation parameters.',
      details: validation.errors,
    });
  }

  const {
    annualExpenses,
    currentSavings,
    monthlySavings,
    swrPct,
    expectedReturnPct,
    inflationPct,
  } = validation.data!;

  const result = calculateFireTarget(
    annualExpenses,
    currentSavings,
    monthlySavings,
    swrPct,
    expectedReturnPct,
    inflationPct
  );

  res.json({
    status: 'success',
    data: result,
    engine: 'deterministic-actuarial-v1',
    calculatedAt: new Date().toISOString(),
  });
});
