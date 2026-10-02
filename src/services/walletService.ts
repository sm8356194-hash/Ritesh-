/**
 * Wallet Service for Client Demo Balance Management
 * 
 * Provides unified, reactive wallet state management across:
 * - Home Dashboard
 * - Header Balance Badge
 * - Consultation Request Modal
 * - Add Money Modal
 * 
 * Top-ups and transactions are clearly marked as simulated demo data.
 */

import { authService } from './auth/authService';
import { globalDataStore } from './data/dataStore';

const WALLET_STORAGE_KEY = 'demo_client_wallet_balance';
const WALLET_TX_STORAGE_KEY = 'demo_client_wallet_transactions';
const DEFAULT_INITIAL_BALANCE = 250.00; // Default ₹250 for prototype demo

type WalletListener = (balance: number) => void;

export interface WalletTransaction {
  transactionId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: string;
  balanceAfter: number;
  consultationId?: string;
  isDemo: boolean;
}

class WalletService {
  private listeners: WalletListener[] = [];
  private txListeners: ((txs: WalletTransaction[]) => void)[] = [];
  private currentBalance: number;
  private transactions: WalletTransaction[] = [];

  constructor() {
    this.currentBalance = this.loadStoredBalance();
    this.transactions = this.loadStoredTransactions();
  }

  private loadStoredBalance(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(WALLET_STORAGE_KEY);
        if (stored !== null) {
          const parsed = parseFloat(stored);
          if (!isNaN(parsed) && parsed >= 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Ignore
    }
    return DEFAULT_INITIAL_BALANCE;
  }

  private persistBalance(balance: number): void {
    this.currentBalance = balance;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(WALLET_STORAGE_KEY, balance.toFixed(2));
      }
    } catch (e) {
      // Ignore
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentBalance);
      } catch (e) {
        console.error('Error in wallet listener:', e);
      }
    });
  }

  private loadStoredTransactions(): WalletTransaction[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(WALLET_TX_STORAGE_KEY);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Ignore
    }
    return [];
  }

  private persistTransactions(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(WALLET_TX_STORAGE_KEY, JSON.stringify(this.transactions));
      }
    } catch (e) {
      // Ignore
    }
    this.notifyTxListeners();
  }

  private notifyTxListeners(): void {
    this.txListeners.forEach(listener => {
      try {
        listener([...this.transactions]);
      } catch (e) {
        console.error('Error in wallet transaction listener:', e);
      }
    });
  }

  /**
   * Returns current client demo wallet balance in INR
   */
  public getBalance(): number {
    return this.currentBalance;
  }

  /**
   * Checks if available wallet balance covers the required amount
   */
  public hasSufficientBalance(requiredAmount: number): boolean {
    return this.currentBalance >= requiredAmount;
  }

  /**
   * Returns current transaction history list (newest first)
   */
  public getTransactions(): WalletTransaction[] {
    return [...this.transactions];
  }

  /**
   * Credits demo money to client wallet
   */
  public async addMoney(amount: number, description?: string): Promise<{ success: boolean; newBalance: number; message: string }> {
    if (amount <= 0) {
      return {
        success: false,
        newBalance: this.currentBalance,
        message: 'Please enter a valid top-up amount.',
      };
    }

    const newBalance = Math.round((this.currentBalance + amount) * 100) / 100;
    this.persistBalance(newBalance);

    // Save transaction history
    const txId = `tx_topup_${Date.now()}`;
    const txDesc = description || 'Wallet Top-Up (Demo)';
    const newTx: WalletTransaction = {
      transactionId: txId,
      type: 'CREDIT',
      amount,
      description: txDesc,
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance,
      isDemo: true,
    };
    this.transactions.unshift(newTx);
    this.persistTransactions();

    // Optionally create a payment transaction record if user logged in
    const user = authService.getCurrentUser();
    if (user) {
      try {
        await globalDataStore.savePaymentTransaction({
          id: txId,
          consultationId: 'WALLET_TOPUP',
          userId: user.id,
          userName: user.displayName,
          astrologerId: 'PLATFORM_WALLET',
          astrologerName: 'Demo Wallet Top-Up',
          amount,
          currency: 'INR',
          provider: 'DEMO_WALLET',
          status: 'PAID',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Non-fatal error logging wallet topup transaction:', e);
      }
    }

    return {
      success: true,
      newBalance,
      message: `Successfully credited ₹${amount.toFixed(2)} to your demo wallet.`,
    };
  }

  /**
   * Deducts amount from client wallet balance if sufficient funds exist
   */
  public deductBalance(amount: number, description?: string, consultationId?: string): { success: boolean; newBalance: number; error?: string } {
    if (amount <= 0) {
      return { success: true, newBalance: this.currentBalance };
    }

    if (this.currentBalance < amount) {
      return {
        success: false,
        newBalance: this.currentBalance,
        error: `Insufficient wallet balance. Available: ₹${this.currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}.`,
      };
    }

    const newBalance = Math.round((this.currentBalance - amount) * 100) / 100;
    this.persistBalance(newBalance);

    // Save transaction history
    const txId = `tx_debit_${Date.now()}`;
    const txDesc = description || 'Consultation Payment';
    const newTx: WalletTransaction = {
      transactionId: txId,
      type: 'DEBIT',
      amount,
      description: txDesc,
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance,
      consultationId: consultationId,
      isDemo: true,
    };
    this.transactions.unshift(newTx);
    this.persistTransactions();

    return {
      success: true,
      newBalance,
    };
  }

  /**
   * Resets wallet balance to default ₹250 and clears history
   */
  public resetBalance(): void {
    this.persistBalance(DEFAULT_INITIAL_BALANCE);
    this.transactions = [];
    this.persistTransactions();
  }

  /**
   * Subscribe to real-time wallet balance changes
   */
  public subscribe(listener: WalletListener): () => void {
    this.listeners.push(listener);
    // Immediately trigger listener with current balance
    listener(this.currentBalance);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to real-time transaction list changes
   */
  public subscribeTransactions(listener: (txs: WalletTransaction[]) => void): () => void {
    this.txListeners.push(listener);
    // Immediately trigger listener with current transaction list
    listener([...this.transactions]);

    return () => {
      this.txListeners = this.txListeners.filter(l => l !== listener);
    };
  }
}

export const walletService = new WalletService();
