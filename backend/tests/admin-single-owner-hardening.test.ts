/**
 * Dhanya Admin Single Owner Hardening Test Suite
 * Application: backend
 * 
 * Comprehensive verification of all 14 mandatory Admin & Single Owner Hardening scenarios:
 *  1. Authorized Admin can authenticate
 *  2. Authorized Admin can access /api/v1/admin/* endpoints
 *  3. Normal USER cannot access Admin endpoints (403 Forbidden)
 *  4. CHIEF_ACTUARY cannot access Owner-only endpoints (e.g. /admin/users)
 *  5. Client cannot escalate USER -> ADMIN (client-supplied fields ignored)
 *  6. Client cannot escalate USER -> OWNER (client-supplied fields ignored)
 *  7. Forged Admin token is rejected (401 Unauthorized)
 *  8. Wrong issuer rejected (401 Unauthorized)
 *  9. Wrong audience rejected (401 Unauthorized)
 * 10. Expired Admin token rejected (401 Unauthorized)
 * 11. Logout revokes Admin session/token (401 Unauthorized on subsequent use)
 * 12. Dev Admin endpoints are unavailable when dev auth is disabled (404 Not Found)
 * 13. Admin authorization survives session restoration (GET /auth/me returns verified profile)
 * 14. Unauthorized /admin API access without credentials returns 401 Unauthorized
 */

import { strict as assert } from 'node:assert';
import http from 'node:http';
import { createBackendApp } from '../src/app';
import { SignedTokenAuthService } from '../src/auth/auth.service';
import { tokenRevocationStore } from '../src/auth/revocation.store';

async function runAdminHardeningTests() {
  console.log('================================================================');
  console.log('=== [Dhanya Test Suite] ADMIN SINGLE OWNER HARDENING TESTS =====');
  console.log('================================================================\n');

  // Reset revocation store for clean run
  tokenRevocationStore.clear();

  // Test setup
  process.env.DHANYA_ENV = 'test';
  process.env.DHANYA_ENABLE_DEV_AUTH = 'true';
  process.env.DHANYA_ADMIN_EMAIL = 'owner@dhanya.internal';

  const app = createBackendApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Authorized Admin can authenticate
    // -------------------------------------------------------------
    console.log('[Scenario 1] Authenticating authorized Platform Owner...');
    const res1 = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devUserId: 'usr_dev_owner' }),
    });
    assert.equal(res1.status, 200, 'Owner dev-login must return 200');
    const json1 = await res1.json();
    assert.equal(json1.status, 'success');
    assert.ok(json1.data.token, 'Must return signed token');
    assert.equal(json1.data.user.role, 'OWNER', 'Must have OWNER role');
    assert.equal(json1.data.user.email, 'owner@dhanya.internal');
    const ownerToken = json1.data.token;
    console.log('✓ Scenario 1 Passed: Authorized Admin authenticated successfully with OWNER role.\n');

    // -------------------------------------------------------------
    // SCENARIO 2: Authorized Admin can access /api/v1/admin/*
    // -------------------------------------------------------------
    console.log('[Scenario 2] Accessing /api/v1/admin/* with Owner token...');
    const res2Health = await fetch(`${baseUrl}/admin/health`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(res2Health.status, 200, '/admin/health must return 200 for OWNER');

    const res2Logs = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(res2Logs.status, 200, '/admin/audit-logs must return 200 for OWNER');

    const res2Users = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(res2Users.status, 200, '/admin/users must return 200 for OWNER');

    const res2Integrity = await fetch(`${baseUrl}/admin/audit-logs/verify-integrity`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(res2Integrity.status, 200, '/admin/audit-logs/verify-integrity must return 200 for OWNER');
    console.log('✓ Scenario 2 Passed: Authorized Admin can access all /api/v1/admin/* endpoints.\n');

    // -------------------------------------------------------------
    // SCENARIO 3: Normal USER cannot access Admin endpoints
    // -------------------------------------------------------------
    console.log('[Scenario 3] Authenticating standard USER (Alex Rivera) and testing admin access blocking...');
    const res3Login = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devUserId: 'usr_dev_alex' }),
    });
    assert.equal(res3Login.status, 200);
    const json3Login = await res3Login.json();
    assert.equal(json3Login.data.user.role, 'USER');
    const userToken = json3Login.data.token;

    const res3Admin = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res3Admin.status, 403, 'Normal USER must receive 403 FORBIDDEN on admin endpoints');
    const json3Admin = await res3Admin.json();
    assert.equal(json3Admin.code, 'FORBIDDEN');

    const res3Health = await fetch(`${baseUrl}/admin/health`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res3Health.status, 403, 'Normal USER must receive 403 on /admin/health');
    console.log('✓ Scenario 3 Passed: Standard USER is strictly denied admin access with HTTP 403.\n');

    // -------------------------------------------------------------
    // SCENARIO 4: Non-admin identities cannot access Admin endpoints
    // -------------------------------------------------------------
    console.log('[Scenario 4] Testing non-admin role boundaries on Admin endpoints...');
    const res4Login = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devUserId: 'usr_dev_actuary' }),
    });
    assert.equal(res4Login.status, 200);
    const actuaryToken = (await res4Login.json()).data.token;

    // Non-admin cannot access audit-logs (Requires ADMIN or OWNER)
    const res4Logs = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${actuaryToken}` },
    });
    assert.equal(res4Logs.status, 403, 'Non-admin receives 403 on /admin/audit-logs');

    // Non-admin CANNOT access users management (Requires ADMIN or OWNER)
    const res4Users = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${actuaryToken}` },
    });
    assert.equal(res4Users.status, 403, 'Non-admin must receive 403 on /admin/users');
    console.log('✓ Scenario 4 Passed: Non-admin access strictly denied on all Admin endpoints.\n');

    // -------------------------------------------------------------
    // SCENARIO 5: Client cannot escalate USER -> ADMIN
    // -------------------------------------------------------------
    console.log('[Scenario 5] Testing prevention of client-supplied role=ADMIN escalation...');
    const res5 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.rivera@example.com',
        role: 'ADMIN',
        isAdmin: true,
      }),
    });
    assert.equal(res5.status, 200);
    const json5 = await res5.json();
    assert.equal(json5.data.user.role, 'USER', 'Server must ignore client-supplied role=ADMIN');

    // Verify token issued has role USER
    const res5Verify = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${json5.data.token}` },
    });
    assert.equal(res5Verify.status, 403, 'Spoofed ADMIN token attempt must be rejected with 403');
    console.log('✓ Scenario 5 Passed: Client role escalation to ADMIN is completely prevented.\n');

    // -------------------------------------------------------------
    // SCENARIO 6: Client cannot escalate USER -> OWNER
    // -------------------------------------------------------------
    console.log('[Scenario 6] Testing prevention of client-supplied role=OWNER escalation...');
    const res6 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'attacker@example.com',
        role: 'OWNER',
        isOwner: true,
      }),
    });
    assert.equal(res6.status, 200);
    const json6 = await res6.json();
    assert.equal(json6.data.user.role, 'USER', 'Server must assign USER to arbitrary email');

    const res6Verify = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${json6.data.token}` },
    });
    assert.equal(res6Verify.status, 403, 'Attacker token rejected with 403 on Owner endpoint');
    console.log('✓ Scenario 6 Passed: Client role escalation to OWNER is completely prevented.\n');

    // -------------------------------------------------------------
    // SCENARIO 7: Forged Admin token is rejected
    // -------------------------------------------------------------
    console.log('[Scenario 7] Testing rejection of forged token signature...');
    const forgedToken = SignedTokenAuthService.mintTokenWithClaims(
      {
        sub: 'usr_forged_admin',
        email: 'forged.admin@dhanya.com',
        name: 'Forged Admin',
        role: 'OWNER',
      },
      'attacker-wrong-secret-key-that-does-not-match-server-signing-key-12345'
    );

    const res7 = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.equal(res7.status, 401, 'Forged token with incorrect signature must return 401');
    console.log('✓ Scenario 7 Passed: Forged Admin token with invalid HMAC signature is strictly rejected.\n');

    // -------------------------------------------------------------
    // SCENARIO 8: Wrong issuer rejected
    // -------------------------------------------------------------
    console.log('[Scenario 8] Testing rejection of invalid token issuer (iss)...');
    const wrongIssToken = SignedTokenAuthService.mintTokenWithClaims({
      sub: 'usr_owner_001',
      email: 'owner@dhanya.internal',
      name: 'Platform Principal Owner',
      role: 'OWNER',
      iss: 'malicious-identity-provider.fake',
    });

    const res8 = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${wrongIssToken}` },
    });
    assert.equal(res8.status, 401, 'Token with invalid issuer must return 401');
    console.log('✓ Scenario 8 Passed: Token with wrong issuer is rejected.\n');

    // -------------------------------------------------------------
    // SCENARIO 9: Wrong audience rejected
    // -------------------------------------------------------------
    console.log('[Scenario 9] Testing rejection of invalid token audience (aud)...');
    const wrongAudToken = SignedTokenAuthService.mintTokenWithClaims({
      sub: 'usr_owner_001',
      email: 'owner@dhanya.internal',
      name: 'Platform Principal Owner',
      role: 'OWNER',
      aud: 'external-foreign-platform',
    });

    const res9 = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${wrongAudToken}` },
    });
    assert.equal(res9.status, 401, 'Token with invalid audience must return 401');
    console.log('✓ Scenario 9 Passed: Token with wrong audience is rejected.\n');

    // -------------------------------------------------------------
    // SCENARIO 10: Expired Admin token rejected
    // -------------------------------------------------------------
    console.log('[Scenario 10] Testing rejection of expired Admin token...');
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = SignedTokenAuthService.mintTokenWithClaims({
      sub: 'usr_owner_001',
      email: 'owner@dhanya.internal',
      name: 'Platform Principal Owner',
      role: 'OWNER',
      iat: now - 7200,
      exp: now - 3600, // Expired 1 hour ago
    });

    const res10 = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(res10.status, 401, 'Expired token must return 401');
    console.log('✓ Scenario 10 Passed: Expired Admin token is strictly rejected.\n');

    // -------------------------------------------------------------
    // SCENARIO 11: Logout revokes Admin session/token
    // -------------------------------------------------------------
    console.log('[Scenario 11] Testing logout token revocation...');
    const res11Login = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devUserId: 'usr_dev_owner' }),
    });
    const sessionToken = (await res11Login.json()).data.token;

    // Verify token works before logout
    const res11Before = await fetch(`${baseUrl}/admin/health`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert.equal(res11Before.status, 200, 'Token valid before logout');

    // Logout and revoke token
    const res11Logout = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert.equal(res11Logout.status, 200, 'Logout succeeds');

    // Verify token is revoked and unusable after logout
    const res11After = await fetch(`${baseUrl}/admin/health`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert.equal(res11After.status, 401, 'Revoked token must return 401 on reuse');
    console.log('✓ Scenario 11 Passed: Logout revokes token session server-side; reuse is blocked.\n');

    // -------------------------------------------------------------
    // SCENARIO 12: Dev Admin endpoints unavailable when dev auth is disabled
    // -------------------------------------------------------------
    console.log('[Scenario 12] Testing dev auth disablement...');
    process.env.DHANYA_ENABLE_DEV_AUTH = 'false';

    const res12DevUsers = await fetch(`${baseUrl}/auth/dev-users`);
    assert.equal(res12DevUsers.status, 404, '/auth/dev-users must return 404 when dev auth disabled');

    const res12DevLogin = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devUserId: 'usr_dev_owner' }),
    });
    assert.equal(res12DevLogin.status, 404, '/auth/dev-login must return 404 when dev auth disabled');

    process.env.DHANYA_ENABLE_DEV_AUTH = 'true';
    console.log('✓ Scenario 12 Passed: Dev authentication endpoints strictly disabled when flag is false.\n');

    // -------------------------------------------------------------
    // SCENARIO 13: Admin session restoration (GET /auth/me)
    // -------------------------------------------------------------
    console.log('[Scenario 13] Testing Admin session restoration via /auth/me...');
    const res13 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(res13.status, 200, '/auth/me must return 200 with valid Admin token');
    const json13 = await res13.json();
    assert.equal(json13.data.user.role, 'OWNER');
    assert.equal(json13.data.user.email, 'owner@dhanya.internal');
    console.log('✓ Scenario 13 Passed: Admin profile and authorization successfully restored on verification.\n');

    // -------------------------------------------------------------
    // SCENARIO 14: Unauthorized /admin access without credentials returns 401
    // -------------------------------------------------------------
    console.log('[Scenario 14] Testing direct unauthenticated access to /admin endpoints...');
    const res14Health = await fetch(`${baseUrl}/admin/health`);
    assert.equal(res14Health.status, 401, 'Unauthenticated /admin/health must return 401');

    const res14Logs = await fetch(`${baseUrl}/admin/audit-logs`);
    assert.equal(res14Logs.status, 401, 'Unauthenticated /admin/audit-logs must return 401');

    const res14Users = await fetch(`${baseUrl}/admin/users`);
    assert.equal(res14Users.status, 401, 'Unauthenticated /admin/users must return 401');
    console.log('✓ Scenario 14 Passed: All /api/v1/admin/* endpoints strictly require authentication.\n');

    // -------------------------------------------------------------
    // SCENARIO 15: Custom Credentials with DHANYA_ADMIN_EMAIL
    // -------------------------------------------------------------
    console.log('[Scenario 15] Testing Credentials Sign In with DHANYA_ADMIN_EMAIL...');
    process.env.DHANYA_ADMIN_EMAIL = 'custom-admin@dhanya.com';
    const res15 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'custom-admin@dhanya.com' }),
    });
    assert.equal(res15.status, 200, 'Custom credentials with Admin email must return 200');
    const json15 = await res15.json();
    assert.equal(json15.status, 'success');
    assert.equal(json15.data.user.role, 'ADMIN', 'Authorized Admin email must receive ADMIN role');
    assert.equal(json15.data.user.email, 'custom-admin@dhanya.com');

    const res15AdminCheck = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${json15.data.token}` },
    });
    assert.equal(res15AdminCheck.status, 200, 'Admin email token must allow /admin access');
    console.log('✓ Scenario 15 Passed: Credentials login with DHANYA_ADMIN_EMAIL authenticates and grants ADMIN /admin access.\n');

    // -------------------------------------------------------------
    // SCENARIO 16: Credentials with non-admin email (e.g. user@example.com)
    // -------------------------------------------------------------
    console.log('[Scenario 16] Testing Credentials Sign In with non-admin email (user@example.com)...');
    const res16 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    assert.equal(res16.status, 200, 'Non-admin email must also authenticate successfully');
    const json16 = await res16.json();
    assert.equal(json16.status, 'success');
    assert.equal(json16.data.user.role, 'USER', 'Non-admin email must strictly receive standard USER role');
    assert.equal(json16.data.user.email, 'user@example.com');

    const res16AdminBlock = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${json16.data.token}` },
    });
    assert.equal(res16AdminBlock.status, 403, 'Non-admin email token must be blocked with 403 on /admin');
    console.log('✓ Scenario 16 Passed: Non-admin email authenticates with USER role and is blocked from /admin (403 Forbidden).\n');

    // -------------------------------------------------------------
    // SCENARIO 17: Case Insensitivity of DHANYA_ADMIN_EMAIL
    // -------------------------------------------------------------
    console.log('[Scenario 17] Testing case insensitivity and whitespace trimming for DHANYA_ADMIN_EMAIL...');
    const res17 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '  CUSTOM-ADMIN@DHANYA.COM  ' }),
    });
    assert.equal(res17.status, 200, 'Trimmed and lowercased admin email must match');
    const json17 = await res17.json();
    assert.equal(json17.data.user.role, 'ADMIN', 'Must receive ADMIN role');
    console.log('✓ Scenario 17 Passed: Admin email handles whitespace and case differences correctly.\n');

    // Reset back to test env
    process.env.DHANYA_ENV = 'test';
    process.env.NODE_ENV = 'test';
    process.env.DHANYA_ADMIN_EMAIL = 'admin@dhanya.com';

    console.log('================================================================');
    console.log('=== ALL 17 ADMIN & DEV AUTH HARDENING SCENARIOS PASSED =========');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

runAdminHardeningTests().catch((err) => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
