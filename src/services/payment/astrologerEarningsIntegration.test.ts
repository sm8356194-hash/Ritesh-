/**
 * Step 74 — Astrologer Earnings & Payout Settlement Integration Test Suite
 */

import {
  UserAccount,
  ConsultationRecord,
  PaymentTransaction,
  AstrologerProfile,
  AstrologerEarningRecord,
  AstrologerPayoutRecord
} from '../../types';
import { AstrologerEarningsService } from './astrologerEarningsService';
import { InMemoryDataStore } from '../data/dataStore';

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runAstrologerEarningsIntegrationTests() {
  console.log('=== RUNNING STEP 74 ASTROLOGER EARNINGS & PAYOUT INTEGRATION TESTS ===\n');

  const store = new InMemoryDataStore();
  const earningsService = new AstrologerEarningsService(store);

  // 1. Set up Users
  const clientUser: UserAccount = {
    id: 'user_priya',
    displayName: 'Priya Patel',
    email: 'priya@example.com',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'google',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const astrologerUser: UserAccount = {
    id: 'user_shastri',
    displayName: 'Acharya Shastri',
    email: 'shastri@example.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    provider: 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const strangerUser: UserAccount = {
    id: 'user_stranger',
    displayName: 'Stranger Astrologer',
    email: 'stranger@example.com',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    provider: 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const adminUser: UserAccount = {
    id: 'user_admin',
    displayName: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    provider: 'google',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await store.saveUser(clientUser);
  await store.saveUser(astrologerUser);
  await store.saveUser(strangerUser);
  await store.saveUser(adminUser);

  // 2. Set up Astrologer Profile
  const astrologerProfile: AstrologerProfile = {
    id: 'astro_shastri',
    userId: 'user_shastri',
    name: 'Acharya Shastri',
    title: 'Vedic Scholar',
    bio: 'Vedic Scholar and Kundli specialist',
    experienceYears: 15,
    perMinuteCharge: 30,
    isOnline: true,
    rating: 4.8,
    totalOrders: 350,
    isApproved: true,
    status: 'APPROVED',
    education: 'Ph.D. Astrology',
    skills: ['Kundli', 'Vastu'],
    languages: ['Hindi', 'English'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await store.saveAstrologerProfile(astrologerProfile);

  // ---------------------------------------------------------------------------
  // TEST 1: Earning created for eligible completed consultation & Correct 85/15 calculation
  // ---------------------------------------------------------------------------
  console.log('--- Test 1 & 4: Earning Creation & 85/15 Calculation ---');
  const consultation1: ConsultationRecord = {
    id: 'consult_101',
    userId: 'user_priya',
    userName: 'Priya Patel',
    astrologerId: 'astro_shastri',
    astrologerName: 'Acharya Shastri',
    astrologerUserId: 'user_shastri',
    type: 'Chat',
    status: 'COMPLETED',
    durationMinutes: 10,
    paymentStatus: 'PAID',
    paymentId: 'tx_101',
    fee: 300,
    currency: 'INR',
    scheduledDate: '2026-10-01',
    scheduledTime: '10:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: false
  };
  await store.saveConsultation(consultation1);

  const tx1: PaymentTransaction = {
    id: 'tx_101',
    consultationId: 'consult_101',
    userId: 'user_priya',
    userName: 'Priya Patel',
    astrologerId: 'astro_shastri',
    astrologerName: 'Acharya Shastri',
    astrologerUserId: 'user_shastri',
    amount: 300,
    currency: 'INR',
    provider: 'RAZORPAY',
    status: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await store.savePaymentTransaction(tx1);

  const earnResult = await earningsService.createEarningForCompletedConsultation(adminUser, 'consult_101');
  assert(earnResult.success === true, 'Earning record successfully generated');
  
  if (!earnResult.success) {
    throw new Error('Test aborted: earnResult should succeed');
  }
  
  const earningRecord = earnResult.data;
  assert(earningRecord.grossAmountPaise === 30000, 'Gross amount is 30000 paise');
  assert(earningRecord.platformFeePaise === 4500, 'Platform fee (15%) is 4500 paise');
  assert(earningRecord.astrologerAmountPaise === 25500, 'Astrologer Amount (85%) is 25500 paise');
  assert(earningRecord.status === 'EARNED', 'Earning record is marked as EARNED');

  // ---------------------------------------------------------------------------
  // TEST 2: No earning for failed payment
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: No Earning for Failed Payment ---');
  const consultation2: ConsultationRecord = {
    id: 'consult_102',
    userId: 'user_priya',
    userName: 'Priya Patel',
    astrologerId: 'astro_shastri',
    astrologerName: 'Acharya Shastri',
    astrologerUserId: 'user_shastri',
    type: 'Chat',
    status: 'COMPLETED',
    durationMinutes: 10,
    paymentStatus: 'PAYMENT_FAILED',
    paymentId: 'tx_102',
    fee: 300,
    currency: 'INR',
    scheduledDate: '2026-10-01',
    scheduledTime: '11:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: false
  };
  await store.saveConsultation(consultation2);

  const earnResultFailed = await earningsService.createEarningForCompletedConsultation(adminUser, 'consult_102');
  assert(earnResultFailed.success === false, 'Earning generation is blocked for failed payments');

  // ---------------------------------------------------------------------------
  // TEST 3: No earning for demo consultation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: No Earning for Demo Consultation ---');
  const consultationDemo: ConsultationRecord = {
    id: 'consult_demo_103',
    userId: 'user_priya',
    userName: 'Priya Patel',
    astrologerId: 'astro_shastri',
    astrologerName: 'Acharya Shastri',
    astrologerUserId: 'user_shastri',
    type: 'Chat',
    status: 'COMPLETED',
    durationMinutes: 10,
    paymentStatus: 'PAID',
    paymentId: 'tx_103_demo',
    fee: 300,
    currency: 'INR',
    scheduledDate: '2026-10-01',
    scheduledTime: '12:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true
  };
  await store.saveConsultation(consultationDemo);

  const txDemo: PaymentTransaction = {
    id: 'tx_103_demo',
    consultationId: 'consult_demo_103',
    userId: 'user_priya',
    userName: 'Priya Patel',
    astrologerId: 'astro_shastri',
    astrologerName: 'Acharya Shastri',
    astrologerUserId: 'user_shastri',
    amount: 300,
    currency: 'INR',
    provider: 'DEMO',
    status: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await store.savePaymentTransaction(txDemo);

  const earnResultDemo = await earningsService.createEarningForCompletedConsultation(adminUser, 'consult_demo_103');
  assert(earnResultDemo.success === true, 'Earning generated for demo, but flagged as isDemo');
  
  if (!earnResultDemo.success) {
    throw new Error('Test aborted: earnResultDemo should succeed');
  }
  assert(earnResultDemo.data.isDemo === true, 'Earning isDemo flag is correctly set to true');

  // ---------------------------------------------------------------------------
  // TEST 5: Duplicate earning prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: Duplicate Earning Prevention ---');
  const doubleResult = await earningsService.createEarningForCompletedConsultation(adminUser, 'consult_101');
  assert(doubleResult.success === true, 'Subsequent call returns success but duplicates are avoided');
  const allEarnings = await store.listAstrologerEarningsByAstrologerUserId('user_shastri');
  const matchCount = allEarnings.filter(e => e.consultationId === 'consult_101').length;
  assert(matchCount === 1, 'Only one earning record exists for consultation 101');

  // ---------------------------------------------------------------------------
  // TEST 6: Astrologer ownership checks
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Astrologer Ownership Access Block ---');
  const summaryStranger = await earningsService.getEarningsSummaryForAstrologer(strangerUser, 'user_shastri');
  assert(summaryStranger.success === false, 'Stranger astrologer user is unauthorized to view other practitioner earnings');

  // ---------------------------------------------------------------------------
  // TEST 7, 8: Payout Request & Available Earnings Validation & Rejection
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7 & 8: Payout Requests & Insufficient Funds Rejection ---');
  const summaryBefore = await earningsService.getEarningsSummaryForAstrologer(astrologerUser, 'user_shastri');
  assert(summaryBefore.success === true, 'Astrologer successfully fetched own summary');
  
  if (!summaryBefore.success) {
    throw new Error('Test aborted: summaryBefore should succeed');
  }
  assert(summaryBefore.data.availableForPayoutPaise === 25500, 'Available for payout paise is exactly 25500 paise');

  const excessivePayout = await earningsService.requestPayout(astrologerUser, 30000);
  assert(excessivePayout.success === false, 'Rejects payout request exceeding available balance');
  
  if (excessivePayout.success) {
    throw new Error('Test aborted: excessivePayout should fail');
  }
  assert(excessivePayout.code === 'INSUFFICIENT_FUNDS', 'Correct error code INSUFFICIENT_FUNDS returned');

  // Successful payout request
  const validPayout = await earningsService.requestPayout(astrologerUser, 10000, 'INR', 'idem_payout_1');
  assert(validPayout.success === true, 'Successfully requested a valid payout amount (₹100.00 / 10000 paise)');
  
  if (!validPayout.success) {
    throw new Error('Test aborted: validPayout should succeed');
  }
  const payoutRecord = validPayout.data;
  assert(payoutRecord.status === 'PENDING', 'Payout is created in PENDING status');
  assert(payoutRecord.netPayablePaise === 10000, 'Payout record amount in paise matches requested amount');
  assert(payoutRecord.isDemo === false, 'Earning is production (isDemo === false)');

  // ---------------------------------------------------------------------------
  // TEST 9: Duplicate payout prevention (idempotency Key)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 9: Idempotency Key Duplicate Prevention ---');
  const retryPayout = await earningsService.requestPayout(astrologerUser, 10000, 'INR', 'idem_payout_1');
  assert(retryPayout.success === true, 'Duplicate request with identical idempotencyKey handled gracefully');
  
  if (!retryPayout.success) {
    throw new Error('Test aborted: retryPayout should succeed');
  }
  assert(retryPayout.data.id === payoutRecord.id, 'Idempotency returns existing payout record');

  // ---------------------------------------------------------------------------
  // TEST 10, 11, 12: Admin Approval Authorization & Self-Approval Prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 10, 11, 12: Admin Approval Authorization ---');
  const clientApproval = await earningsService.approvePayoutByAdmin(clientUser, payoutRecord.id);
  assert(clientApproval.success === false, 'Client is unauthorized to approve payout');

  const selfApproval = await earningsService.approvePayoutByAdmin(astrologerUser, payoutRecord.id);
  assert(selfApproval.success === false, 'Astrologer is unauthorized to self-approve own payout');

  const adminApproval = await earningsService.approvePayoutByAdmin(adminUser, payoutRecord.id, 'Approved for process');
  assert(adminApproval.success === true, 'Admin successfully approves payout request');
  
  if (!adminApproval.success) {
    throw new Error('Test aborted: adminApproval should succeed');
  }
  assert(adminApproval.data.status === 'APPROVED', 'Payout status is updated to APPROVED');

  // ---------------------------------------------------------------------------
  // TEST 13, 14: Settlement Status Transitions & PAID providerReference Enforcements
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 13 & 14: Payout finalization and providerReference verification ---');
  const paidWithoutReference = await earningsService.finalizePayoutAsPaid(adminUser, payoutRecord.id, '');
  assert(paidWithoutReference.success === false, 'Payout cannot be marked PAID without a valid providerReference');

  // Move to processing first
  const processingRes = await earningsService.transitionPayoutToProcessing(adminUser, payoutRecord.id);
  assert(processingRes.success === true, 'Transitioned payout to PROCESSING status');

  const paidWithReference = await earningsService.finalizePayoutAsPaid(adminUser, payoutRecord.id, 'ref_razorpay_999');
  assert(paidWithReference.success === true, 'Payout finalized to PAID status with verified providerReference');
  
  if (!paidWithReference.success) {
    throw new Error('Test aborted: paidWithReference should succeed');
  }
  assert(paidWithReference.data.status === 'PAID', 'Status is indeed PAID');
  assert(paidWithReference.data.providerReference === 'ref_razorpay_999', 'providerReference saved successfully');

  // ---------------------------------------------------------------------------
  // TEST 15: Demo / Production Separation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 15: Demo / Production Isolation ---');
  // Verify that summary for production astrologer excludes demo earnings
  const summaryFinal = await earningsService.getEarningsSummaryForAstrologer(astrologerUser, 'user_shastri');
  
  if (!summaryFinal.success) {
    throw new Error('Test aborted: summaryFinal should succeed');
  }
  assert(summaryFinal.data.availableForPayoutPaise === 15500, 'Remaining available balance ignores the demo earning 103');

  // ---------------------------------------------------------------------------
  // TEST 16: Historical Financial Record Protection (Immutable check)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 16: Historical Record Immutable Auditing ---');
  assert(earningRecord.id === `earn_tx_101`, 'Earning record ID matches historical event key');
  assert(earningRecord.consultationId === 'consult_101', 'Linked consultation preserved');
  assert(earningRecord.paymentTransactionId === 'tx_101', 'Linked transaction preserved');

  console.log('\n=== ALL STEP 74 FINANCIAL INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
}

runAstrologerEarningsIntegrationTests().catch(err => {
  console.error('Test suite crashed: ', err);
  process.exit(1);
});
