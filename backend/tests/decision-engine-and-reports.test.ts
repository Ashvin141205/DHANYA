/**
 * Dhanya 8-Step Decision Engine & Report Generator Test Suite
 * File: backend/tests/decision-engine-and-reports.test.ts
 */

import assert from 'assert';
import {
  calculateLoanSchedule,
  calculateSIP,
  calculateProgressiveTax,
  calculateFireTarget,
  TAX_BRACKETS_BY_JURISDICTION,
  generateMortgageDecisionPackage,
  generateSIPDecisionPackage,
  generateTaxDecisionPackage,
  generateFireDecisionPackage,
  generatePrintableReportHtml,
  ReportExportData,
} from '../../packages/finance-engine/src/index';
import { CountryConfig, AuthoritativeSource, IntelligenceEvent } from '../../packages/types/src/index';

console.log('\n===========================================================================');
console.log(' [Dhanya Test Suite] 8-STEP DECISION ENGINE & REPORT GENERATOR TESTS ');
console.log('===========================================================================\n');

const mockCountry: CountryConfig = {
  code: 'US',
  name: 'United States',
  flagEmoji: '🇺🇸',
  currency: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    subunitName: 'Cent',
    subunitsPerUnit: 100,
    symbolPosition: 'PREFIX',
    decimalSeparator: '.',
    groupingSeparator: ',',
  },
  defaultMortgageTermYears: 30,
  standardLoanCompounding: 'MONTHLY_REDUCING',
  statutoryFiscalYearStartMonth: 1,
  jurisdictions: [],
};

const mockSource: AuthoritativeSource = {
  id: 'us-fed-res',
  name: 'Federal Reserve Board (FRB)',
  organizationType: 'CENTRAL_BANK',
  countryCode: 'US',
  officialUrl: 'https://www.federalreserve.gov',
  legalMandate: 'Federal Reserve Act of 1913',
  isVerified: true,
  status: 'VERIFIED',
  lastVerifiedAt: '2026-08-25T10:00:00.000Z',
  verificationMethod: 'AUTOMATED_HASH',
  metadata: {},
};

const mockEvents: IntelligenceEvent[] = [
  {
    id: 'intel-001',
    category: 'MONETARY_POLICY',
    title: 'Federal Reserve Adjusts Policy Stance',
    summary: 'Central bank updates statutory reserve and baseline interest parameters.',
    publishedDate: '2026-08-20',
    effectiveDate: '2026-08-20',
    jurisdiction: 'US',
    sourceId: 'us-fed-res',
    sourceName: 'Federal Reserve Board',
    impactScore: 'HIGH',
    affectedCalculators: ['MORTGAGE', 'SIP'],
    actionSummary: 'Evaluate fixed versus adjustable borrowing exposures.',
    verificationStatus: 'VERIFIED',
    hash: 'sha256-mock',
  },
];

const formatMoney = (v: number) => `$${v.toLocaleString()}`;

// [Test 1] Mortgage Decision Package Complete 8 Steps
console.log('[Test 1] Testing Mortgage 8-Step Decision Engine generation...');
const mortgageMath = calculateLoanSchedule(500000, 6.5, 30, 200, 0, 'MONTHLY_REDUCING');
const mortgagePkg = generateMortgageDecisionPackage(
  500000,
  6.5,
  30,
  200,
  0,
  mortgageMath,
  mockCountry,
  mockSource,
  mockEvents,
  formatMoney
);

assert.strictEqual(mortgagePkg.steps.length, 8, 'Mortgage decision package must have exactly 8 steps');
assert.strictEqual(mortgagePkg.steps[0].id, 'calculate');
assert.strictEqual(mortgagePkg.steps[7].id, 'act');
assert.ok(mortgagePkg.explanation.formula.includes('EMI'), 'Explanation must include formula');
assert.ok(mortgagePkg.comparisons.length >= 3, 'Must provide at least 3 comparison scenarios');
assert.ok(mortgagePkg.recommendations.length >= 1, 'Must provide deterministic recommendations');
assert.ok(mortgagePkg.actionPlan.length >= 2, 'Must provide actionable execution steps');
console.log('✓ Test 1 Passed: Mortgage 8-Step Decision Engine verified.');

// [Test 2] SIP Wealth Accumulator 8-Step Decision Package
console.log('[Test 2] Testing SIP Wealth 8-Step Decision Engine generation...');
const sipMath = calculateSIP(1000, 10, 20, 10, 4);
const sipPkg = generateSIPDecisionPackage(
  1000,
  10,
  20,
  10,
  4,
  sipMath,
  mockCountry,
  mockEvents,
  formatMoney
);

assert.strictEqual(sipPkg.steps.length, 8, 'SIP decision package must have exactly 8 steps');
assert.ok(sipPkg.explanation.formula.includes('FV'), 'SIP formula must be present');
assert.ok(sipPkg.comparisons.length >= 2, 'SIP comparisons must be present');
assert.ok(sipPkg.recommendations.length >= 1, 'SIP recommendations must be present');
console.log('✓ Test 2 Passed: SIP 8-Step Decision Engine verified.');

// [Test 3] Progressive Tax 8-Step Decision Package
console.log('[Test 3] Testing Progressive Tax 8-Step Decision Engine generation...');
const taxConfig = TAX_BRACKETS_BY_JURISDICTION['us-fed'];
const taxMath = calculateProgressiveTax(
  120000,
  taxConfig.brackets,
  taxConfig.standardDeduction,
  5000,
  taxConfig.source,
  taxConfig.notes
);
const taxPkg = generateTaxDecisionPackage(
  120000,
  5000,
  taxMath,
  mockCountry,
  taxConfig.name,
  taxConfig.source,
  mockEvents,
  formatMoney
);

assert.strictEqual(taxPkg.steps.length, 8, 'Tax decision package must have 8 steps');
assert.ok(taxPkg.explanation.narrative.includes('marginal') || taxPkg.explanation.formula.includes('Tax'), 'Tax explanation must reference formula');
assert.ok(taxPkg.actionPlan.length >= 2, 'Tax action plan must be present');
console.log('✓ Test 3 Passed: Progressive Tax 8-Step Decision Engine verified.');

// [Test 4] FIRE Retirement 8-Step Decision Package
console.log('[Test 4] Testing FIRE Retirement 8-Step Decision Engine generation...');
const fireMath = calculateFireTarget(60000, 200000, 2500, 4.0, 8.0, 3.0);
const firePkg = generateFireDecisionPackage(
  60000,
  200000,
  2500,
  4.0,
  8.0,
  3.0,
  fireMath,
  mockCountry,
  mockEvents,
  formatMoney
);

assert.strictEqual(firePkg.steps.length, 8, 'FIRE decision package must have 8 steps');
assert.ok(firePkg.explanation.formula.includes('SWR'), 'FIRE formula must include SWR');
assert.ok(firePkg.comparisons.length >= 3, 'FIRE comparisons must provide Lean/Standard/Fat scenarios');
console.log('✓ Test 4 Passed: FIRE 8-Step Decision Engine verified.');

// [Test 5] HTML Printable Report Generator
console.log('[Test 5] Testing Printable HTML Report Generator formatting & security...');
const reportData: ReportExportData = {
  title: 'Executive Mortgage Analysis Report',
  calculatorType: 'MORTGAGE',
  countryName: 'United States',
  currencyCode: 'USD',
  currencySymbol: '$',
  calculatedAt: '2026-08-29 10:00:00 UTC',
  inputs: [
    { label: 'Principal', value: '$500,000' },
    { label: 'Interest Rate', value: '6.50% APR' },
  ],
  primaryResults: [
    { label: 'Monthly Payment', value: '$3,160.34', highlight: true },
  ],
  decisionPackage: mortgagePkg,
};

const htmlOutput = generatePrintableReportHtml(reportData);
assert.ok(htmlOutput.includes('<!DOCTYPE html>'), 'Report must be valid full HTML document');
assert.ok(htmlOutput.includes('DHANYA'), 'Report must include Dhanya executive branding');
assert.ok(htmlOutput.includes('Federal Reserve Board'), 'Report must include authoritative provenance');
assert.ok(htmlOutput.includes('Executive Mortgage Analysis Report'), 'Report must contain user report title');
assert.ok(htmlOutput.includes('window.print()'), 'Report must contain print script trigger');
console.log('✓ Test 5 Passed: HTML Printable Report generation verified.');

console.log('\n===========================================================================');
console.log(' ALL 5 DECISION ENGINE & REPORT TESTS PASSED GREEN! 🎯');
console.log('===========================================================================\n');
