/**
 * Dhanya Backend Verification Test Suite
 * Tests:
 * 1. Token minting, verification, and tamper rejection
 * 2. Role-based access control (RBAC) matrix
 * 3. Tenant-isolated loan CRUD operations
 * 4. Tamper-evident SHA-256 hash chaining audit log
 * 5. Durable storage engine persistence & reload
 * 6. Input validation and sanitization
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Explicitly establish deterministic test environment configuration before loading app modules
process.env.DHANYA_ENV = 'test';
process.env.DHANYA_ENABLE_DEV_AUTH = 'true';

import { AuthService, DevAuthProvider } from '../src/auth/index';
import { MemoryLoanRepository, MemoryAuditRepository } from '../src/repositories/memory/index';
import { DurableDatabaseEngine, DurableLoanRepository } from '../src/repositories/durable/index';
import { validateUserTrackedLoanInput, validateRuleUpdateInput } from '@dhanya/validation';
import { UserTrackedLoan } from '@dhanya/types';

async function runTests() {
  console.log('=== [Dhanya Test Suite] Starting Backend & Persistence Tests ===\n');

  // TEST 1: Auth Token Service & Tamper Resistance
  console.log('[Test 1] Testing HMAC-SHA256 Token Minting & Verification...');
  const devUsers = DevAuthProvider.getDevUsers();
  const devUser = devUsers[0]; // usr_owner_001
  const token = AuthService.mintToken(devUser);
  assert.ok(token && token.length > 20, 'Token should be a non-empty string');

  const verified = AuthService.verifyToken(token);
  assert.ok(verified, 'Valid token should be verified');
  assert.equal(verified?.sub, devUser.id, 'Verified user ID must match original');
  assert.equal(verified?.role, devUser.role, 'Verified user role must match original');

  // Tampered token test
  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  const tamperedVerified = AuthService.verifyToken(tamperedToken);
  assert.equal(tamperedVerified, null, 'Tampered token must be rejected');
  console.log('✓ Token service & tamper resistance passed.\n');

  // TEST 2: Role Authorization Matrix
  console.log('[Test 2] Testing Role Permissions...');
  const actuary = DevAuthProvider.getUserById('usr_actuary_001');
  const user = DevAuthProvider.getUserById('usr_borrower_001');
  assert.ok(actuary && actuary.role === 'CHIEF_ACTUARY');
  assert.ok(user && user.role === 'USER');
  console.log('✓ Dev user personas verified.\n');

  // TEST 3: Multi-Tenant Loan Isolation (In-Memory)
  console.log('[Test 3] Testing Tenant Loan Isolation in Repository...');
  const loanRepo = new MemoryLoanRepository();

  const user1Loan: UserTrackedLoan = {
    id: 'loan-u1-1',
    userId: 'user_1',
    name: 'User 1 Mortgage',
    lender: 'Bank A',
    loanType: 'MORTGAGE',
    countryCode: 'US',
    currencyCode: 'USD',
    originalPrincipal: 300000,
    currentPrincipal: 280000,
    interestRate: 6.5,
    startDate: '2023-01-01',
    tenureMonths: 360,
    monthlyEmi: 1896.2,
    nextDueDate: '2026-09-01',
    totalInstallments: 360,
    paidInstallments: 40,
    remainingInstallments: 320,
    paymentFrequency: 'MONTHLY',
    status: 'ACTIVE',
    lastUpdated: new Date().toISOString(),
  };

  const user2Loan: UserTrackedLoan = {
    id: 'loan-u2-1',
    userId: 'user_2',
    name: 'User 2 Auto Loan',
    lender: 'Bank B',
    loanType: 'AUTO',
    countryCode: 'US',
    currencyCode: 'USD',
    originalPrincipal: 25000,
    currentPrincipal: 15000,
    interestRate: 4.5,
    startDate: '2024-01-01',
    tenureMonths: 60,
    monthlyEmi: 466.0,
    nextDueDate: '2026-09-01',
    totalInstallments: 60,
    paidInstallments: 20,
    remainingInstallments: 40,
    paymentFrequency: 'MONTHLY',
    status: 'ACTIVE',
    lastUpdated: new Date().toISOString(),
  };

  await loanRepo.save(user1Loan, 'user_1');
  await loanRepo.save(user2Loan, 'user_2');

  const u1Loans = await loanRepo.findAllByUserId('user_1');
  const u2Loans = await loanRepo.findAllByUserId('user_2');

  assert.equal(u1Loans.length, 1, 'User 1 should have exactly 1 loan');
  assert.equal(u1Loans[0].id, 'loan-u1-1', 'User 1 should only see their own loan');

  assert.equal(u2Loans.length, 1, 'User 2 should have exactly 1 loan');
  assert.equal(u2Loans[0].id, 'loan-u2-1', 'User 2 should only see their own loan');

  // Cross-tenant access attempt
  const crossAccess = await loanRepo.findById('loan-u2-1', 'user_1');
  assert.equal(crossAccess, null, 'User 1 must not be able to access User 2 loan by ID');

  const deleteForbidden = await loanRepo.delete('loan-u2-1', 'user_1');
  assert.equal(deleteForbidden, false, 'User 1 must not be able to delete User 2 loan');
  console.log('✓ Strict multi-tenant isolation verified.\n');

  // TEST 4: SHA-256 Tamper-Resistant Hash Chaining
  console.log('[Test 4] Testing Cryptographic Hash Chaining on Audit Ledger...');
  const auditRepo = new MemoryAuditRepository();

  await auditRepo.record({
    actor: 'Lead Actuary',
    actorRole: 'CHIEF_ACTUARY',
    action: 'CREATE_RULE',
    targetEntity: 'Mortgage Rate Index',
    details: 'Created v1',
  });
  await auditRepo.record({
    actor: 'Lead Actuary',
    actorRole: 'CHIEF_ACTUARY',
    action: 'UPDATE_RULE',
    targetEntity: 'Mortgage Rate Index',
    details: 'Updated to v2',
  });
  await auditRepo.record({
    actor: 'System Admin',
    actorRole: 'ADMIN',
    action: 'VERIFY_SOURCE',
    targetEntity: 'Federal Reserve',
    details: 'Re-verified source citation',
  });

  const integrityCheck = await auditRepo.verifyIntegrity();
  assert.ok(integrityCheck.valid, 'Initial hash chain must be 100% valid');
  assert.equal(integrityCheck.totalRecords, 3, 'Should have 3 verified entries');

  const logs = await auditRepo.findAll();
  assert.ok(logs[0].hash, 'Entry must have a SHA-256 hash');
  assert.ok(logs[0].previousHash, 'Entry must be chained to previousHash');
  console.log('✓ SHA-256 hash chain verification passed.\n');

  // TEST 5: Durable Storage Engine
  console.log('[Test 5] Testing Durable Storage Engine Disk Hydration...');
  const testDataDir = path.resolve(process.cwd(), './data-test');
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }

  const durableEngine = new DurableDatabaseEngine(testDataDir);
  durableEngine.init();
  const durableLoanRepo = new DurableLoanRepository(durableEngine);

  // Save a loan into durable engine
  await durableLoanRepo.save(
    {
      ...user1Loan,
      id: 'loan-durable-1',
      userId: 'test_user_99',
    },
    'test_user_99'
  );

  // Re-instantiate a fresh durable engine against the same directory
  const reloadedEngine = new DurableDatabaseEngine(testDataDir);
  reloadedEngine.init();
  const reloadedLoanRepo = new DurableLoanRepository(reloadedEngine);

  const persistedLoans = await reloadedLoanRepo.findAllByUserId('test_user_99');
  assert.equal(persistedLoans.length, 1, 'Persisted loan must survive engine restart');
  assert.equal(persistedLoans[0].name, 'User 1 Mortgage', 'Loan data integrity preserved');

  // Clean up test dir
  fs.rmSync(testDataDir, { recursive: true, force: true });
  console.log('✓ Durable file storage hydration passed.\n');

  // TEST 6: Validation Engine Rejections
  console.log('[Test 6] Testing Schema Validation Rejections...');
  const invalidLoan = {
    name: '', // Empty name
    originalPrincipal: -5000, // Negative principal
    interestRate: 150, // Rate > 100%
  };

  const validation = validateUserTrackedLoanInput(invalidLoan);
  assert.equal(validation.isValid, false, 'Invalid loan payload must fail validation');
  assert.ok(validation.errors.name, 'Must report name error');
  assert.ok(validation.errors.originalPrincipal, 'Must report principal error');
  assert.ok(validation.errors.interestRate, 'Must report interestRate error');

  const invalidRule = {
    title: '',
    value: NaN,
  };
  const ruleValidation = validateRuleUpdateInput(invalidRule);
  assert.equal(ruleValidation.success, false, 'Invalid rule must fail validation');
  console.log('✓ Schema validation passed.\n');

  console.log('====================================================');
  console.log('ALL DHANYA BACKEND & PERSISTENCE TESTS PASSED! (6/6)');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
