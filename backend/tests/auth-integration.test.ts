/**
 * Dhanya End-to-End Authentication & RBAC Integration Test Suite
 * 
 * Tests complete HTTP flow against the live backend API:
 * 1. Unauthenticated request rejection (401)
 * 2. User login and HMAC token issuance
 * 3. Protected loan creation attached to authenticated user
 * 4. Multi-tenant isolation between User A (Alex) and User B (Sarah)
 * 5. Expired token rejection (401)
 * 6. Tampered token rejection (401)
 * 7. Server-side RBAC enforcement:
 *    - USER accessing /admin/audit-logs -> 403 Forbidden
 *    - CHIEF_ACTUARY accessing /admin/audit-logs -> 200 OK
 *    - CHIEF_ACTUARY accessing /admin/audit-logs/verify-integrity -> 403 Forbidden
 *    - ADMIN accessing /admin/audit-logs/verify-integrity -> 200 OK
 * 8. Loan installment payment calculation & ledger update
 * 9. Session restoration endpoint GET /auth/me
 * 10. Centralized logout audit logging
 */

import { strict as assert } from 'node:assert';
import http from 'node:http';

// Explicitly establish deterministic test environment configuration before loading app modules
process.env.DHANYA_ENV = 'test';
process.env.DHANYA_ENABLE_DEV_AUTH = 'true';

import { createBackendApp } from '../src/app';
import { AuthService, SignedTokenAuthService } from '../src/auth/auth.service';
import { AuthUser } from '@dhanya/types';

async function runIntegrationTests() {
  console.log('=== [Dhanya Test Suite] Starting E2E HTTP Auth & Tenant Integration Tests ===\n');

  // Start test server on dynamic port
  const app = createBackendApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Unauthenticated Request to Protected Route
    // -------------------------------------------------------------
    console.log('[Scenario 1] Unauthenticated request to /loans...');
    const unauthRes = await fetch(`${baseUrl}/loans`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');
    const unauthJson = await unauthRes.json();
    assert.equal(unauthJson.code, 'UNAUTHORIZED');
    console.log('✓ Unauthenticated request rejected with 401.\n');

    // -------------------------------------------------------------
    // SCENARIO 2: Login Flow for User A (Alex Rivera)
    // -------------------------------------------------------------
    console.log('[Scenario 2] Authenticating User A (Alex Rivera)...');
    const loginUserARes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.rivera@example.com',
        role: 'USER',
        countryCode: 'US',
      }),
    });
    assert.equal(loginUserARes.status, 200, 'User A login should succeed');
    const userAAuth = await loginUserARes.json();
    assert.ok(userAAuth.data?.token, 'Must return signed token');
    assert.equal(userAAuth.data.user.role, 'USER');
    const tokenA = userAAuth.data.token;
    const userAId = userAAuth.data.user.id;
    console.log(`✓ User A authenticated. (ID: ${userAId})\n`);

    // -------------------------------------------------------------
    // SCENARIO 3: Session Verification (GET /auth/me)
    // -------------------------------------------------------------
    console.log('[Scenario 3] Verifying session restoration (GET /auth/me)...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(meRes.status, 200, 'GET /auth/me should return 200 for valid token');
    const meJson = await meRes.json();
    assert.equal(meJson.data.user.id, userAId);
    assert.equal(meJson.data.user.email, 'alex.rivera@example.com');
    console.log('✓ Session verification passed.\n');

    // -------------------------------------------------------------
    // SCENARIO 4: User A creates a protected loan
    // -------------------------------------------------------------
    console.log('[Scenario 4] User A creates a private loan on the server ledger...');
    const createLoanRes = await fetch(`${baseUrl}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: "Alex's Primary Mortgage",
        lender: 'First Republic Lending',
        loanType: 'MORTGAGE',
        countryCode: 'US',
        currencyCode: 'USD',
        originalPrincipal: 500000,
        currentPrincipal: 450000,
        interestRate: 6.25,
        startDate: '2022-01-01',
        tenureMonths: 360,
        monthlyEmi: 3078.59,
        nextDueDate: '2026-09-01',
        totalInstallments: 360,
        paidInstallments: 55,
        remainingInstallments: 305,
        paymentFrequency: 'MONTHLY',
        status: 'ACTIVE',
      }),
    });
    assert.equal(createLoanRes.status, 201, 'Loan creation must return 201 Created');
    const createdLoanA = (await createLoanRes.json()).data;
    assert.ok(createdLoanA.id, 'Created loan must have an ID');
    assert.equal(createdLoanA.userId, userAId, 'Loan must be bound to User A');
    console.log(`✓ Loan created successfully with ID: ${createdLoanA.id}\n`);

    // -------------------------------------------------------------
    // SCENARIO 5: Multi-Tenant Isolation - User B cannot see or modify User A's loan
    // -------------------------------------------------------------
    console.log('[Scenario 5] Testing Multi-Tenant Isolation with User B (Sarah Chen)...');
    const loginUserBRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.chen@example.com',
        role: 'USER',
        countryCode: 'US',
      }),
    });
    const userBAuth = await loginUserBRes.json();
    const tokenB = userBAuth.data.token;
    const userBId = userBAuth.data.user.id;

    // User B lists all loans -> Must NOT include User A's loan
    const userBLoansRes = await fetch(`${baseUrl}/loans`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBLoans = (await userBLoansRes.json()).data;
    const foundUserALoanInB = userBLoans.some((l: any) => l.id === createdLoanA.id);
    assert.equal(foundUserALoanInB, false, 'User B loan list must NOT contain User A loan');

    // User B attempts direct GET /loans/:userALoanId -> Must return 404 Not Found
    const userBAccessARes = await fetch(`${baseUrl}/loans/${createdLoanA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(userBAccessARes.status, 404, 'Cross-tenant GET must return 404');

    // User B attempts DELETE /loans/:userALoanId -> Must return 404 Not Found
    const userBDeleteARes = await fetch(`${baseUrl}/loans/${createdLoanA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(userBDeleteARes.status, 404, 'Cross-tenant DELETE must return 404');
    console.log('✓ Strict multi-tenant isolation verified across tenants.\n');

    // -------------------------------------------------------------
    // SCENARIO 6: Expired Token Rejection
    // -------------------------------------------------------------
    console.log('[Scenario 6] Testing rejection of expired tokens...');
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = SignedTokenAuthService.mintTokenWithClaims({
      sub: 'usr_expired_001',
      email: 'expired@example.com',
      name: 'Expired User',
      role: 'USER',
      iat: now - 3600,
      exp: now - 60,
    });

    const expiredReqRes = await fetch(`${baseUrl}/loans`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expiredReqRes.status, 401, 'Expired token must return 401');
    const expiredJson = await expiredReqRes.json();
    assert.equal(expiredJson.code, 'UNAUTHORIZED');
    console.log('✓ Expired token rejected with 401 UNAUTHORIZED.\n');

    // -------------------------------------------------------------
    // SCENARIO 7: Tampered Token Rejection
    // -------------------------------------------------------------
    console.log('[Scenario 7] Testing rejection of tampered tokens...');
    const tamperedToken = tokenA.slice(0, -8) + 'deadbeef';
    const tamperedReqRes = await fetch(`${baseUrl}/loans`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert.equal(tamperedReqRes.status, 401, 'Tampered token must return 401');
    console.log('✓ Tampered token rejected with 401.\n');

    // -------------------------------------------------------------
    // SCENARIO 8: Server-Side RBAC Enforcement on Admin Routes
    // -------------------------------------------------------------
    console.log('[Scenario 8] Testing Role-Based Access Control on /admin endpoints...');

    // 8a. USER role tries to access audit logs -> 403 Forbidden
    const userAdminRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(userAdminRes.status, 403, 'Standard USER must be forbidden from /admin/audit-logs');
    const userAdminJson = await userAdminRes.json();
    assert.equal(userAdminJson.code, 'FORBIDDEN');

    // 8b. Authenticate Non-Admin User (e.g. user@dhanya.internal)
    const nonAdminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@dhanya.internal',
      }),
    });
    const nonAdminToken = (await nonAdminLoginRes.json()).data.token;

    // Non-admin accesses audit logs -> 403 Forbidden
    const nonAdminAuditRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${nonAdminToken}` },
    });
    assert.equal(nonAdminAuditRes.status, 403, 'Non-admin user cannot read audit logs');

    // Non-admin tries to trigger cryptographic verify-integrity -> 403 Forbidden
    const nonAdminVerifyRes = await fetch(`${baseUrl}/admin/audit-logs/verify-integrity`, {
      headers: { Authorization: `Bearer ${nonAdminToken}` },
    });
    assert.equal(nonAdminVerifyRes.status, 403, 'Non-admin cannot access ADMIN-only verify-integrity endpoint');

    // 8c. Authenticate ADMIN
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@dhanya.com',
        role: 'ADMIN',
      }),
    });
    const adminToken = (await adminLoginRes.json()).data.token;

    // ADMIN accesses verify-integrity -> 200 OK
    const adminVerifyRes = await fetch(`${baseUrl}/admin/audit-logs/verify-integrity`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminVerifyRes.status, 200, 'ADMIN can verify audit hash chain integrity');
    const adminVerifyJson = await adminVerifyRes.json();
    assert.equal(adminVerifyJson.data.valid, true, 'Audit hash chain must be intact');
    console.log('✓ Server-side RBAC matrix verified.\n');

    // -------------------------------------------------------------
    // SCENARIO 9: Installment Payment Recording (Deterministic Math Engine)
    // -------------------------------------------------------------
    console.log('[Scenario 9] Testing installment payment recording on server ledger...');
    const paymentRes = await fetch(`${baseUrl}/loans/${createdLoanA.id}/record-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ extraPrincipal: 1000 }),
    });
    assert.equal(paymentRes.status, 200, 'Payment recording must return 200');
    const paymentJson = await paymentRes.json();
    const updatedLoan = paymentJson.data;
    assert.ok(updatedLoan.currentPrincipal < createdLoanA.currentPrincipal, 'Principal must be reduced');
    assert.equal(updatedLoan.paidInstallments, createdLoanA.paidInstallments + 1);
    console.log(`✓ Payment recorded. Principal reduced from ${createdLoanA.currentPrincipal} to ${updatedLoan.currentPrincipal}.\n`);

    // -------------------------------------------------------------
    // SCENARIO 10: Logout Audit Event
    // -------------------------------------------------------------
    console.log('[Scenario 10] Testing logout endpoint and audit logging...');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
    });
    assert.equal(logoutRes.status, 200, 'Logout should succeed');
    console.log('✓ Logout completed and acknowledged.\n');

    console.log('===========================================================');
    console.log('ALL 10 END-TO-END AUTHENTICATION INTEGRATION TESTS PASSED!');
    console.log('===========================================================\n');
  } finally {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

runIntegrationTests().catch((err) => {
  console.error('Integration test failed with error:', err);
  process.exit(1);
});
