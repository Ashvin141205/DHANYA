import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function runDotenvLoadingRegression() {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dhanya-dotenv-'));

  try {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      [
        'DHANYA_ENV="development"',
        'DHANYA_ENABLE_DEV_AUTH="true"',
        'DHANYA_AUTH_PROVIDER="dev"',
        'DHANYA_AUTH_SECRET="abcdefghijklmnopqrstuvwxyz123456"',
        'DHANYA_ADMIN_EMAIL="custom-admin@dhanya.com"',
      ].join('\n')
    );

    process.chdir(tempDir);
    delete process.env.DHANYA_ENV;
    delete process.env.DHANYA_ENABLE_DEV_AUTH;
    delete process.env.DHANYA_AUTH_PROVIDER;
    delete process.env.DHANYA_AUTH_SECRET;
    delete process.env.DHANYA_ADMIN_EMAIL;

    const configModuleUrl = new URL(`../src/config/auth.config.ts?test=${Date.now()}`, import.meta.url).href;
    const { getAuthConfig } = await import(configModuleUrl);
    const config = getAuthConfig();

    assert.equal(config.authorizedAdminEmail, 'custom-admin@dhanya.com');
    console.log('✓ Dotenv regression test passed: admin email loaded from .env file.');
  } finally {
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

runDotenvLoadingRegression().catch((error) => {
  console.error('Dotenv regression test failed:', error);
  process.exit(1);
});
