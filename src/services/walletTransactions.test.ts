/**
 * Wallet Transactions Test Suite
 * 
 * Verifies:
 * 1. Credit transaction creation
 * 2. Debit transaction creation
 * 3. balanceAfter calculation
 * 4. transaction persistence
 * 5. transaction retrieval
 * 6. insufficient balance does not create an invalid debit
 * 7. real-time transaction updates
 */

import { walletService } from './walletService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTransactionsTest() {
  console.log('=== RUNNING WALLET TRANSACTIONS LEDGER TEST SUITE ===\n');

  // Reset wallet state
  walletService.resetBalance();

  // Test 1: Check initial empty transaction history
  const initialTxs = walletService.getTransactions();
  assert(initialTxs.length === 0, 'Initial transaction history is empty');

  // Test 2: Credit transaction creation & balanceAfter calculation & real-time updates
  let updatedTxsCount = 0;
  const unsubscribeTxs = walletService.subscribeTransactions((txs) => {
    updatedTxsCount = txs.length;
  });

  const topupRes = await walletService.addMoney(150, 'Top-Up ₹150 for testing');
  assert(topupRes.success === true, 'addMoney successful');
  assert(topupRes.newBalance === 400.00, 'Balance increased from 250 to 400');

  const txsAfterTopup = walletService.getTransactions();
  assert(txsAfterTopup.length === 1, 'Transaction history contains 1 record');
  assert(txsAfterTopup[0].type === 'CREDIT', 'Transaction type is CREDIT');
  assert(txsAfterTopup[0].amount === 150, 'Transaction amount is 150');
  assert(txsAfterTopup[0].balanceAfter === 400.00, 'balanceAfter is calculated correctly (400.00)');
  assert(txsAfterTopup[0].description === 'Top-Up ₹150 for testing', 'Transaction description preserved');
  assert(txsAfterTopup[0].isDemo === true, 'isDemo is true');
  assert(updatedTxsCount === 1, 'Subscriber received real-time transaction count update (1)');

  // Test 3: Debit transaction creation
  const debitRes = walletService.deductBalance(100, 'Consultation payment for testing', 'cons_test_abc');
  assert(debitRes.success === true, 'deductBalance successful');
  assert(debitRes.newBalance === 300.00, 'Balance decreased from 400 to 300');

  const txsAfterDebit = walletService.getTransactions();
  assert(txsAfterDebit.length === 2, 'Transaction history contains 2 records');
  assert(txsAfterDebit[0].type === 'DEBIT', 'Latest transaction is DEBIT');
  assert(txsAfterDebit[0].amount === 100, 'Latest transaction amount is 100');
  assert(txsAfterDebit[0].balanceAfter === 300.00, 'balanceAfter is calculated correctly (300.00)');
  assert(txsAfterDebit[0].consultationId === 'cons_test_abc', 'consultationId correctly linked');
  assert(updatedTxsCount === 2, 'Subscriber received real-time transaction count update (2)');

  // Test 4: Insufficient balance does not create an invalid debit
  const failedDebitRes = walletService.deductBalance(500, 'High value consultation', 'cons_fail_123');
  assert(failedDebitRes.success === false, 'deductBalance rejected due to insufficient funds');
  
  const txsAfterFailedDebit = walletService.getTransactions();
  assert(txsAfterFailedDebit.length === 2, 'Transaction history remains at 2 (no invalid debit added)');

  // Cleanup
  unsubscribeTxs();
  walletService.resetBalance();

  console.log('\n=== ALL WALLET TRANSACTIONS LEDGER TESTS PASSED! ===');
}

runTransactionsTest().catch(err => {
  console.error('Wallet transactions test failed:', err);
  process.exit(1);
});
