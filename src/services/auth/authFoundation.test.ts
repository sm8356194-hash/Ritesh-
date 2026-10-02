/**
 * Step 67 Real Authentication & User Account Foundation Test Suite
 */

import { authService } from './authService';
import { UserAccount } from '../../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runAuthFoundationTest() {
  console.log('=== RUNNING STEP 67 AUTH FOUNDATION TEST SUITE ===\n');

  // Test 1: Provider Status Report
  const providerStatus = authService.getAuthProviderStatus();
  assert(providerStatus.layer === 'FIREBASE_AUTH', 'Provider status returns FIREBASE_AUTH layer');
  assert(providerStatus.isProductionConfigured === true, 'isProductionConfigured flag is true');
  assert(providerStatus.providers?.emailPassword === 'CONFIGURED BUT NOT VERIFIED', 'Email/password status matches CONFIGURED BUT NOT VERIFIED');
  assert(providerStatus.providers?.googleOAuth === 'CONFIGURED BUT NOT VERIFIED', 'Google status matches CONFIGURED BUT NOT VERIFIED');
  assert(providerStatus.providers?.phoneOtp === 'CONFIGURED BUT NOT VERIFIED / DEMO ONLY', 'Phone OTP status matches CONFIGURED BUT NOT VERIFIED / DEMO ONLY');

  // Test 2: Auth Mode Determination
  authService.setCurrentUser(null);
  assert(authService.getAuthMode() === 'DEMO', 'Unauthenticated or default session resolves to DEMO mode');
  assert(authService.isDemoMode() === true, 'isDemoMode() returns true when no user is logged in');

  // Test 3: Demo User Persona
  const demoUser: UserAccount = {
    id: 'usr_demo_123',
    displayName: 'Demo Client User',
    email: 'client@demo.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    provider: 'demo',
    isDemoUser: true,
  };
  authService.setCurrentUser(demoUser);
  assert(authService.getAuthMode() === 'DEMO', 'Demo user persona evaluates to DEMO mode');
  assert(authService.isDemoMode() === true, 'isDemoMode() returns true for demo user');

  // Test 4: Authenticated Production User Persona
  const prodUser: UserAccount = {
    id: 'usr_prod_456',
    displayName: 'Real Authenticated User',
    email: 'user@production.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    provider: 'email',
    isDemoUser: false,
  };
  authService.setCurrentUser(prodUser);
  assert(authService.getAuthMode() === 'AUTHENTICATED', 'Production user evaluates to AUTHENTICATED mode');
  assert(authService.isDemoMode() === false, 'isDemoMode() returns false for production user');

  // Test 5: Route Protection Helper
  assert(authService.canAccessSection(prodUser, 'overview') === true, 'Regular user can access client overview section');
  assert(authService.canAccessSection(prodUser, 'admin') === false, 'Regular client blocked from admin section');
  assert(authService.canAccessSection(prodUser, 'astrologer-workspace') === false, 'Regular client blocked from astrologer workspace');

  const adminUser: UserAccount = { ...prodUser, id: 'admin_789', role: 'ADMIN' };
  assert(authService.canAccessSection(adminUser, 'admin') === true, 'Admin user authorized to access admin section');

  const astrologerUser: UserAccount = { ...prodUser, id: 'astro_789', role: 'ASTROLOGER' };
  assert(authService.canAccessSection(astrologerUser, 'astrologer-workspace') === true, 'Astrologer authorized to access astrologer workspace');

  // Cleanup
  authService.setCurrentUser(null);

  console.log('\n=== ALL STEP 67 AUTH FOUNDATION TESTS PASSED! ===');
}

runAuthFoundationTest().catch(err => {
  console.error('Auth foundation test failed:', err);
  process.exit(1);
});
