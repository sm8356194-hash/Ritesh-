/**
 * Wallet Service Test Suite
 * 
 * Verifies:
 * 1. Default initial balance is ₹250.00
 * 2. addMoney credits demo balance correctly
 * 3. deductBalance debits demo balance correctly when sufficient funds exist
 * 4. deductBalance rejects debit when insufficient funds exist
 * 5. hasSufficientBalance correctly evaluates requested amounts
 * 6. Subscriber receives real-time balance updates
 */

import { walletService } from './walletService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runWalletServiceTests() {
  console.log('=== RUNNING WALLET SERVICE TEST SUITE ===\n');

  // Reset balance to default ₹250
  walletService.resetBalance();

  const initialBalance = walletService.getBalance();
  assert(initialBalance === 250.00, `Initial wallet balance is ₹250.00 (received ₹${initialBalance})`);

  let notifiedBalance = 0;
  const unsubscribe = walletService.subscribe(bal => {
    notifiedBalance = bal;
  });

  assert(notifiedBalance === 250.00, `Subscriber notified of initial balance ₹${notifiedBalance}`);

  // Test 1: Sufficient balance check
  assert(walletService.hasSufficientBalance(200) === true, `hasSufficientBalance(200) is true for balance ₹250`);
  assert(walletService.hasSufficientBalance(300) === false, `hasSufficientBalance(300) is false for balance ₹250`);

  // Test 2: Add Money
  const addRes = await walletService.addMoney(200);
  assert(addRes.success === true, `addMoney(200) returned success`);
  assert(addRes.newBalance === 450.00, `New balance is ₹450.00`);
  assert(walletService.getBalance() === 450.00, `walletService.getBalance() confirms ₹450.00`);
  assert(notifiedBalance === 450.00, `Subscriber notified of updated balance ₹450.00`);

  // Test 3: Deduct balance with sufficient funds
  const deductRes = walletService.deductBalance(375.00);
  assert(deductRes.success === true, `deductBalance(375) returned success`);
  assert(deductRes.newBalance === 75.00, `New balance after deduction is ₹75.00`);
  assert(walletService.getBalance() === 75.00, `walletService.getBalance() confirms ₹75.00`);

  // Test 4: Deduct balance with insufficient funds
  const failedDeductRes = walletService.deductBalance(100.00);
  assert(failedDeductRes.success === false, `deductBalance(100) rejected when balance is ₹75.00`);
  assert(failedDeductRes.newBalance === 75.00, `Balance remains unchanged at ₹75.00`);

  // Cleanup
  walletService.resetBalance();
  unsubscribe();

  console.log('\n=== ALL WALLET SERVICE TESTS PASSED! ===');
}

runWalletServiceTests().catch(err => {
  console.error('Wallet service test failed:', err);
  process.exit(1);
});
