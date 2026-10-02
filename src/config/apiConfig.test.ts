/**
 * API Configuration & Health Check Test Suite
 */

import { getApiBaseUrl, getAppEnvironment, isProductionEnvironment } from './apiConfig';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runApiConfigTest() {
  console.log('=== RUNNING API CONFIGURATION TEST SUITE ===\n');

  const baseUrl = getApiBaseUrl();
  assert(typeof baseUrl === 'string' && baseUrl.length > 0, `ApiBaseUrl resolved: "${baseUrl}"`);

  const appEnv = getAppEnvironment();
  assert(typeof appEnv === 'string', `AppEnvironment resolved: "${appEnv}"`);

  const isProd = isProductionEnvironment();
  assert(typeof isProd === 'boolean', `isProductionEnvironment boolean check: ${isProd}`);

  console.log('\n=== ALL API CONFIGURATION TESTS PASSED! ===');
}

runApiConfigTest().catch(err => {
  console.error('API Config test failed:', err);
  process.exit(1);
});
