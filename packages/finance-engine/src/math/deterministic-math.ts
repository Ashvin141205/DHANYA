/**
 * Dhanya Deterministic Financial Math Engine
 * Package: @dhanya/finance-engine
 * 
 * STRICT ZERO-HALLUCINATION POLICY:
 * Pure mathematical algorithms implementing standard actuarial, banking, and tax formulas.
 * Zero reliance on LLMs or non-deterministic estimations.
 */

import {
  LoanAmortizationResult,
  AmortizationRow,
  AnnualAmortizationSummary,
  TaxBracket,
  TaxCalculationResult,
  TaxBracketBreakdown,
  SIPCalculationResult,
  SIPYearlyBreakdown,
  RefinanceBreakevenResult,
  FireCalculationResult,
  SourceProvenance,
  UserTrackedLoan,
} from '@dhanya/types';

/**
 * Standard Equated Monthly Installment (EMI) Formula:
 * P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Number(emi.toFixed(2));
}

/**
 * Full Reducing Balance Amortization Schedule with Prepayment Acceleration
 */
export function calculateLoanSchedule(
  principal: number,
  annualRatePct: number,
  tenureYears: number,
  extraMonthlyPayment: number = 0,
  annualPrepayment: number = 0,
  compoundingMethod: 'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL' = 'MONTHLY'
): LoanAmortizationResult {
  const safePrincipal = Math.max(0, principal);
  const safeRatePct = Math.max(0, annualRatePct);
  const totalMonths = Math.max(1, Math.round(tenureYears * 12));
  
  // Calculate standard base EMI without prepayments
  const baseMonthlyEmi = calculateEmi(safePrincipal, safeRatePct, totalMonths);
  
  // Rate adjustment based on compounding frequency
  let effectiveMonthlyRate: number;
  if (compoundingMethod === 'SEMI_ANNUAL') {
    // Canadian standard: (1 + r/2)^(2/12) - 1
    const semiAnnualRate = safeRatePct / 2 / 100;
    effectiveMonthlyRate = Math.pow(1 + semiAnnualRate, 2 / 12) - 1;
  } else if (compoundingMethod === 'DAILY') {
    // UK standard: (1 + r/365)^(365/12) - 1
    const dailyRate = safeRatePct / 365 / 100;
    effectiveMonthlyRate = Math.pow(1 + dailyRate, 365 / 12) - 1;
  } else {
    // Standard US / IN monthly compounding: r / 12
    effectiveMonthlyRate = safeRatePct / 12 / 100;
  }

  const schedule: AmortizationRow[] = [];
  const annualMap: Map<number, { principalPaid: number; interestPaid: number; endingBalance: number }> = new Map();

  let remainingBalance = safePrincipal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let currentMonth = 1;
  const maxMonths = totalMonths + 120; // Safety cap

  while (remainingBalance > 0.01 && currentMonth <= maxMonths) {
    const interestForMonth = remainingBalance * effectiveMonthlyRate;
    
    // Apply extra annual prepayment on month 12, 24, 36...
    const isYearEnd = currentMonth % 12 === 0;
    const extraAnnual = isYearEnd ? Math.max(0, annualPrepayment) : 0;
    const extraTotal = Math.max(0, extraMonthlyPayment) + extraAnnual;

    let contractualPayment = Math.min(baseMonthlyEmi, remainingBalance + interestForMonth);
    let totalScheduledPayment = contractualPayment + extraTotal;
    
    // Cap total payment if balance is low
    if (totalScheduledPayment > remainingBalance + interestForMonth) {
      totalScheduledPayment = remainingBalance + interestForMonth;
    }

    const principalForMonth = Math.max(0, totalScheduledPayment - interestForMonth);
    remainingBalance = Math.max(0, remainingBalance - principalForMonth);

    totalInterestPaid += interestForMonth;
    totalPrincipalPaid += principalForMonth;

    const currentYear = Math.ceil(currentMonth / 12);

    schedule.push({
      month: currentMonth,
      year: currentYear,
      payment: Number(totalScheduledPayment.toFixed(2)),
      principalPaid: Number(principalForMonth.toFixed(2)),
      interestPaid: Number(interestForMonth.toFixed(2)),
      extraPayment: Number(extraTotal.toFixed(2)),
      remainingBalance: Number(remainingBalance.toFixed(2)),
      totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
      totalPrincipalPaid: Number(totalPrincipalPaid.toFixed(2)),
    });

    // Accumulate annual summary
    if (!annualMap.has(currentYear)) {
      annualMap.set(currentYear, { principalPaid: 0, interestPaid: 0, endingBalance: 0 });
    }
    const annualEntry = annualMap.get(currentYear)!;
    annualEntry.principalPaid += principalForMonth;
    annualEntry.interestPaid += interestForMonth;
    annualEntry.endingBalance = remainingBalance;

    currentMonth++;
  }

  const payoffMonths = schedule.length;
  const payoffYears = (payoffMonths / 12).toFixed(1);
  const payoffDate = calculateFutureDate(payoffMonths);

  const annualSchedule: AnnualAmortizationSummary[] = Array.from(annualMap.entries()).map(([year, data]) => ({
    year,
    principalPaid: Number(data.principalPaid.toFixed(2)),
    interestPaid: Number(data.interestPaid.toFixed(2)),
    endingBalance: Number(data.endingBalance.toFixed(2)),
  }));

  // Calculate baseline without prepayments for savings delta
  let prepaymentSavings: any = undefined;
  if (extraMonthlyPayment > 0 || annualPrepayment > 0) {
    const baseline = calculateLoanSchedule(safePrincipal, safeRatePct, tenureYears, 0, 0, compoundingMethod);
    const interestSaved = Math.max(0, baseline.totalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, baseline.payoffMonths - payoffMonths);

    prepaymentSavings = {
      interestSaved: Number(interestSaved.toFixed(2)),
      monthsSaved,
      originalTotalInterest: baseline.totalInterest,
      originalPayoffMonths: baseline.payoffMonths,
    };
  }

  return {
    monthlyEmi: baseMonthlyEmi,
    totalPayment: Number((totalPrincipalPaid + totalInterestPaid).toFixed(2)),
    totalInterest: Number(totalInterestPaid.toFixed(2)),
    totalPrincipal: Number(totalPrincipalPaid.toFixed(2)),
    effectiveInterestRate: safeRatePct,
    payoffMonths,
    payoffDate,
    schedule,
    annualSchedule,
    prepaymentSavings,
  };
}

/**
 * Systematic Investment Plan (SIP) with Annual Step-Up and Inflation Discounting
 */
export function calculateSIP(
  monthlyInvestment: number,
  expectedAnnualReturnPct: number,
  timePeriodYears: number,
  annualStepUpPct: number = 0,
  expectedInflationPct: number = 0
): SIPCalculationResult {
  const safeMonthly = Math.max(0, monthlyInvestment);
  const safeReturn = Math.max(0, expectedAnnualReturnPct);
  const safeYears = Math.max(1, timePeriodYears);
  const safeStepUp = Math.max(0, annualStepUpPct) / 100;
  const monthlyRate = safeReturn / 12 / 100;

  let currentMonthlyInvestment = safeMonthly;
  let totalInvested = 0;
  let totalMaturityValue = 0;
  const yearlyBreakdown: SIPYearlyBreakdown[] = [];

  for (let year = 1; year <= safeYears; year++) {
    for (let m = 1; m <= 12; m++) {
      totalInvested += currentMonthlyInvestment;
      totalMaturityValue = (totalMaturityValue + currentMonthlyInvestment) * (1 + monthlyRate);
    }

    yearlyBreakdown.push({
      year,
      investedCapital: Number(totalInvested.toFixed(2)),
      wealthGained: Number(Math.max(0, totalMaturityValue - totalInvested).toFixed(2)),
      totalValue: Number(totalMaturityValue.toFixed(2)),
    });

    // Apply annual step-up
    currentMonthlyInvestment = currentMonthlyInvestment * (1 + safeStepUp);
  }

  const estimatedReturns = Math.max(0, totalMaturityValue - totalInvested);
  const growthMultiplier = totalInvested > 0 ? Number((totalMaturityValue / totalInvested).toFixed(2)) : 0;

  // Inflation adjusted real purchasing power: V / (1 + i)^n
  const inflationDiscountFactor = Math.pow(1 + Math.max(0, expectedInflationPct) / 100, safeYears);
  const inflationAdjustedValue = Number((totalMaturityValue / inflationDiscountFactor).toFixed(2));

  // Comparison with equivalent one-time lump-sum invested on day 1
  const equivalentLumpSumInitial = totalInvested;
  const lumpSumGrowthFactor = Math.pow(1 + safeReturn / 100, safeYears);
  const lumpSumTotal = Number((equivalentLumpSumInitial * lumpSumGrowthFactor).toFixed(2));

  return {
    totalInvested: Number(totalInvested.toFixed(2)),
    estimatedReturns: Number(estimatedReturns.toFixed(2)),
    totalMaturityValue: Number(totalMaturityValue.toFixed(2)),
    inflationAdjustedValue,
    growthMultiplier,
    yearlyBreakdown,
    comparisonLumpSum: {
      lumpSumTotal,
      difference: Number(Math.abs(lumpSumTotal - totalMaturityValue).toFixed(2)),
      betterOption: lumpSumTotal > totalMaturityValue ? 'LUMP_SUM' : 'SIP',
    },
  };
}

/**
 * Multi-bracket Progressive Income Tax Calculation with Verified Brackets
 */
export function calculateProgressiveTax(
  grossIncome: number,
  brackets: TaxBracket[],
  standardDeduction: number = 0,
  otherDeductions: number = 0,
  source: SourceProvenance,
  notes: string[] = []
): TaxCalculationResult {
  const safeGross = Math.max(0, grossIncome);
  const totalDeductions = Math.max(0, standardDeduction) + Math.max(0, otherDeductions);
  const taxableIncome = Math.max(0, safeGross - totalDeductions);

  let remainingTaxable = taxableIncome;
  let totalTax = 0;
  let marginalTaxRate = 0;
  const bracketBreakdown: TaxBracketBreakdown[] = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const rate = bracket.rate;
    const min = bracket.min;
    const max = bracket.max;

    if (taxableIncome > min) {
      marginalTaxRate = rate;
      const bracketRange = max !== null ? max - min : Infinity;
      const taxableInThisBracket = Math.min(taxableIncome - min, bracketRange);
      const taxForThisBracket = taxableInThisBracket * (rate / 100);

      totalTax += taxForThisBracket;

      bracketBreakdown.push({
        bracket: max !== null ? `${min.toLocaleString()} – ${max.toLocaleString()}` : `Above ${min.toLocaleString()}`,
        rate,
        taxableInThisBracket: Number(taxableInThisBracket.toFixed(2)),
        taxForThisBracket: Number(taxForThisBracket.toFixed(2)),
      });
    } else {
      bracketBreakdown.push({
        bracket: max !== null ? `${min.toLocaleString()} – ${max.toLocaleString()}` : `Above ${min.toLocaleString()}`,
        rate,
        taxableInThisBracket: 0,
        taxForThisBracket: 0,
      });
    }
  }

  const effectiveTaxRate = safeGross > 0 ? Number(((totalTax / safeGross) * 100).toFixed(2)) : 0;
  const takeHomePay = Math.max(0, safeGross - totalTax);
  const monthlyTakeHome = Number((takeHomePay / 12).toFixed(2));

  return {
    grossIncome: safeGross,
    taxableIncome: Number(taxableIncome.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    effectiveTaxRate,
    marginalTaxRate,
    takeHomePay: Number(takeHomePay.toFixed(2)),
    monthlyTakeHome,
    bracketBreakdown,
    deductionsApplied: Number(totalDeductions.toFixed(2)),
    notes,
    source,
  };
}

/**
 * Refinance Breakeven and Lifetime Savings Calculation
 */
export function calculateRefinanceBreakeven(
  currentBalance: number,
  currentRatePct: number,
  currentRemainingTenureMonths: number,
  newRatePct: number,
  newTenureMonths: number,
  closingCosts: number
): RefinanceBreakevenResult {
  const currentEmi = calculateEmi(currentBalance, currentRatePct, currentRemainingTenureMonths);
  const newEmi = calculateEmi(currentBalance, newRatePct, newTenureMonths);
  const monthlySavings = currentEmi - newEmi;

  const currentTotalPayment = currentEmi * currentRemainingTenureMonths;
  const newTotalPayment = (newEmi * newTenureMonths) + closingCosts;
  const lifetimeInterestSavings = currentTotalPayment - newTotalPayment;

  const breakevenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : 0;
  const netFinancialGain = lifetimeInterestSavings;

  return {
    currentMonthlyPayment: currentEmi,
    newMonthlyPayment: newEmi,
    monthlySavings: Number(monthlySavings.toFixed(2)),
    closingCosts,
    breakevenMonths,
    lifetimeInterestSavings: Number(lifetimeInterestSavings.toFixed(2)),
    netFinancialGain: Number(netFinancialGain.toFixed(2)),
    isBeneficial: lifetimeInterestSavings > 0 && monthlySavings > 0,
  };
}

/**
 * FIRE (Financial Independence, Retire Early) Trinity Model Calculation
 */
export function calculateFireTarget(
  annualExpenses: number,
  currentSavings: number,
  monthlySavings: number,
  swrPct: number = 4.0,
  expectedReturnPct: number = 8.0,
  inflationPct: number = 3.0
): FireCalculationResult {
  const safeExpenses = Math.max(0, annualExpenses);
  const safeSwr = Math.max(0.1, swrPct) / 100;
  const targetNestEgg = Number((safeExpenses / safeSwr).toFixed(2));
  const leanFireTarget = Number((targetNestEgg * 0.75).toFixed(2));
  const fatFireTarget = Number((targetNestEgg * 1.5).toFixed(2));

  const realReturnRate = (Math.max(0, expectedReturnPct) - Math.max(0, inflationPct)) / 100;
  const monthlyRealRate = realReturnRate / 12;

  let portfolio = Math.max(0, currentSavings);
  let months = 0;
  const maxMonths = 1200; // 100 years cap
  const yearlyBreakdown: { year: number; portfolioValue: number; contributions: number; investmentGrowth: number }[] = [];

  let totalContributed = portfolio;

  while (portfolio < targetNestEgg && months < maxMonths) {
    portfolio = (portfolio + monthlySavings) * (1 + monthlyRealRate);
    totalContributed += monthlySavings;
    months++;

    if (months % 12 === 0) {
      const yearNum = months / 12;
      yearlyBreakdown.push({
        year: yearNum,
        portfolioValue: Number(portfolio.toFixed(2)),
        contributions: Number(totalContributed.toFixed(2)),
        investmentGrowth: Number(Math.max(0, portfolio - totalContributed).toFixed(2)),
      });
    }
  }

  const yearsToFreedom = Number((months / 12).toFixed(1));
  const currentYear = new Date().getFullYear();
  const projectedFreedomYear = Math.round(currentYear + (months / 12));

  const totalAnnualSavings = monthlySavings * 12;
  const totalAnnualIncome = safeExpenses + totalAnnualSavings;
  const savingsRatePct = totalAnnualIncome > 0 ? Number(((totalAnnualSavings / totalAnnualIncome) * 100).toFixed(1)) : 0;

  return {
    targetNestEgg,
    leanFireTarget,
    fatFireTarget,
    yearsToFreedom,
    projectedFreedomYear,
    savingsRatePct,
    yearlyExpenses: safeExpenses,
    swrPct,
    yearlyBreakdown,
  };
}

/**
 * Currency Formatter Utility with Locale Awareness
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US',
  maxDecimals: number = 0
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: maxDecimals,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
}

/**
 * Helper to calculate future calendar date from month offset
 */
export function calculateFutureDate(monthsOffset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsOffset);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

/**
 * Helper to advance an ISO YYYY-MM-DD date by exactly 1 month
 */
export function advanceDateByMonth(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }

      // Handle month end date overflow (e.g. Feb 30)
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const validDay = Math.min(day, lastDayOfMonth);

      const yyyy = String(year);
      const mm = String(month).padStart(2, '0');
      const dd = String(validDay).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {
    // fallback
  }
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Deterministic Installment Payment Record Logic
 * Calculates exact interest and principal portions according to standard reducing balance amortization.
 */
export function recordInstallmentPayment(loan: UserTrackedLoan): UserTrackedLoan {
  const currentBal = Math.max(0, loan.currentPrincipal);
  if (currentBal <= 0) {
    return {
      ...loan,
      status: 'PAID_OFF',
      remainingInstallments: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const monthlyRate = (loan.interestRate || 0) / 100 / 12;
  const interestForMonth = currentBal * monthlyRate;
  const emi = loan.monthlyEmi > 0 ? loan.monthlyEmi : calculateEmi(loan.originalPrincipal, loan.interestRate, loan.tenureMonths);

  // Contractual installment paid towards principal
  const principalPortion = Math.min(currentBal, Math.max(0, emi - interestForMonth));
  const newOutstanding = Math.max(0, Number((currentBal - principalPortion).toFixed(2)));

  const totalInstallments = loan.totalInstallments || loan.tenureMonths;
  const currentPaid = loan.paidInstallments !== undefined
    ? loan.paidInstallments
    : Math.round(((loan.originalPrincipal - loan.currentPrincipal) / (loan.originalPrincipal || 1)) * totalInstallments);
  
  const newPaidInstallments = currentPaid + 1;
  const newRemainingInstallments = Math.max(0, totalInstallments - newPaidInstallments);
  const isPaidOff = newOutstanding <= 0.01 || newRemainingInstallments === 0;

  return {
    ...loan,
    currentPrincipal: isPaidOff ? 0 : newOutstanding,
    paidInstallments: newPaidInstallments,
    remainingInstallments: newRemainingInstallments,
    totalInstallments,
    status: isPaidOff ? 'PAID_OFF' : (loan.status || 'ACTIVE'),
    nextDueDate: isPaidOff ? loan.nextDueDate : advanceDateByMonth(loan.nextDueDate || new Date().toISOString().split('T')[0]),
    lastUpdated: new Date().toISOString(),
  };
}

export interface PortfolioSummaryMetrics {
  totalOutstanding: number;
  totalOriginalPrincipal: number;
  totalMonthlyEmi: number;
  weightedAvgRate: number;
  activeLoanCount: number;
  paidOffLoanCount: number;
  totalLoanCount: number;
  portfolioRepaidPct: number;
  nextPaymentDue?: {
    date: string;
    amount: number;
    loanName: string;
    loanId: string;
    lender: string;
  };
}

/**
 * Calculates portfolio-wide loan aggregates and weighted debt statistics
 */
export function calculatePortfolioSummary(loans: UserTrackedLoan[]): PortfolioSummaryMetrics {
  let totalOutstanding = 0;
  let totalOriginalPrincipal = 0;
  let totalMonthlyEmi = 0;
  let weightedRateSum = 0;
  let activeLoanCount = 0;
  let paidOffLoanCount = 0;

  const activeLoansWithDueDates: { date: string; amount: number; loanName: string; loanId: string; lender: string }[] = [];

  loans.forEach((loan) => {
    const isPaid = loan.status === 'PAID_OFF' || loan.currentPrincipal <= 0.01;
    totalOriginalPrincipal += loan.originalPrincipal || 0;
    
    if (isPaid) {
      paidOffLoanCount++;
    } else {
      activeLoanCount++;
      totalOutstanding += loan.currentPrincipal || 0;
      totalMonthlyEmi += loan.monthlyEmi || 0;
      weightedRateSum += (loan.interestRate || 0) * (loan.currentPrincipal || 0);

      if (loan.nextDueDate) {
        activeLoansWithDueDates.push({
          date: loan.nextDueDate,
          amount: loan.monthlyEmi,
          loanName: loan.name,
          loanId: loan.id,
          lender: loan.lender,
        });
      }
    }
  });

  const weightedAvgRate = totalOutstanding > 0 ? Number((weightedRateSum / totalOutstanding).toFixed(2)) : 0;
  const totalPrincipalRepaid = Math.max(0, totalOriginalPrincipal - totalOutstanding);
  const portfolioRepaidPct = totalOriginalPrincipal > 0
    ? Number(((totalPrincipalRepaid / totalOriginalPrincipal) * 100).toFixed(1))
    : 0;

  // Sort upcoming due dates chronologically
  activeLoansWithDueDates.sort((a, b) => a.date.localeCompare(b.date));
  const nextPaymentDue = activeLoansWithDueDates.length > 0 ? activeLoansWithDueDates[0] : undefined;

  return {
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalOriginalPrincipal: Number(totalOriginalPrincipal.toFixed(2)),
    totalMonthlyEmi: Number(totalMonthlyEmi.toFixed(2)),
    weightedAvgRate,
    activeLoanCount,
    paidOffLoanCount,
    totalLoanCount: loans.length,
    portfolioRepaidPct,
    nextPaymentDue,
  };
}
