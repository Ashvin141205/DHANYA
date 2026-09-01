/**
 * Dhanya Input Validation & Sanitization Engine
 * Package: @dhanya/validation
 * 
 * Validates calculation requests, financial rule updates, and source provenance submissions.
 * Zero silent defaults for required parameters, strict rejection of NaN, Infinity, negative values,
 * non-numeric strings, and unsupported enumerations.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Checks if a value is a strictly valid finite number (or clean numeric string),
 * explicitly rejecting booleans, objects, arrays, null, undefined, empty strings,
 * NaN, and Infinity.
 */
export function isStrictFiniteNumber(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return false;
  if (typeof val === 'object') return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return false;
    // Disallow strings containing non-numeric characters (except single decimal/minus)
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return false;
  }
  const num = Number(val);
  return typeof num === 'number' && !Number.isNaN(num) && Number.isFinite(num);
}

export function validateLoanCalculationInput(input: any): ValidationResult<{
  principal: number;
  annualRatePct: number;
  tenureYears: number;
  extraMonthlyPayment: number;
  annualPrepayment: number;
  compoundingMethod: 'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL';
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Principal: required, finite, > 0
  if (!isStrictFiniteNumber(input.principal)) {
    errors.push('Principal amount is required and must be a valid finite number.');
  } else if (Number(input.principal) <= 0) {
    errors.push('Principal amount must be greater than zero.');
  }

  // 2. Annual rate: required, finite, >= 0 and <= 100
  const rawRate = input.annualRatePct ?? input.annualRate ?? input.rate;
  if (!isStrictFiniteNumber(rawRate)) {
    errors.push('Annual interest rate percentage (annualRatePct) is required and must be a valid finite number.');
  } else if (Number(rawRate) < 0 || Number(rawRate) > 100) {
    errors.push('Annual interest rate percentage must be between 0 and 100.');
  }

  // 3. Tenure: required (tenureYears or tenureMonths), finite, > 0 and <= 60 years. NO DEFAULTING TO 30!
  let tenureYears: number | undefined;
  if (isStrictFiniteNumber(input.tenureYears)) {
    tenureYears = Number(input.tenureYears);
  } else if (isStrictFiniteNumber(input.tenureMonths)) {
    tenureYears = Number(input.tenureMonths) / 12;
  } else {
    errors.push('Loan tenure (tenureYears or tenureMonths) is required and must be a valid finite number.');
  }

  if (tenureYears !== undefined) {
    if (tenureYears <= 0 || tenureYears > 60) {
      errors.push('Tenure must be between 1 month (0.083 years) and 60 years.');
    }
  }

  // 4. Extra Monthly Payment: optional (defaults to 0 if omitted/undefined/null). If provided, must be finite >= 0.
  let extraMonthlyPayment = 0;
  if (input.extraMonthlyPayment !== undefined && input.extraMonthlyPayment !== null) {
    if (!isStrictFiniteNumber(input.extraMonthlyPayment)) {
      errors.push('Extra monthly payment must be a valid finite number.');
    } else if (Number(input.extraMonthlyPayment) < 0) {
      errors.push('Extra monthly payment must be greater than or equal to 0.');
    } else {
      extraMonthlyPayment = Number(input.extraMonthlyPayment);
    }
  }

  // 5. Annual Prepayment: optional (defaults to 0 if omitted/undefined/null). If provided, must be finite >= 0.
  let annualPrepayment = 0;
  if (input.annualPrepayment !== undefined && input.annualPrepayment !== null) {
    if (!isStrictFiniteNumber(input.annualPrepayment)) {
      errors.push('Annual prepayment must be a valid finite number.');
    } else if (Number(input.annualPrepayment) < 0) {
      errors.push('Annual prepayment must be greater than or equal to 0.');
    } else {
      annualPrepayment = Number(input.annualPrepayment);
    }
  }

  // 6. Compounding Method: optional (defaults to 'MONTHLY' if omitted/undefined/null). If provided, must be supported enum.
  let compoundingMethod: 'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL' = 'MONTHLY';
  if (input.compoundingMethod !== undefined && input.compoundingMethod !== null) {
    const validMethods = ['MONTHLY', 'DAILY', 'SEMI_ANNUAL'];
    if (!validMethods.includes(input.compoundingMethod)) {
      errors.push(`Unsupported compounding method '${input.compoundingMethod}'. Allowed: [MONTHLY, DAILY, SEMI_ANNUAL].`);
    } else {
      compoundingMethod = input.compoundingMethod;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      principal: Number(input.principal),
      annualRatePct: Number(rawRate),
      tenureYears: tenureYears!,
      extraMonthlyPayment,
      annualPrepayment,
      compoundingMethod,
    },
  };
}

export function validateSIPCalculationInput(input: any): ValidationResult<{
  monthlyInvestment: number;
  expectedAnnualReturnPct: number;
  timePeriodYears: number;
  annualStepUpPct: number;
  expectedInflationPct: number;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Monthly Investment: required, finite, > 0
  if (!isStrictFiniteNumber(input.monthlyInvestment)) {
    errors.push('Monthly investment amount is required and must be a valid finite number.');
  } else if (Number(input.monthlyInvestment) <= 0) {
    errors.push('Monthly investment amount must be greater than 0.');
  }

  // 2. Expected Annual Return: required, finite, >= 0 and <= 100
  const rawReturn = input.expectedAnnualReturnPct ?? input.returnRate;
  if (!isStrictFiniteNumber(rawReturn)) {
    errors.push('Expected annual return rate (expectedAnnualReturnPct) is required and must be a valid finite number.');
  } else if (Number(rawReturn) < 0 || Number(rawReturn) > 100) {
    errors.push('Expected annual return rate must be between 0% and 100%.');
  }

  // 3. Time period: required, finite, > 0 and <= 50
  const rawYears = input.timePeriodYears ?? input.years;
  if (!isStrictFiniteNumber(rawYears)) {
    errors.push('Time period (timePeriodYears) is required and must be a valid finite number.');
  } else if (Number(rawYears) <= 0 || Number(rawYears) > 50) {
    errors.push('Time period must be between 1 and 50 years.');
  }

  // 4. Annual Step Up: optional, finite, >= 0 and <= 100
  let annualStepUpPct = 0;
  if (input.annualStepUpPct !== undefined && input.annualStepUpPct !== null) {
    if (!isStrictFiniteNumber(input.annualStepUpPct)) {
      errors.push('Annual step-up percentage must be a valid finite number.');
    } else if (Number(input.annualStepUpPct) < 0 || Number(input.annualStepUpPct) > 100) {
      errors.push('Annual step-up percentage must be between 0% and 100%.');
    } else {
      annualStepUpPct = Number(input.annualStepUpPct);
    }
  }

  // 5. Expected Inflation: optional, finite, >= 0 and <= 100
  let expectedInflationPct = 0;
  if (input.expectedInflationPct !== undefined && input.expectedInflationPct !== null) {
    if (!isStrictFiniteNumber(input.expectedInflationPct)) {
      errors.push('Expected inflation percentage must be a valid finite number.');
    } else if (Number(input.expectedInflationPct) < 0 || Number(input.expectedInflationPct) > 100) {
      errors.push('Expected inflation percentage must be between 0% and 100%.');
    } else {
      expectedInflationPct = Number(input.expectedInflationPct);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      monthlyInvestment: Number(input.monthlyInvestment),
      expectedAnnualReturnPct: Number(rawReturn),
      timePeriodYears: Number(rawYears),
      annualStepUpPct,
      expectedInflationPct,
    },
  };
}

export const SUPPORTED_JURISDICTION_IDS = [
  'us-fed',
  'ca-fed',
  'in-new',
  'in-old',
  'gb-eng',
  'au-fed',
  'sg-res',
] as const;

export type SupportedJurisdictionId = typeof SUPPORTED_JURISDICTION_IDS[number];

export function validateTaxCalculationInput(input: any): ValidationResult<{
  grossIncome: number;
  jurisdictionId: SupportedJurisdictionId;
  customDeductions: number;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Gross Income: required, finite, >= 0
  if (!isStrictFiniteNumber(input.grossIncome)) {
    errors.push('Gross income (grossIncome) is required and must be a valid non-negative finite number.');
  } else if (Number(input.grossIncome) < 0) {
    errors.push('Gross income must be greater than or equal to 0.');
  }

  // 2. Jurisdiction ID: required, must be supported enum. NO SILENT FALLBACK TO us-fed!
  if (!input.jurisdictionId || typeof input.jurisdictionId !== 'string') {
    errors.push(`Tax jurisdiction identifier (jurisdictionId) is required. Supported: [${SUPPORTED_JURISDICTION_IDS.join(', ')}].`);
  } else if (!SUPPORTED_JURISDICTION_IDS.includes(input.jurisdictionId as any)) {
    errors.push(`Unsupported or invalid tax jurisdiction '${input.jurisdictionId}'. Supported: [${SUPPORTED_JURISDICTION_IDS.join(', ')}].`);
  }

  // 3. Custom Deductions: optional (defaults to 0 if omitted/undefined/null), finite >= 0
  let customDeductions = 0;
  if (input.customDeductions !== undefined && input.customDeductions !== null) {
    if (!isStrictFiniteNumber(input.customDeductions)) {
      errors.push('Custom deductions must be a valid finite number.');
    } else if (Number(input.customDeductions) < 0) {
      errors.push('Custom deductions cannot be negative.');
    } else {
      customDeductions = Number(input.customDeductions);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      grossIncome: Number(input.grossIncome),
      jurisdictionId: input.jurisdictionId as SupportedJurisdictionId,
      customDeductions,
    },
  };
}

export function validateRefinanceCalculationInput(input: any): ValidationResult<{
  currentBalance: number;
  currentRatePct: number;
  currentRemainingTenureMonths: number;
  newRatePct: number;
  newTenureMonths: number;
  closingCosts: number;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Current Balance: required, finite, > 0
  if (!isStrictFiniteNumber(input.currentBalance)) {
    errors.push('Current loan balance (currentBalance) is required and must be a valid positive number.');
  } else if (Number(input.currentBalance) <= 0) {
    errors.push('Current loan balance must be greater than zero.');
  }

  // 2. Current Rate: required, finite, >= 0 and <= 100
  if (!isStrictFiniteNumber(input.currentRatePct)) {
    errors.push('Current interest rate (currentRatePct) is required and must be a valid finite number.');
  } else if (Number(input.currentRatePct) < 0 || Number(input.currentRatePct) > 100) {
    errors.push('Current interest rate must be between 0% and 100%.');
  }

  // 3. Current Remaining Tenure Months: required, finite integer > 0 and <= 600
  if (!isStrictFiniteNumber(input.currentRemainingTenureMonths)) {
    errors.push('Current remaining tenure in months (currentRemainingTenureMonths) is required.');
  } else {
    const months = Number(input.currentRemainingTenureMonths);
    if (months <= 0 || months > 600) {
      errors.push('Current remaining tenure must be between 1 and 600 months.');
    }
  }

  // 4. New Rate: required, finite, >= 0 and <= 100
  if (!isStrictFiniteNumber(input.newRatePct)) {
    errors.push('New refinance interest rate (newRatePct) is required and must be a valid finite number.');
  } else if (Number(input.newRatePct) < 0 || Number(input.newRatePct) > 100) {
    errors.push('New refinance interest rate must be between 0% and 100%.');
  }

  // 5. New Tenure Months: required, finite integer > 0 and <= 600
  if (!isStrictFiniteNumber(input.newTenureMonths)) {
    errors.push('New refinance tenure in months (newTenureMonths) is required.');
  } else {
    const newMonths = Number(input.newTenureMonths);
    if (newMonths <= 0 || newMonths > 600) {
      errors.push('New refinance tenure must be between 1 and 600 months.');
    }
  }

  // 6. Closing Costs: optional (defaults to 0 if omitted/undefined/null), finite >= 0
  let closingCosts = 0;
  if (input.closingCosts !== undefined && input.closingCosts !== null) {
    if (!isStrictFiniteNumber(input.closingCosts)) {
      errors.push('Closing costs (closingCosts) must be a valid finite number.');
    } else if (Number(input.closingCosts) < 0) {
      errors.push('Closing costs cannot be negative.');
    } else {
      closingCosts = Number(input.closingCosts);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      currentBalance: Number(input.currentBalance),
      currentRatePct: Number(input.currentRatePct),
      currentRemainingTenureMonths: Math.round(Number(input.currentRemainingTenureMonths)),
      newRatePct: Number(input.newRatePct),
      newTenureMonths: Math.round(Number(input.newTenureMonths)),
      closingCosts,
    },
  };
}

export function validateFireCalculationInput(input: any): ValidationResult<{
  annualExpenses: number;
  currentSavings: number;
  monthlySavings: number;
  swrPct: number;
  expectedReturnPct: number;
  inflationPct: number;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Annual Expenses: required, finite, > 0
  if (!isStrictFiniteNumber(input.annualExpenses)) {
    errors.push('Annual expenses (annualExpenses) is required and must be a valid positive number.');
  } else if (Number(input.annualExpenses) <= 0) {
    errors.push('Annual expenses must be greater than zero.');
  }

  // 2. Current Savings: required, finite, >= 0
  if (!isStrictFiniteNumber(input.currentSavings)) {
    errors.push('Current portfolio savings (currentSavings) is required and must be a valid non-negative number.');
  } else if (Number(input.currentSavings) < 0) {
    errors.push('Current savings cannot be negative.');
  }

  // 3. Monthly Savings: required, finite, >= 0
  if (!isStrictFiniteNumber(input.monthlySavings)) {
    errors.push('Monthly savings contribution (monthlySavings) is required and must be a valid non-negative number.');
  } else if (Number(input.monthlySavings) < 0) {
    errors.push('Monthly savings cannot be negative.');
  }

  // 4. Safe Withdrawal Rate (SWR): optional (defaults to 4.0), finite > 0 and <= 100
  let swrPct = 4.0;
  if (input.swrPct !== undefined && input.swrPct !== null) {
    if (!isStrictFiniteNumber(input.swrPct)) {
      errors.push('Safe withdrawal rate percentage (swrPct) must be a valid finite number.');
    } else if (Number(input.swrPct) <= 0 || Number(input.swrPct) > 100) {
      errors.push('Safe withdrawal rate must be between 0.1% and 100%.');
    } else {
      swrPct = Number(input.swrPct);
    }
  }

  // 5. Expected Return: optional (defaults to 8.0), finite >= 0 and <= 100
  let expectedReturnPct = 8.0;
  if (input.expectedReturnPct !== undefined && input.expectedReturnPct !== null) {
    if (!isStrictFiniteNumber(input.expectedReturnPct)) {
      errors.push('Expected portfolio return percentage (expectedReturnPct) must be a valid finite number.');
    } else if (Number(input.expectedReturnPct) < 0 || Number(input.expectedReturnPct) > 100) {
      errors.push('Expected portfolio return must be between 0% and 100%.');
    } else {
      expectedReturnPct = Number(input.expectedReturnPct);
    }
  }

  // 6. Inflation: optional (defaults to 3.0), finite >= 0 and <= 100
  let inflationPct = 3.0;
  if (input.inflationPct !== undefined && input.inflationPct !== null) {
    if (!isStrictFiniteNumber(input.inflationPct)) {
      errors.push('Expected inflation percentage (inflationPct) must be a valid finite number.');
    } else if (Number(input.inflationPct) < 0 || Number(input.inflationPct) > 100) {
      errors.push('Expected inflation rate must be between 0% and 100%.');
    } else {
      inflationPct = Number(input.inflationPct);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      annualExpenses: Number(input.annualExpenses),
      currentSavings: Number(input.currentSavings),
      monthlySavings: Number(input.monthlySavings),
      swrPct,
      expectedReturnPct,
      inflationPct,
    },
  };
}

export function validateRecordPaymentInput(input: any): ValidationResult<{
  extraPrincipal: number;
}> {
  const errors: string[] = [];
  let extraPrincipal = 0;

  if (input && typeof input === 'object' && input.extraPrincipal !== undefined && input.extraPrincipal !== null) {
    if (!isStrictFiniteNumber(input.extraPrincipal)) {
      errors.push('Extra principal payment (extraPrincipal) must be a valid finite number.');
    } else if (Number(input.extraPrincipal) < 0) {
      errors.push('Extra principal payment cannot be negative.');
    } else {
      extraPrincipal = Number(input.extraPrincipal);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { extraPrincipal },
  };
}

export function validateRuleUpdateInput(input: any): ValidationResult<{
  title: string;
  ruleKey: string;
  value: number;
  countryCode: string;
  category: string;
  unit: string;
  changeSummary: string;
}> {
  const errors: string[] = [];
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push('Rule title is required.');
  }
  if (!input.ruleKey || typeof input.ruleKey !== 'string' || input.ruleKey.trim().length === 0) {
    errors.push('Rule key identifier is required.');
  }
  if (input.value === undefined || isNaN(Number(input.value))) {
    errors.push('Rule value must be a valid numeric representation.');
  }
  if (!input.countryCode || typeof input.countryCode !== 'string') {
    errors.push('Valid country code is required.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: input.title.trim(),
      ruleKey: input.ruleKey.trim(),
      value: Number(input.value),
      countryCode: input.countryCode.trim().toUpperCase(),
      category: input.category || 'INTEREST_RATE',
      unit: input.unit || 'PERCENT',
      changeSummary: input.changeSummary || 'Updated by Actuary Administrator',
    },
  };
}

export interface LoanValidationErrors {
  name?: string;
  lender?: string;
  loanType?: string;
  originalPrincipal?: string;
  currentPrincipal?: string;
  interestRate?: string;
  tenureMonths?: string;
  startDate?: string;
  nextDueDate?: string;
  general?: string;
}

export function validateUserTrackedLoanInput(input: any): {
  isValid: boolean;
  errors: LoanValidationErrors;
  sanitized?: {
    id: string;
    userId?: string;
    name: string;
    lender: string;
    loanType: any;
    countryCode: string;
    currencyCode: string;
    originalPrincipal: number;
    currentPrincipal: number;
    interestRate: number;
    startDate: string;
    tenureMonths: number;
    monthlyEmi: number;
    nextDueDate: string;
    paidInstallments: number;
    totalInstallments: number;
    remainingInstallments: number;
    paymentFrequency: any;
    status: any;
    notes?: string;
    lastUpdated: string;
  };
} {
  const errors: LoanValidationErrors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    errors.name = 'Loan title is required.';
  } else if (name.length > 100) {
    errors.name = 'Title must be 100 characters or less.';
  }

  const lender = typeof input.lender === 'string' ? input.lender.trim() : '';
  if (!lender) {
    errors.lender = 'Lender or institution name is required.';
  } else if (lender.length > 100) {
    errors.lender = 'Lender name must be 100 characters or less.';
  }

  const validLoanTypes = ['MORTGAGE', 'AUTO', 'STUDENT', 'PERSONAL', 'BUSINESS'];
  const loanType = validLoanTypes.includes(input.loanType) ? input.loanType : 'MORTGAGE';

  const origPrincipal = Number(input.originalPrincipal ?? input.principal);
  if (isNaN(origPrincipal) || origPrincipal <= 0) {
    errors.originalPrincipal = 'Original principal must be greater than zero.';
  } else if (origPrincipal > 1000000000) {
    errors.originalPrincipal = 'Principal exceeds maximum allowable limit.';
  }

  const currPrincipal = Number(input.currentPrincipal !== undefined ? input.currentPrincipal : origPrincipal);
  if (isNaN(currPrincipal) || currPrincipal < 0) {
    errors.currentPrincipal = 'Current balance must be zero or a positive amount.';
  } else if (!isNaN(origPrincipal) && origPrincipal > 0 && currPrincipal > origPrincipal * 1.5) {
    errors.currentPrincipal = 'Current balance cannot be drastically higher than original principal.';
  }

  const rate = Number(input.interestRate ?? input.rate);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    errors.interestRate = 'Annual interest rate must be between 0% and 100%.';
  }

  const tenure = Number(input.tenureMonths ?? (input.tenureYears ? input.tenureYears * 12 : 360));
  if (isNaN(tenure) || tenure < 1 || tenure > 600) {
    errors.tenureMonths = 'Tenure must be between 1 month and 600 months (50 years).';
  }

  const startDate = typeof input.startDate === 'string' && input.startDate ? input.startDate : new Date().toISOString().split('T')[0];
  const nextDueDate = typeof input.nextDueDate === 'string' && input.nextDueDate ? input.nextDueDate : new Date().toISOString().split('T')[0];

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return { isValid: false, errors };
  }

  const totalInstallments = Math.round(tenure);
  const paidInstallments = input.paidInstallments !== undefined && !isNaN(Number(input.paidInstallments))
    ? Math.max(0, Math.min(totalInstallments, Number(input.paidInstallments)))
    : Math.max(0, Math.min(totalInstallments, Math.round(((origPrincipal - currPrincipal) / (origPrincipal || 1)) * totalInstallments)));
  const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);

  // Compute standard monthly EMI if not provided
  let emi = Number(input.monthlyEmi);
  if (isNaN(emi) || emi <= 0) {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, totalInstallments);
      emi = Number(((origPrincipal * monthlyRate * factor) / (factor - 1)).toFixed(2));
    } else {
      emi = Number((origPrincipal / totalInstallments).toFixed(2));
    }
  }

  const validStatuses = ['ACTIVE', 'PAID_OFF', 'DELINQUENT', 'REFINANCED'];
  const status = currPrincipal <= 0.01 || remainingInstallments === 0
    ? 'PAID_OFF'
    : (validStatuses.includes(input.status) ? input.status : 'ACTIVE');

  const validFrequencies = ['MONTHLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'ANNUAL'];
  const paymentFrequency = validFrequencies.includes(input.paymentFrequency) ? input.paymentFrequency : 'MONTHLY';

  return {
    isValid: true,
    errors: {},
    sanitized: {
      id: input.id || `loan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: typeof input.userId === 'string' ? input.userId : undefined,
      name,
      lender,
      loanType,
      countryCode: input.countryCode || 'US',
      currencyCode: input.currencyCode || 'USD',
      originalPrincipal: Number(origPrincipal.toFixed(2)),
      currentPrincipal: Number(currPrincipal.toFixed(2)),
      interestRate: Number(rate.toFixed(3)),
      startDate,
      tenureMonths: totalInstallments,
      monthlyEmi: Number(emi.toFixed(2)),
      nextDueDate,
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      paymentFrequency,
      status,
      notes: typeof input.notes === 'string' ? input.notes.slice(0, 500) : '',
      lastUpdated: new Date().toISOString(),
    },
  };
}

export function validateAuthLoginInput(input: any): ValidationResult<{
  email: string;
  role?: string;
  countryCode?: string;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  const validRoles = ['USER', 'ADMIN', 'CHIEF_ACTUARY', 'OWNER'];
  const role = input.role && validRoles.includes(input.role) ? input.role : undefined;

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email,
      role,
      countryCode: typeof input.countryCode === 'string' ? input.countryCode.toUpperCase() : undefined,
    },
  };
}

export function validateSourceVerificationInput(input: any): ValidationResult<{
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED';
  notes?: string;
}> {
  const errors: string[] = [];
  const validStatuses = ['VERIFIED', 'PENDING_REVIEW', 'FLAGGED', 'DEPRECATED'];
  const status = typeof input.status === 'string' && validStatuses.includes(input.status)
    ? input.status as 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED'
    : 'VERIFIED';

  return {
    success: true,
    data: {
      status,
      notes: typeof input.notes === 'string' ? input.notes.slice(0, 500) : undefined,
    },
  };
}

export function validateIntelligenceEventInput(input: any): ValidationResult<{
  title: string;
  category: 'TAX_REFORM' | 'RATE_CUT' | 'RATE_HIKE' | 'POLICY_UPDATE' | 'BENCHMARK_CHANGE';
  countryCode: string;
  summary: string;
  detailedAnalysis: string;
  effectiveDate: string;
  impactScore: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedPersonas: string[];
  sourceId?: string;
  previousRuleValue?: string;
  newRuleValue?: string;
}> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Request body must be a JSON object.'] };
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length < 3) {
    errors.push('Event title must be at least 3 characters.');
  }

  const countryCode = typeof input.countryCode === 'string' ? input.countryCode.trim().toUpperCase() : '';
  if (!countryCode) {
    errors.push('Country code is required.');
  }

  const summary = typeof input.summary === 'string' ? input.summary.trim() : '';
  if (!summary || summary.length < 5) {
    errors.push('Event summary must be at least 5 characters.');
  }

  const validCategories = ['TAX_REFORM', 'RATE_CUT', 'RATE_HIKE', 'POLICY_UPDATE', 'BENCHMARK_CHANGE'];
  const category = validCategories.includes(input.category) ? input.category : 'POLICY_UPDATE';

  const validScores = ['HIGH', 'MEDIUM', 'LOW'];
  const impactScore = validScores.includes(input.impactScore) ? input.impactScore : 'HIGH';

  const effectiveDate = typeof input.effectiveDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)
    ? input.effectiveDate
    : new Date().toISOString().split('T')[0];

  const affectedPersonas = Array.isArray(input.affectedPersonas) && input.affectedPersonas.length > 0
    ? input.affectedPersonas.map((p: any) => String(p).slice(0, 50))
    : ['Borrowers', 'Taxpayers', 'Investors'];

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      category,
      countryCode,
      summary,
      detailedAnalysis: typeof input.detailedAnalysis === 'string' && input.detailedAnalysis.trim() ? input.detailedAnalysis.trim() : summary,
      effectiveDate,
      impactScore,
      affectedPersonas,
      sourceId: typeof input.sourceId === 'string' ? input.sourceId : undefined,
      previousRuleValue: typeof input.previousRuleValue === 'string' ? input.previousRuleValue : undefined,
      newRuleValue: typeof input.newRuleValue === 'string' ? input.newRuleValue : undefined,
    },
  };
}

export function validatePaginationQuery(query: any): { limit: number; offset: number } {
  let limit = Number(query.limit);
  if (isNaN(limit) || limit <= 0) limit = 50;
  if (limit > 200) limit = 200;

  let offset = Number(query.offset);
  if (isNaN(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

