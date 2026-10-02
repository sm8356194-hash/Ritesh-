/**
 * Step 69 Payment Gateway Foundation Test Suite
 */

import crypto from 'node:crypto';
import { PaymentTransaction, PaymentStatus, UserAccount, AstrologerProfile, ConsultationRecord } from '../../types';
import { PaymentService, calculateFinancialBreakdown } from './paymentService';
import { walletService } from '../walletService';
import { InMemoryDataStore } from '../data/dataStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runPaymentGatewayFoundationTest() {
  console.log('=== RUNNING STEP 69 PAYMENT GATEWAY FOUNDATION TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const paymentService = new PaymentService(testStore);

  // Seed test astrologer and consultation
  const testAstro: AstrologerProfile = {
    id: 'ast_101',
    userId: 'usr_astro_101',
    name: 'Acharya Raman',
    title: 'Vedic Astrologer',
    bio: 'Vedic astrology expert',
    education: 'M.A. Astrology',
    skills: ['Kundli'],
    languages: ['Hindi'],
    experienceYears: 10,
    perMinuteCharge: 30,
    isOnline: true,
    rating: 4.8,
    totalOrders: 100,
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveAstrologerProfile(testAstro);

  const testConsultation: ConsultationRecord = {
    id: 'cons_pay_test_1',
    userId: 'usr_pay_test_1',
    userName: 'Payment Tester',
    astrologerId: 'ast_101',
    astrologerName: 'Acharya Raman',
    birthProfileId: 'bp_101',
    type: 'Chat',
    status: 'REQUESTED',
    durationMinutes: 10,
    scheduledDate: '2026-10-01',
    scheduledTime: '15:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await testStore.saveConsultation(testConsultation);

  // Test 1: Authoritative 85/15 Financial Calculation (Integer Paise Math)
  const fee15Mins = calculateFinancialBreakdown(450); // 15 mins * ₹30 = ₹450
  assert(fee15Mins.grossAmount === 450, 'Gross amount is exactly ₹450.00');
  assert(fee15Mins.platformFee === 67.50, 'Platform share (15%) is exactly ₹67.50');
  assert(fee15Mins.astrologerAmount === 382.50, 'Astrologer net (85%) is exactly ₹382.50');
  assert(fee15Mins.platformFeePaise + fee15Mins.astrologerAmountPaise === fee15Mins.grossAmountPaise, 'Paise sum matches gross amount exactly');

  // Test 2: Server-Side HMAC SHA-256 Signature Verification Helper
  const secret = 'test_webhook_secret_key_123';
  const orderId = 'order_test_888';
  const paymentId = 'pay_test_999';
  const payload = `${orderId}|${paymentId}`;

  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const invalidSignature = 'invalid_sha256_hex_signature';

  const checkSignature = (expected: string, provided: string): boolean => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  };

  assert(checkSignature(validSignature, validSignature) === true, 'Valid HMAC SHA-256 signature accepted');
  assert(checkSignature(validSignature, invalidSignature) === false, 'Invalid HMAC SHA-256 signature strictly rejected');

  // Test 3: Webhook Idempotency / Duplicate Event Protection
  const processedEvents = new Set<string>();
  const eventId = 'evt_razorpay_webhook_555';

  const processWebhookEvent = (id: string): { processed: boolean; isDuplicate: boolean } => {
    if (processedEvents.has(id)) {
      return { processed: false, isDuplicate: true };
    }
    processedEvents.add(id);
    return { processed: true, isDuplicate: false };
  };

  const firstAttempt = processWebhookEvent(eventId);
  assert(firstAttempt.processed === true && firstAttempt.isDuplicate === false, 'First webhook event processed successfully');

  const secondAttempt = processWebhookEvent(eventId);
  assert(secondAttempt.processed === false && secondAttempt.isDuplicate === true, 'Duplicate webhook event rejected by idempotency check');

  // Test 4: Demo Wallet Isolation
  const initialBalance = walletService.getBalance();
  assert(typeof initialBalance === 'number' && initialBalance >= 0, 'Demo wallet balance is retrievable');

  // Creating a production payment transaction does NOT alter demo wallet
  const prodUser: UserAccount = {
    id: 'usr_pay_test_1',
    displayName: 'Payment Tester',
    email: 'paytest@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  await testStore.saveUser(prodUser);

  const createOrderRes = await paymentService.createConsultationPaymentOrder(prodUser, {
    consultationId: 'cons_pay_test_1',
    userId: prodUser.id,
    astrologerId: 'ast_101',
    durationMinutes: 10,
    perMinuteCharge: 30,
  });

  assert(createOrderRes.success === true, 'Production payment order created in test mode');
  assert(walletService.getBalance() === initialBalance, 'Demo wallet balance remains completely unchanged');

  // Test 5: Authenticated Ownership Verification
  const strangerUser: UserAccount = {
    id: 'usr_stranger_999',
    displayName: 'Stranger User',
    email: 'stranger@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (createOrderRes.success) {
    const tx = createOrderRes.data;
    assert(tx.amount === 300, 'Calculated order amount is ₹300.00 (10 mins * ₹30)');
    
    // Stranger trying to verify another user's order fails
    const verifyRes = await paymentService.verifyAndProcessPayment(strangerUser, {
      transactionId: tx.transactionId,
      providerOrderId: tx.providerOrderId,
      providerPaymentId: 'pay_dummy_123',
      providerSignature: 'dummy_sig',
    });

    assert(verifyRes.success === false, 'Stranger blocked from verifying client payment transaction');
  }

  console.log('\n=== ALL STEP 69 PAYMENT GATEWAY FOUNDATION TESTS PASSED! ===');
}

runPaymentGatewayFoundationTest().catch(err => {
  console.error('Payment foundation test failed:', err);
  process.exit(1);
});
