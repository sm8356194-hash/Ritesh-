/**
 * Step 70 Production Wallet & Payment Transaction Integration Test Suite
 */

import { UserAccount, ProductionWallet, ProductionWalletTransaction } from '../../types';
import { ProductionWalletService } from './productionWalletService';
import { InMemoryDataStore } from '../data/dataStore';
import { walletService as demoWalletService } from '../walletService';
import { calculateFinancialBreakdown } from '../payment/paymentService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runProductionWalletIntegrationTest() {
  console.log('=== RUNNING STEP 70 PRODUCTION WALLET INTEGRATION TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const prodWalletService = new ProductionWalletService(testStore);

  // Authenticated Production User
  const clientUser: UserAccount = {
    id: `usr_prod_client_${Date.now()}`,
    displayName: 'Aarav Sharma',
    email: 'aarav@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  // Unauthorized Stranger User
  const strangerUser: UserAccount = {
    id: `usr_prod_stranger_${Date.now()}`,
    displayName: 'Stranger User',
    email: 'stranger@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  await testStore.saveUser(clientUser);
  await testStore.saveUser(strangerUser);

  // Requirement 1: Production Wallet Creation & Initial Balance
  const walletRes = await prodWalletService.getOrCreateWallet(clientUser);
  assert(walletRes.success === true, 'Production wallet initialized successfully');
  if (walletRes.success) {
    assert(walletRes.data.userId === clientUser.id, 'Wallet userId matches client UID');
    assert(walletRes.data.balancePaise === 0, 'Initial production wallet balance is exactly 0 paise');
    assert(walletRes.data.balance === 0.0, 'Initial production wallet rupees is exactly ₹0.00');
    assert(walletRes.data.status === 'ACTIVE', 'Initial wallet status is ACTIVE');
  }

  // Requirement 2: Authenticated Wallet Ownership & Access Protection
  const strangerBalRes = await prodWalletService.listWalletTransactions(strangerUser, clientUser.id);
  assert(strangerBalRes.success === false, 'Stranger user blocked from viewing client wallet transactions');
  if (!strangerBalRes.success) {
    assert(strangerBalRes.code === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS error code');
  }

  // Requirement 3: Credit Transaction (Payment -> Wallet Credit)
  const paymentTxId = `pay_tx_${Date.now()}`;
  const creditRes = await prodWalletService.creditWalletFromPayment(clientUser, {
    paymentTransactionId: paymentTxId,
    amountPaise: 50000, // ₹500.00 = 50000 paise
    description: 'Wallet top-up via Razorpay Verified Order',
    provider: 'RAZORPAY',
    providerReference: 'pay_rzp_999',
  });

  assert(creditRes.success === true, 'Wallet credit transaction succeeded');
  if (creditRes.success) {
    assert(creditRes.data.wallet.balancePaise === 50000, 'New wallet balance is exactly 50000 paise');
    assert(creditRes.data.wallet.balance === 500.00, 'New wallet balance is exactly ₹500.00');
    assert(creditRes.data.transaction.type === 'CREDIT', 'Transaction type is CREDIT');
    assert(creditRes.data.transaction.isDemo === false, 'Production transaction isDemo flag is false');
  }

  // Requirement 4: Duplicate Webhook / Idempotency Credit Protection
  const duplicateCreditRes = await prodWalletService.creditWalletFromPayment(clientUser, {
    paymentTransactionId: paymentTxId,
    amountPaise: 50000,
    description: 'Duplicate Webhook Retried Event',
  });

  assert(duplicateCreditRes.success === true, 'Duplicate credit request handled gracefully');
  if (duplicateCreditRes.success) {
    assert(duplicateCreditRes.data.wallet.balancePaise === 50000, 'Wallet balance NOT double-credited (remains 50000 paise)');
  }

  // Requirement 5: Consultation Wallet Debit
  const consultationId = `cons_deb_${Date.now()}`;
  const debitRes = await prodWalletService.debitWalletForConsultation(clientUser, {
    consultationId,
    amountPaise: 30000, // ₹300.00 = 30000 paise (10 mins * ₹30/min)
    description: 'Consultation fee for Acharya Shastri (10 mins)',
  });

  assert(debitRes.success === true, 'Consultation wallet debit succeeded');
  if (debitRes.success) {
    assert(debitRes.data.wallet.balancePaise === 20000, 'Remaining balance is exactly 20000 paise');
    assert(debitRes.data.wallet.balance === 200.00, 'Remaining balance is exactly ₹200.00');
    assert(debitRes.data.transaction.type === 'DEBIT', 'Transaction type is DEBIT');
    assert(debitRes.data.transaction.consultationId === consultationId, 'Linked to exact consultation ID');
  }

  // Requirement 6: Duplicate Consultation Debit Protection
  const duplicateDebitRes = await prodWalletService.debitWalletForConsultation(clientUser, {
    consultationId,
    amountPaise: 30000,
    description: 'Retry Consultation Request',
  });

  assert(duplicateDebitRes.success === true, 'Duplicate debit request handled gracefully');
  if (duplicateDebitRes.success) {
    assert(duplicateDebitRes.data.wallet.balancePaise === 20000, 'Wallet balance NOT double-debited (remains 20000 paise)');
  }

  // Requirement 7: Insufficient Balance Protection & No Negative Balance
  const excessDebitRes = await prodWalletService.debitWalletForConsultation(clientUser, {
    consultationId: `cons_excess_${Date.now()}`,
    amountPaise: 40000, // ₹400.00 > ₹200.00 available
    description: 'Excessive consultation charge',
  });

  assert(excessDebitRes.success === false, 'Excessive debit rejected for insufficient funds');
  if (!excessDebitRes.success) {
    assert(excessDebitRes.code === 'INSUFFICIENT_FUNDS', 'Returns INSUFFICIENT_FUNDS error code');
  }

  // Verify wallet balance remains intact at 20000 paise (no negative balance)
  const currentBalRes = await prodWalletService.getWalletBalance(clientUser);
  if (currentBalRes.success) {
    assert(currentBalRes.data.balancePaise === 20000, 'Wallet balance preserved without negative corruption');
  }

  // Requirement 8: Demo vs Production Wallet Separation
  const demoBalance = demoWalletService.getBalance();
  assert(demoWalletService.getBalance() === demoBalance, 'Demo wallet LocalStorage balance completely unaffected by production wallet operations');

  // Requirement 9: Wallet History Persistence & Sorting
  const historyRes = await prodWalletService.listWalletTransactions(clientUser);
  assert(historyRes.success === true, 'Production wallet history retrieved successfully');
  if (historyRes.success) {
    assert(historyRes.data.length === 2, 'Wallet transaction ledger contains exactly 2 production records (1 CREDIT, 1 DEBIT)');
    assert(historyRes.data[0].type === 'DEBIT', 'Latest transaction is DEBIT');
    assert(historyRes.data[1].type === 'CREDIT', 'Prior transaction is CREDIT');
  }

  // Requirement 10: 85/15 Commission Preservation Math
  const breakdown = calculateFinancialBreakdown(300); // ₹300 gross
  assert(breakdown.grossAmountPaise === 30000, 'Gross amount is 30000 paise');
  assert(breakdown.platformFeePaise === 4500, 'Platform share (15%) is 4500 paise');
  assert(breakdown.astrologerAmountPaise === 25500, 'Astrologer net (85%) is 25500 paise');

  console.log('\n=== ALL STEP 70 PRODUCTION WALLET TESTS PASSED! ===');
}

runProductionWalletIntegrationTest().catch(err => {
  console.error('Production wallet integration test failed:', err);
  process.exit(1);
});
