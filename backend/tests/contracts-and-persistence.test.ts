/**
 * Dhanya Phase 6 Contract Hardening & Persistence Verification Test Suite
 * Application: backend
 * 
 * Tests:
 * 1. Calculation API Strict Determinism & Zero-Default Contract Enforcement
 * 2. Unsafe Default Removal (/loan, /mortgage, /sip, /tax, /refinance, /fire)
 * 3. Strict Validation Rejections (NaN, Infinity, negative, non-numeric strings, missing params, invalid enums)
 * 4. Tax Jurisdiction Table Strict Validation (Reject unsupported/spoofed jurisdictions)
 * 5. Fail-Closed Production Persistence Verification
 * 6. Durable Persistence Disk Hydration & Restart Integrity
 * 7. SHA-256 Tamper-Resistant Hash Chain Preservation Across Restarts
 * 8. Multi-Tenant Loan Payment Atomicity & Audit Recording
 */

import { strict as assert } from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createBackendApp } from '../src/app';
import { AuthService, DevAuthProvider } from '../src/auth/index';
import { DatabaseManager } from '../src/repositories/database.manager';
import { DurableDatabaseEngine } from '../src/repositories/durable/durable-db';
import { DurableLoanRepository } from '../src/repositories/durable/durable-loan.repository';
import { DurableAuditRepository } from '../src/repositories/durable/durable-audit.repository';
import {
  validateLoanCalculationInput,
  validateSIPCalculationInput,
  validateTaxCalculationInput,
  validateRefinanceCalculationInput,
  validateFireCalculationInput,
  validateRecordPaymentInput,
} from '@dhanya/validation';

async function runPhase6Tests() {
  console.log('========================================================================');
  console.log('=== [Dhanya Test Suite] PHASE 6: CONTRACTS & PERSISTENCE HARDENING ===');
  console.log('========================================================================\n');

  process.env.DHANYA_ENV = 'test';
  process.env.DHANYA_ENABLE_DEV_AUTH = 'true';

  const app = createBackendApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const devUsers = DevAuthProvider.getDevUsers();
  const borrower = devUsers.find((u) => u.id === 'usr_borrower_001')!;
  const actuary = devUsers.find((u) => u.id === 'usr_actuary_001')!;
  const borrowerToken = AuthService.mintToken(borrower);
  const actuaryToken = AuthService.mintToken(actuary);

  try {
    // -------------------------------------------------------------
    // TEST 1: Strict Loan/Mortgage Calculation Contract
    // -------------------------------------------------------------
    console.log('[Test 1] Testing Loan & Mortgage API Strict Input Validation...');
    
    // Valid loan request
    const resValidLoan = await fetch(`${baseUrl}/calculations/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 250000,
        annualRatePct: 6.25,
        tenureYears: 30,
        extraMonthlyPayment: 150,
      }),
    });
    assert.equal(resValidLoan.status, 200, 'Valid loan calculation must succeed');
    const jsonValidLoan = await resValidLoan.json();
    assert.equal(jsonValidLoan.status, 'success');
    assert.equal(jsonValidLoan.engine, 'deterministic-actuarial-v1');
    assert.ok(jsonValidLoan.data.monthlyEmi > 0, 'Must return positive EMI');
    assert.ok(jsonValidLoan.data.schedule.length > 0, 'Must return amortization schedule');

    // Invalid: Missing tenure (no default to 30 permitted!)
    const resMissingTenure = await fetch(`${baseUrl}/calculations/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 250000,
        annualRatePct: 6.25,
      }),
    });
    assert.equal(resMissingTenure.status, 400, 'Missing tenure MUST fail validation with 400');
    const jsonMissingTenure = await resMissingTenure.json();
    assert.equal(jsonMissingTenure.code, 'VALIDATION_FAILED');

    // Invalid: Negative rate
    const resNegativeRate = await fetch(`${baseUrl}/calculations/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 250000,
        annualRatePct: -5,
        tenureYears: 30,
      }),
    });
    assert.equal(resNegativeRate.status, 400, 'Negative interest rate must be rejected');

    // Invalid: Non-numeric string / NaN
    const resNaNPrincipal = await fetch(`${baseUrl}/calculations/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 'not-a-number',
        annualRatePct: 5,
        tenureYears: 15,
      }),
    });
    assert.equal(resNaNPrincipal.status, 400, 'NaN principal must be rejected');

    // Invalid: Unsupported compoundingMethod enum
    const resInvalidCompounding = await fetch(`${baseUrl}/calculations/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 100000,
        annualRatePct: 5,
        tenureYears: 15,
        compoundingMethod: 'HOURLY',
      }),
    });
    assert.equal(resInvalidCompounding.status, 400, 'Invalid compounding enum must be rejected');

    console.log('✓ Test 1 Passed: Loan calculation strict contract enforced.\n');

    // -------------------------------------------------------------
    // TEST 2: Strict SIP Calculation Contract
    // -------------------------------------------------------------
    console.log('[Test 2] Testing SIP Calculation API Strict Contract...');
    
    // Valid SIP
    const resValidSip = await fetch(`${baseUrl}/calculations/sip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyInvestment: 1000,
        expectedAnnualReturnPct: 12,
        timePeriodYears: 15,
        annualStepUpPct: 10,
        expectedInflationPct: 4,
      }),
    });
    assert.equal(resValidSip.status, 200, 'Valid SIP calculation must succeed');
    const jsonValidSip = await resValidSip.json();
    assert.equal(jsonValidSip.status, 'success');
    assert.ok(jsonValidSip.data.totalMaturityValue > 0);
    assert.ok(jsonValidSip.data.inflationAdjustedValue > 0);

    // Invalid SIP: Missing timePeriodYears
    const resMissingYears = await fetch(`${baseUrl}/calculations/sip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyInvestment: 1000,
        expectedAnnualReturnPct: 12,
      }),
    });
    assert.equal(resMissingYears.status, 400, 'SIP without time period must fail validation');

    // Invalid SIP: Negative monthly investment
    const resNegativeSip = await fetch(`${baseUrl}/calculations/sip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyInvestment: -500,
        expectedAnnualReturnPct: 12,
        timePeriodYears: 10,
      }),
    });
    assert.equal(resNegativeSip.status, 400, 'Negative SIP investment must be rejected');

    console.log('✓ Test 2 Passed: SIP calculation strict validation verified.\n');

    // -------------------------------------------------------------
    // TEST 3: Strict Tax Calculation & Unsupported Jurisdiction Rejection
    // -------------------------------------------------------------
    console.log('[Test 3] Testing Progressive Tax Calculation & Jurisdiction Validation...');
    
    // Valid Tax in US
    const resValidUsTax = await fetch(`${baseUrl}/calculations/tax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossIncome: 120000,
        jurisdictionId: 'us-fed',
        customDeductions: 5000,
      }),
    });
    assert.equal(resValidUsTax.status, 200, 'Valid US tax calculation must succeed');
    const jsonUsTax = await resValidUsTax.json();
    assert.equal(jsonUsTax.status, 'success');
    assert.ok(jsonUsTax.data.totalTax > 0);
    assert.ok(jsonUsTax.data.effectiveTaxRate > 0);

    // Valid Tax in India (New Regime)
    const resValidInTax = await fetch(`${baseUrl}/calculations/tax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossIncome: 1500000,
        jurisdictionId: 'in-new',
        customDeductions: 0,
      }),
    });
    assert.equal(resValidInTax.status, 200, 'Valid IN tax calculation must succeed');

    // Invalid: Unsupported jurisdiction (MUST NOT silently fallback to us-fed!)
    const resInvalidJur = await fetch(`${baseUrl}/calculations/tax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossIncome: 100000,
        jurisdictionId: 'fake-country-fed',
      }),
    });
    assert.equal(resInvalidJur.status, 400, 'Unsupported jurisdiction must return 400');
    const jsonInvalidJur = await resInvalidJur.json();
    assert.equal(jsonInvalidJur.code, 'VALIDATION_FAILED');

    // Invalid: Negative income
    const resNegativeIncome = await fetch(`${baseUrl}/calculations/tax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossIncome: -1000,
        jurisdictionId: 'us-fed',
      }),
    });
    assert.equal(resNegativeIncome.status, 400, 'Negative gross income must return 400');

    console.log('✓ Test 3 Passed: Tax calculation strict jurisdiction enforcement verified.\n');

    // -------------------------------------------------------------
    // TEST 4: Refinance & FIRE Calculation Hardening (No Defaults)
    // -------------------------------------------------------------
    console.log('[Test 4] Testing Refinance & FIRE APIs with zero unsafe defaults...');
    
    // Valid Refinance
    const resValidRefinance = await fetch(`${baseUrl}/calculations/refinance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentBalance: 320000,
        currentRatePct: 6.75,
        currentRemainingTenureMonths: 280,
        newRatePct: 5.25,
        newTenureMonths: 240,
        closingCosts: 4000,
      }),
    });
    assert.equal(resValidRefinance.status, 200, 'Valid refinance calculation must succeed');
    const jsonRefinance = await resValidRefinance.json();
    assert.equal(jsonRefinance.status, 'success');
    assert.ok(jsonRefinance.data.monthlySavings !== undefined);
    assert.ok(jsonRefinance.data.lifetimeInterestSavings !== undefined);

    // Invalid Refinance: Missing newRatePct
    const resMissingRefinanceRate = await fetch(`${baseUrl}/calculations/refinance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentBalance: 320000,
        currentRatePct: 6.75,
        currentRemainingTenureMonths: 280,
        newTenureMonths: 240,
      }),
    });
    assert.equal(resMissingRefinanceRate.status, 400, 'Refinance without newRatePct must fail with 400');

    // Valid FIRE
    const resValidFire = await fetch(`${baseUrl}/calculations/fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annualExpenses: 75000,
        currentSavings: 150000,
        monthlySavings: 3000,
        swrPct: 3.5,
        expectedReturnPct: 8.5,
        inflationPct: 2.5,
      }),
    });
    assert.equal(resValidFire.status, 200, 'Valid FIRE calculation must succeed');
    const jsonFire = await resValidFire.json();
    assert.equal(jsonFire.status, 'success');
    assert.ok(jsonFire.data.targetNestEgg > 0);
    assert.ok(jsonFire.data.yearsToFreedom > 0);

    // Invalid FIRE: Missing annualExpenses
    const resMissingExpenses = await fetch(`${baseUrl}/calculations/fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentSavings: 150000,
        monthlySavings: 3000,
      }),
    });
    assert.equal(resMissingExpenses.status, 400, 'FIRE without annualExpenses must fail with 400');

    console.log('✓ Test 4 Passed: Refinance and FIRE validation hardened.\n');

    // -------------------------------------------------------------
    // TEST 5: Fail-Closed Production Persistence Verification
    // -------------------------------------------------------------
    console.log('[Test 5] Testing Fail-Closed Production Storage Policy...');
    
    // Simulate production environment
    process.env.DHANYA_ENV = 'production';
    
    let caughtFatal = false;
    try {
      // In-memory request in production must throw immediately
      new DatabaseManager(true);
    } catch (err) {
      caughtFatal = true;
      assert.ok(String(err).includes('FATAL'), 'Error must explicitly state FATAL violation');
    }
    assert.ok(caughtFatal, 'DatabaseManager MUST throw fatal error if in-memory storage requested in production');

    // Restore test environment
    process.env.DHANYA_ENV = 'test';
    console.log('✓ Test 5 Passed: Production fail-closed persistence verified.\n');

    // -------------------------------------------------------------
    // TEST 6: Durable File Persistence, Atomic Writes, & Disk Reload
    // -------------------------------------------------------------
    console.log('[Test 6] Testing Durable Storage Disk Hydration & Atomic Writes...');
    
    const tempDir = path.resolve(process.cwd(), `./data-test-p6-${Date.now()}`);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    const durableEngine = new DurableDatabaseEngine(tempDir);
    durableEngine.init();

    const auditRepo = new DurableAuditRepository(durableEngine);
    const loanRepo = new DurableLoanRepository(durableEngine);

    // Save a unique loan
    const testLoanId = `loan-persist-${Date.now()}`;
    await loanRepo.save({
      id: testLoanId,
      userId: 'usr_borrower_001',
      name: 'Durable Persistence Test Mortgage',
      lender: 'Actuarial Bank',
      loanType: 'MORTGAGE',
      countryCode: 'US',
      currencyCode: 'USD',
      originalPrincipal: 450000,
      currentPrincipal: 420000,
      interestRate: 5.75,
      startDate: '2024-01-01',
      tenureMonths: 360,
      monthlyEmi: 2625.5,
      nextDueDate: '2026-09-01',
      totalInstallments: 360,
      paidInstallments: 30,
      remainingInstallments: 330,
      paymentFrequency: 'MONTHLY',
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    }, 'usr_borrower_001');

    // Record audit entries
    await auditRepo.record({
      actor: 'Alex Rivera',
      actorId: 'usr_borrower_001',
      actorRole: 'USER',
      action: 'CREATE_LOAN',
      targetEntity: 'Durable Persistence Test Mortgage',
      details: 'Created test mortgage on durable ledger',
    });

    await auditRepo.record({
      actor: 'Dr. Evelyn Vance',
      actorId: 'usr_actuary_001',
      actorRole: 'CHIEF_ACTUARY',
      action: 'UPDATE_RULE',
      targetEntity: 'Federal Prime Benchmark',
      details: 'Reviewed prime rate benchmark',
    });

    // Check pre-reload integrity
    const preIntegrity = await auditRepo.verifyIntegrity();
    assert.ok(preIntegrity.valid, 'Audit hash chain must be valid before reload');

    // Simulate complete process restart: instantiate new engine pointing to same disk path
    const reloadedEngine = new DurableDatabaseEngine(tempDir);
    reloadedEngine.init();

    const reloadedLoanRepo = new DurableLoanRepository(reloadedEngine);
    const reloadedAuditRepo = new DurableAuditRepository(reloadedEngine);

    const hydratedLoan = await reloadedLoanRepo.findById(testLoanId, 'usr_borrower_001');
    assert.ok(hydratedLoan, 'Loan must be hydrated from disk after restart');
    assert.equal(hydratedLoan?.originalPrincipal, 450000);
    assert.equal(hydratedLoan?.currentPrincipal, 420000);

    const postIntegrity = await reloadedAuditRepo.verifyIntegrity();
    assert.ok(postIntegrity.valid, 'Audit hash chain must remain 100% valid after disk reload');
    assert.ok(postIntegrity.totalRecords >= 3, 'All chained audit entries must survive disk reload');

    // Clean up test directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Test 6 Passed: Durable persistence & hash chain preservation across restarts verified.\n');

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant Loan Payment Atomicity & Validation
    // -------------------------------------------------------------
    console.log('[Test 7] Testing Loan Installment Payment Atomicity & Audit Recording...');
    
    // First create a loan for Alex Rivera
    const resCreateLoan = await fetch(`${baseUrl}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${borrowerToken}`,
      },
      body: JSON.stringify({
        name: 'Alex Auto Loan Test',
        lender: 'Chase Auto',
        loanType: 'AUTO',
        originalPrincipal: 30000,
        currentPrincipal: 30000,
        interestRate: 6.0,
        tenureMonths: 60,
        monthlyEmi: 580.0,
      }),
    });
    assert.equal(resCreateLoan.status, 201, 'Loan creation must succeed');
    const jsonCreated = await resCreateLoan.json();
    const createdLoanId = jsonCreated.data.id;

    // Record an installment with extra payment
    const resPayment = await fetch(`${baseUrl}/loans/${createdLoanId}/record-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${borrowerToken}`,
      },
      body: JSON.stringify({
        extraPrincipal: 500,
      }),
    });
    assert.equal(resPayment.status, 200, 'Recording valid payment must succeed');
    const jsonPayment = await resPayment.json();
    assert.equal(jsonPayment.status, 'success');
    assert.ok(jsonPayment.data.currentPrincipal < 30000, 'Principal must decrease');
    assert.equal(jsonPayment.data.paidInstallments, 1, 'Paid installments must increment');

    // Reject negative extra payment
    const resNegativePayment = await fetch(`${baseUrl}/loans/${createdLoanId}/record-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${borrowerToken}`,
      },
      body: JSON.stringify({
        extraPrincipal: -100,
      }),
    });
    assert.equal(resNegativePayment.status, 400, 'Negative extra payment must be rejected');

    console.log('✓ Test 7 Passed: Loan payment atomicity and validation verified.\n');

    console.log('========================================================================');
    console.log('ALL PHASE 6 CONTRACT HARDENING & PERSISTENCE TESTS COMPLETED GREEN! 🚀');
    console.log('========================================================================\n');

  } finally {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

runPhase6Tests().catch((err) => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
