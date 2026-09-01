/**
 * Dhanya Global Financial Intelligence Platform
 * Package: @dhanya/types
 * Core domain types and interfaces shared across Web, Admin, Backend, and Finance Engine.
 */

export type CountryCode = 'US' | 'CA' | 'IN' | 'GB' | 'AU' | 'SG' | 'DE' | 'AE';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface CountryInfo {
  code: CountryCode;
  name: string;
  currency: CurrencyInfo;
  flag: string;
  centralBank: string;
  taxAuthority: string;
  defaultMortgageTermYears: number;
  standardLoanCompounding: 'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL';
  jurisdictions: Jurisdiction[];
}

export interface Jurisdiction {
  id: string;
  countryCode: CountryCode;
  name: string;
  type: 'FEDERAL' | 'STATE' | 'PROVINCE' | 'UNION_TERRITORY';
  taxYear: string;
}

export type SourceVerificationStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED';

export interface SourceProvenance {
  id: string;
  name: string;
  organization: string;
  organizationType: 'CENTRAL_BANK' | 'TAX_AUTHORITY' | 'REGULATOR' | 'GOVERNMENT_GAZETTE' | 'FINANCIAL_INSTITUTION';
  officialUrl: string;
  lastVerifiedAt: string;
  verifiedBy: string;
  verificationStatus: SourceVerificationStatus;
  notes?: string;
}

export type RuleCategory = 'TAX' | 'INTEREST_RATE' | 'LENDING' | 'INVESTMENT' | 'RETIREMENT' | 'INFLATION';
export type RuleUnit = 'PERCENT' | 'CURRENCY' | 'RATIO' | 'STRUCTURED';

export interface VersionedFinancialRule {
  id: string;
  ruleKey: string;
  title: string;
  category: RuleCategory;
  countryCode: CountryCode;
  jurisdictionId?: string;
  value: any;
  previousValue?: any;
  unit: RuleUnit;
  validFrom: string; // ISO date YYYY-MM-DD
  validUntil?: string; // ISO date or undefined if current
  source: SourceProvenance;
  version: number;
  changeSummary?: string;
  methodologyNotes?: string;
  createdAt: string;
}

export type WhatChangedCategory = 'TAX_REFORM' | 'RATE_CUT' | 'RATE_HIKE' | 'POLICY_UPDATE' | 'BENCHMARK_CHANGE';
export type ImpactScore = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WhatChangedEvent {
  id: string;
  title: string;
  category: WhatChangedCategory;
  countryCode: CountryCode;
  jurisdictionName?: string;
  effectiveDate: string;
  publishedDate: string;
  summary: string;
  detailedAnalysis: string;
  impactScore: ImpactScore;
  affectedPersonas: string[];
  source: SourceProvenance;
  previousRuleValue?: string;
  newRuleValue?: string;
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  extraPayment: number;
  remainingBalance: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

export interface AnnualAmortizationSummary {
  year: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface PrepaymentSavingsSummary {
  interestSaved: number;
  monthsSaved: number;
  originalTotalInterest: number;
  originalPayoffMonths: number;
}

export interface LoanAmortizationResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  effectiveInterestRate: number;
  payoffMonths: number;
  payoffDate: string;
  schedule: AmortizationRow[];
  annualSchedule: AnnualAmortizationSummary[];
  prepaymentSavings?: PrepaymentSavingsSummary;
}

export type LoanType = 'MORTGAGE' | 'AUTO' | 'STUDENT' | 'PERSONAL' | 'BUSINESS';
export type LoanStatus = 'ACTIVE' | 'PAID_OFF' | 'DELINQUENT' | 'REFINANCED';
export type PaymentFrequency = 'MONTHLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'ANNUAL';

export interface UserTrackedLoan {
  id: string;
  userId?: string;
  name: string;
  lender: string;
  loanType: LoanType;
  countryCode: CountryCode;
  currencyCode: string;
  originalPrincipal: number;
  currentPrincipal: number;
  interestRate: number; // percentage
  startDate: string;
  tenureMonths: number;
  monthlyEmi: number;
  nextDueDate: string;
  totalInstallments?: number;
  paidInstallments?: number;
  remainingInstallments?: number;
  paymentFrequency?: PaymentFrequency;
  status?: LoanStatus;
  notes?: string;
  lastUpdated: string;
}

export interface TaxBracket {
  min: number;
  max: number | null; // null for highest bracket
  rate: number; // percentage, e.g. 10 for 10%
}

export interface TaxBracketBreakdown {
  bracket: string;
  rate: number;
  taxableInThisBracket: number;
  taxForThisBracket: number;
}

export interface TaxCalculationResult {
  grossIncome: number;
  taxableIncome: number;
  totalTax: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
  takeHomePay: number;
  monthlyTakeHome: number;
  bracketBreakdown: TaxBracketBreakdown[];
  deductionsApplied: number;
  notes: string[];
  source: SourceProvenance;
}

export interface SIPYearlyBreakdown {
  year: number;
  investedCapital: number;
  wealthGained: number;
  totalValue: number;
}

export interface SIPCalculationResult {
  totalInvested: number;
  estimatedReturns: number;
  totalMaturityValue: number;
  inflationAdjustedValue: number;
  growthMultiplier: number;
  yearlyBreakdown: SIPYearlyBreakdown[];
  comparisonLumpSum?: {
    lumpSumTotal: number;
    difference: number;
    betterOption: 'SIP' | 'LUMP_SUM';
  };
}

export interface RefinanceBreakevenResult {
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySavings: number;
  closingCosts: number;
  breakevenMonths: number;
  lifetimeInterestSavings: number;
  netFinancialGain: number;
  isBeneficial: boolean;
}

export interface FireCalculationResult {
  targetNestEgg: number;
  leanFireTarget: number;
  fatFireTarget: number;
  yearsToFreedom: number;
  projectedFreedomYear: number;
  savingsRatePct: number;
  yearlyExpenses: number;
  swrPct: number;
  yearlyBreakdown: {
    year: number;
    portfolioValue: number;
    contributions: number;
    investmentGrowth: number;
  }[];
}

export type UserRole = 'USER' | 'ADMIN' | 'CHIEF_ACTUARY' | 'OWNER';
export type AdminRole = 'OWNER' | 'ADMIN' | 'CHIEF_ACTUARY';
export type AuditAction =
  | 'CREATE_RULE'
  | 'UPDATE_RULE'
  | 'DELETE_RULE'
  | 'VERIFY_SOURCE'
  | 'PUBLISH_INTELLIGENCE'
  | 'CHANGE_STATUS'
  | 'CREATE_LOAN'
  | 'UPDATE_LOAN'
  | 'DELETE_LOAN'
  | 'RECORD_PAYMENT'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'AUTHORIZATION_DENIED'
  | 'DEV_AUTH_USAGE'
  | 'SYSTEM_INITIALIZE';

export type AdminAction = AuditAction;

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AuthUser {
  id: string;
  tenantId?: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  countryCode?: CountryCode;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AdminUserRecord extends AuthUser {
  status: UserStatus;
  tenantId: string;
}

export interface UpdateUserStatusInput {
  status: UserStatus;
  reason?: string;
}

export interface AuthTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  countryCode?: CountryCode;
  tenantId?: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorId?: string;
  actorRole: UserRole;
  action: AuditAction;
  targetEntity: string;
  details: string;
  previousState?: any;
  newState?: any;
  previousHash?: string;
  hash?: string;
  ipAddress?: string;
}

export interface ApiSuccessResponse<T = any> {
  status: 'success';
  data: T;
  count?: number;
  message?: string;
  engine?: string;
  calculatedAt?: string;
  [key: string]: any;
}

export interface ApiErrorResponse {
  status: 'error';
  code: string;
  error: string;
  details?: any;
  retryAfter?: number;
  timestamp?: string;
}

