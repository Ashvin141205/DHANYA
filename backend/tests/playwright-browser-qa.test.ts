/**
 * Dhanya Comprehensive Playwright Browser QA Test Suite
 * 
 * Tests the 10 mandatory browser & security invariants:
 * TEST 1: Fresh browser -> open Web login -> Only simple email input is visible
 * TEST 2: Enter DHANYA_ADMIN_EMAIL -> Login succeeds -> Identity shows [ADMIN]
 * TEST 3: Open /admin -> Admin Console opens
 * TEST 4: Verify Admin API calls -> All authorized Admin operations succeed
 * TEST 5: Logout -> Session cleared
 * TEST 6: Enter different email -> Login succeeds -> Identity shows [USER]
 * TEST 7: Open /admin directly as USER -> ACCESS DENIED / 403
 * TEST 8: Directly call every /api/v1/admin/* endpoint as USER -> 403 for all
 * TEST 9: Client role escalation attempt (role=ADMIN) -> Server still provisions USER
 * TEST 10: Refresh both ADMIN and USER sessions -> Roles remain server-authoritative
 */

import { strict as assert } from 'node:assert';
import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.DHANYA_ADMIN_EMAIL || 'admin@dhanya.com';
const NORMAL_USER_EMAIL = 'other@gmail.com';

async function runBrowserQATests() {
  console.log('================================================================');
  console.log('=== DHANYA PLAYWRIGHT BROWSER QA & ADMIN RESTRICTION SUITE =====');
  console.log('================================================================\n');

  let browser: Browser | null = null;

  try {
    console.log(`[Setup] Launching Chromium browser (target: ${BASE_URL})...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // -------------------------------------------------------------
    // TEST 1: Fresh browser -> open Web login -> Only simple email input visible
    // -------------------------------------------------------------
    console.log('[TEST 1] Fresh browser -> open Web login. Verifying UI simplicity...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click Sign In button in navigation
    const signInBtn = page.getByRole('button', { name: /Sign In/i });
    await assert.doesNotReject(signInBtn.waitFor({ state: 'visible', timeout: 5000 }), 'Sign In button must be present in Nav');
    await signInBtn.click();
    await page.waitForTimeout(500);

    // Verify modal header
    const modalTitle = page.getByText(/Identity Authentication/i);
    await assert.doesNotReject(modalTitle.waitFor({ state: 'visible', timeout: 3000 }), 'Modal title must be "Identity Authentication"');

    // Verify Email Input field exists
    const emailInput = page.locator('input[type="email"]');
    await assert.doesNotReject(emailInput.waitFor({ state: 'visible', timeout: 3000 }), 'Email input field must be present');

    // Verify Submit button exists
    const submitBtn = page.getByRole('button', { name: /Sign In/i }).last();
    await assert.doesNotReject(submitBtn.waitFor({ state: 'visible', timeout: 3000 }), 'Sign In submit button must be present');

    // Strict negative checks: NO persona selector, NO test buttons
    const personaSelector = page.getByText(/Select Deterministic Dev Persona/i);
    assert.equal(await personaSelector.count(), 0, 'Must NOT contain persona selector');

    const ownerBtn = page.getByText(/Elena Rostova/i);
    assert.equal(await ownerBtn.count(), 0, 'Must NOT contain Owner persona button');

    const chiefActuaryBtn = page.getByText(/Marcus Vance/i);
    assert.equal(await chiefActuaryBtn.count(), 0, 'Must NOT contain Chief Actuary persona button');

    console.log('✓ TEST 1 Passed: Login modal strictly contains ONLY simple Email input and Sign In button.\n');

    // -------------------------------------------------------------
    // TEST 2: Enter DHANYA_ADMIN_EMAIL -> Login succeeds -> Identity shows [ADMIN]
    // -------------------------------------------------------------
    console.log(`[TEST 2] Submitting DHANYA_ADMIN_EMAIL (${ADMIN_EMAIL})...`);
    await emailInput.fill(ADMIN_EMAIL);
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Check navigation identity displays Admin email and [ADMIN]
    const navText = await page.textContent('header');
    assert.ok(navText?.includes(ADMIN_EMAIL), `Navigation must contain admin email: ${ADMIN_EMAIL}`);
    assert.ok(navText?.includes('[ADMIN]'), 'Navigation must display [ADMIN] role badge');
    console.log('✓ TEST 2 Passed: Authenticated as Admin; UI displays admin@dhanya.com [ADMIN].\n');

    // -------------------------------------------------------------
    // TEST 3: Open /admin -> Admin Console opens
    // -------------------------------------------------------------
    console.log('[TEST 3] Navigating to /admin as ADMIN...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const adminConsoleHeader = page.getByText(/Dhanya Administration Console/i);
    await assert.doesNotReject(adminConsoleHeader.waitFor({ state: 'visible', timeout: 5000 }), 'Admin Console must be visible for ADMIN role');

    // Verify Admin identity label in console
    const adminRoleBadge = page.getByText(/\[ADMIN\]/i).first();
    await assert.doesNotReject(adminRoleBadge.waitFor({ state: 'visible', timeout: 3000 }), 'Admin Console must display [ADMIN]');
    console.log('✓ TEST 3 Passed: Admin Console opens successfully for authenticated ADMIN.\n');

    // -------------------------------------------------------------
    // TEST 4: Verify Admin API calls succeed for ADMIN
    // -------------------------------------------------------------
    console.log('[TEST 4] Verifying Admin API calls with Admin session...');
    const adminToken = await page.evaluate(() => localStorage.getItem('dhanya_admin_token') || localStorage.getItem('dhanya_auth_token'));
    assert.ok(adminToken, 'Admin token must exist in localStorage');

    const testAdminEndpoints = [
      '/api/v1/admin/audit-logs',
      '/api/v1/admin/audit-logs/verify-integrity',
      '/api/v1/admin/health',
      '/api/v1/admin/diagnostics',
      '/api/v1/admin/users',
    ];

    for (const ep of testAdminEndpoints) {
      const res = await page.request.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status(), 200, `Admin API endpoint ${ep} must return 200 for ADMIN role`);
      const body = await res.json();
      assert.ok(body.status === 'success' || body.status === 'healthy', `${ep} must return success`);
    }
    console.log('✓ TEST 4 Passed: All Admin API endpoints return 200 OK for ADMIN.\n');

    // -------------------------------------------------------------
    // TEST 5: Logout
    // -------------------------------------------------------------
    console.log('[TEST 5] Logging out Admin session...');
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    await signOutBtn.click();
    await page.waitForTimeout(1000);

    // After logout, token in localStorage is revoked/cleared
    const postLogoutAdminToken = await page.evaluate(() => localStorage.getItem('dhanya_admin_token'));
    assert.ok(!postLogoutAdminToken, 'Admin token must be removed from localStorage after logout');

    // Reusing revoked token must fail with 401
    const revokedRes = await page.request.get(`${BASE_URL}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(revokedRes.status(), 401, 'Revoked token must be rejected with 401 UNAUTHORIZED');
    console.log('✓ TEST 5 Passed: Logout successfully clears session and revokes server token.\n');

    // -------------------------------------------------------------
    // TEST 6: Enter a completely different email -> Login succeeds -> Identity shows [USER]
    // -------------------------------------------------------------
    console.log(`[TEST 6] Logging in with standard user email (${NORMAL_USER_EMAIL})...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const userSignInBtn = page.getByRole('button', { name: /Sign In/i });
    await userSignInBtn.click();
    await page.waitForTimeout(500);

    const userEmailInput = page.locator('input[type="email"]');
    await userEmailInput.fill(NORMAL_USER_EMAIL);

    const userSubmitBtn = page.getByRole('button', { name: /Sign In/i }).last();
    await userSubmitBtn.click();
    await page.waitForTimeout(1000);

    const userNavText = await page.textContent('header');
    assert.ok(userNavText?.includes(NORMAL_USER_EMAIL), `Navigation must show ${NORMAL_USER_EMAIL}`);
    assert.ok(userNavText?.includes('[USER]'), 'Navigation must display [USER] badge');
    console.log(`✓ TEST 6 Passed: Standard user login succeeds; UI displays ${NORMAL_USER_EMAIL} [USER].\n`);

    // -------------------------------------------------------------
    // TEST 7: Open /admin directly as USER -> ACCESS DENIED / 403
    // -------------------------------------------------------------
    console.log('[TEST 7] Attempting to open /admin directly as USER...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const accessDeniedHeading = page.getByText(/Access Denied/i);
    await assert.doesNotReject(accessDeniedHeading.waitFor({ state: 'visible', timeout: 5000 }), 'Must show Access Denied screen');

    const forbiddenNotice = page.getByText(/403 Forbidden/i);
    await assert.doesNotReject(forbiddenNotice.waitFor({ state: 'visible', timeout: 3000 }), 'Must display 403 Forbidden message');

    const userRoleIndicator = page.getByText(/\[USER\]/i).first();
    await assert.doesNotReject(userRoleIndicator.waitFor({ state: 'visible', timeout: 3000 }), 'Must show [USER] assigned role badge');
    console.log('✓ TEST 7 Passed: /admin is strictly blocked with ACCESS DENIED / 403 Forbidden for USER role.\n');

    // -------------------------------------------------------------
    // TEST 8: Directly call every /api/v1/admin/* endpoint as USER -> 403 Forbidden
    // -------------------------------------------------------------
    console.log('[TEST 8] Directly requesting every /api/v1/admin/* endpoint with USER token...');
    const userToken = await page.evaluate(() => localStorage.getItem('dhanya_auth_token') || localStorage.getItem('dhanya_admin_token'));
    assert.ok(userToken, 'User token must exist in localStorage');

    const protectedAdminEndpoints = [
      { method: 'GET', path: '/api/v1/admin/audit-logs' },
      { method: 'GET', path: '/api/v1/admin/audit-logs/verify-integrity' },
      { method: 'GET', path: '/api/v1/admin/health' },
      { method: 'GET', path: '/api/v1/admin/diagnostics' },
      { method: 'GET', path: '/api/v1/admin/users' },
      { method: 'PATCH', path: '/api/v1/admin/users/usr_001/status', body: { status: 'SUSPENDED' } },
    ];

    for (const reqConfig of protectedAdminEndpoints) {
      const res = reqConfig.method === 'GET'
        ? await page.request.get(`${BASE_URL}${reqConfig.path}`, {
            headers: { Authorization: `Bearer ${userToken}` },
          })
        : await page.request.patch(`${BASE_URL}${reqConfig.path}`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
            data: reqConfig.body,
          });

      assert.equal(
        res.status(),
        403,
        `Endpoint ${reqConfig.method} ${reqConfig.path} must return 403 FORBIDDEN for USER token (got ${res.status()})`
      );
      const json = await res.json();
      assert.equal(json.code, 'FORBIDDEN', `Response code must be FORBIDDEN`);
    }
    console.log('✓ TEST 8 Passed: All 6 /api/v1/admin/* endpoints strictly return 403 FORBIDDEN to USER.\n');

    // -------------------------------------------------------------
    // TEST 9: Client role escalation attempt (USER + role=ADMIN) -> Server still creates USER
    // -------------------------------------------------------------
    console.log('[TEST 9] Attempting client role escalation attack (sending role="ADMIN" for non-admin email)...');
    const attackRes = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'attacker@example.com',
        role: 'ADMIN',
        isAdmin: true,
        isOwner: true,
      },
    });
    assert.equal(attackRes.status(), 200, 'Login should succeed');
    const attackJson = await attackRes.json();
    assert.equal(
      attackJson.data.user.role,
      'USER',
      'Server MUST ignore client role payload and strictly assign USER role'
    );

    // Verify token issued to attacker cannot access /admin
    const attackerToken = attackJson.data.token;
    const attackerAdminCheck = await page.request.get(`${BASE_URL}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    assert.equal(attackerAdminCheck.status(), 403, 'Escalation token must receive 403 on /admin endpoints');
    console.log('✓ TEST 9 Passed: Client role escalation safely neutralized by server-authoritative role engine.\n');

    // -------------------------------------------------------------
    // TEST 10: Refresh both ADMIN and USER sessions -> Roles remain server-authoritative
    // -------------------------------------------------------------
    console.log('[TEST 10] Testing session refresh & persistence across page reload for both ADMIN and USER...');
    // 10a. Switch back to Admin
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Open Auth modal by clicking identity badge in nav
    const navIdentityBtn = page.locator('header button[title="Account Authentication"]');
    await navIdentityBtn.click();
    await page.waitForTimeout(400);

    // Sign out from standard user session
    const modalSignOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    if (await modalSignOutBtn.isVisible()) {
      await modalSignOutBtn.click();
      await page.waitForTimeout(400);
    }

    // Sign in as Admin
    const adminEmailField = page.locator('input[type="email"]');
    await adminEmailField.fill(ADMIN_EMAIL);
    const adminSignInBtn = page.getByRole('button', { name: /Sign In/i }).last();
    await adminSignInBtn.click();
    await page.waitForTimeout(800);

    // Reload page as ADMIN
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const refreshedAdminNav = await page.textContent('header');
    assert.ok(refreshedAdminNav?.includes(ADMIN_EMAIL), 'Admin email must persist after reload');
    assert.ok(refreshedAdminNav?.includes('[ADMIN]'), '[ADMIN] role badge must persist after reload');

    // 10b. Switch to USER and test reload persistence
    await navIdentityBtn.click();
    await page.waitForTimeout(400);

    const userModalSignOut = page.getByRole('button', { name: /Sign Out/i }).first();
    if (await userModalSignOut.isVisible()) {
      await userModalSignOut.click();
      await page.waitForTimeout(400);
    }

    await page.locator('input[type="email"]').fill(NORMAL_USER_EMAIL);
    await page.getByRole('button', { name: /Sign In/i }).last().click();
    await page.waitForTimeout(800);

    // Reload page as USER
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const refreshedUserNav = await page.textContent('header');
    assert.ok(refreshedUserNav?.includes(NORMAL_USER_EMAIL), 'User email must persist after reload');
    assert.ok(refreshedUserNav?.includes('[USER]'), '[USER] role badge must persist after reload');

    console.log('✓ TEST 10 Passed: Both ADMIN and USER session persistence and restoration are strictly server-authoritative.\n');

    console.log('================================================================');
    console.log('=== ALL 10 PLAYWRIGHT BROWSER QA TESTS COMPLETED GREEN! 🚀 =====');
    console.log('================================================================\n');

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runBrowserQATests().catch((err) => {
  console.error('\n❌ Playwright Browser QA Failed:', err);
  process.exit(1);
});
