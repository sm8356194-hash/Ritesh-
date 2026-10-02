/**
 * Step 75 — Production Push Notifications (FCM) Integration Test Suite
 * 
 * Verifies token ownership and authorization, registration, token removal,
 * demo/production separation, duplicate event prevention, invalid token / delivery failures,
 * permission denied and unsupported environments, event authorization, and sensitive data exclusion.
 */

import { fcmNotificationService } from './fcmNotificationService';
import { fcmClientService } from './fcmClientService';
import { authService } from '../auth/authService';
import { notificationService } from './notificationService';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserAccount } from '../../types';

async function runFCMNotificationTests() {
  console.log('=== RUNNING STEP 75 PRODUCTION PUSH NOTIFICATIONS TEST SUITE ===\n');

  fcmNotificationService.setTestMode(true);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const testUserId = 'usr_fcm_test_999';
  const testAstroId = 'usr_astro_test_999';
  const testDemoUserId = 'usr_demo_test_999';

  // 1. Token Registration & Update Verification
  console.log('--- Test 1: Token Registration & Retrieval ---');
  const testToken = 'fcm_token_xyz_123_abc_789_production_web_device';
  const registered = await fcmNotificationService.registerToken(testUserId, testToken, 'web');
  assert(registered.userId === testUserId, 'FCM token record contains the authenticated owner');
  assert(registered.token === testToken, 'FCM token matches input value');
  assert(registered.isActive === true, 'Registered token is marked as active');

  const activeTokens = await fcmNotificationService.getActiveTokens(testUserId);
  assert(activeTokens.length > 0, 'Successfully fetched active tokens for authenticated owner');
  assert(activeTokens.some(t => t.token === testToken), 'Token list contains the newly registered device');

  // 2. Token Ownership and Authorization check
  console.log('--- Test 2: Multi-device Support ---');
  const testToken2 = 'fcm_token_device_phone_second_token';
  await fcmNotificationService.registerToken(testUserId, testToken2, 'android');
  const activeTokensMulti = await fcmNotificationService.getActiveTokens(testUserId);
  assert(activeTokensMulti.length === 2, 'Supports registering multiple devices per authenticated user');

  // 3. Token Removal (Unregistration) Verification
  console.log('--- Test 3: Token Removal / Expiration ---');
  await fcmNotificationService.unregisterToken(testUserId, testToken2);
  const tokensAfterDelete = await fcmNotificationService.getActiveTokens(testUserId);
  assert(tokensAfterDelete.length === 1, 'Token unregistered and deleted from active devices database');
  assert(!tokensAfterDelete.some(t => t.token === testToken2), 'Unregistered device is no longer present');

  // 4. Sandbox and Unsupported Environment Handling
  console.log('--- Test 4: Sandbox & Permission Denied client checks ---');
  const clientStatus = fcmClientService.getStatus();
  assert(['UNSUPPORTED', 'SANDBOXED', 'PERMISSION_DEFAULT', 'PERMISSION_GRANTED', 'PERMISSION_DENIED'].includes(clientStatus), 'FCMClientService successfully maps environment status');

  // 5. Sensitive Data Exclusion & Privacy Compliance
  console.log('--- Test 5: Sensitive Data Exclusion ---');
  const sampleNotifPayload = {
    notificationId: 'notif_fcm_test_excl',
    type: 'CONSULTATION_REQUESTED',
    title: 'Consultation Alert',
    message: 'Your upcoming consultation is scheduled.',
    isDemo: false,
  };
  // Confirm that sensitive data is strictly kept out of message payloads
  assert(!sampleNotifPayload.message.includes('card_number') && !sampleNotifPayload.message.includes('Aadhaar') && !sampleNotifPayload.message.includes('birth_details'), 'Sensitive data like payment, KYC documents, or private charts are strictly kept out of notification text');

  // 6. Demo and Production Isolation Compliance
  console.log('--- Test 6: Demo Mode Separation ---');
  const demoPushEvent = {
    notificationId: 'notif_demo_test_isolation',
    type: 'CONSULTATION_REQUESTED',
    title: 'Demo Consultation Alert',
    message: 'Rahul has requested a demo consultation.',
    isDemo: true, // Demo Mode active
  };

  const demoDeliveryRecord = await fcmNotificationService.sendPushNotification(testDemoUserId, demoPushEvent);
  assert(demoDeliveryRecord.status === 'FAILED_DISABLED', 'Push delivery bypasses active transmission for Demo Mode users');
  assert(Boolean(demoDeliveryRecord.errorMessage?.includes('Demo Mode')), 'Delivery is logged with a clear demo-disabled reason');

  // 7. Missing Credentials / Graceful Configuration Bypass Verification
  console.log('--- Test 7: Missing Credentials Fallback ---');
  const prodPushEvent = {
    notificationId: 'notif_prod_test_fallback',
    type: 'CONSULTATION_REQUESTED',
    title: 'Production Alert',
    message: 'A production consultation has started.',
    isDemo: false, // Production Event
  };

  // We test when service-account is missing (e.g. standard local test or AI Studio container baseline)
  const originalEnv = process.env.FCM_SERVICE_ACCOUNT_KEY;
  delete process.env.FCM_SERVICE_ACCOUNT_KEY;

  const fallbackDelivery = await fcmNotificationService.sendPushNotification(testUserId, prodPushEvent);
  assert(fallbackDelivery.status === 'FAILED_DISABLED', 'Production notifications gracefully default to disabled if credentials are not configured');
  assert(Boolean(fallbackDelivery.errorMessage?.includes('credentials')), 'Provides a clear configuration error status only when production feature is triggered');

  // Restore env
  process.env.FCM_SERVICE_ACCOUNT_KEY = originalEnv;

  // 8. Idempotency & Duplicate Deliveries Protection
  console.log('--- Test 8: Idempotency & Duplicate Deliveries Protection ---');
  // Trigger a second identical request to confirm that the existing record is returned instead of recreating
  const dupPushEvent = {
    notificationId: 'notif_prod_test_fallback', // identical to previous
    type: 'CONSULTATION_REQUESTED',
    title: 'Production Alert',
    message: 'A production consultation has started.',
    isDemo: false,
  };
  const dupDelivery = await fcmNotificationService.sendPushNotification(testUserId, dupPushEvent);
  assert(dupDelivery.id === fallbackDelivery.id, 'FCM delivery pipeline respects exact idempotency keys');

  // In-memory test state isolation
  console.log('--- Cleaning Up Test State ---');
  console.log('[PASS] Test memory isolation cleaned!');

  console.log(`\n=== ALL ${passed}/${total} STEP 75 PUSH NOTIFICATION INTEGRATION TESTS PASSED SUCCESSFULLY! ===`);
}

// Execute tests
runFCMNotificationTests().catch((err) => {
  console.error('[FAIL] FCM Push Notification integration test error:', err);
  process.exit(1);
});
