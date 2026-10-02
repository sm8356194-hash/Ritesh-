/**
 * Production Wallet Service (Step 70)
 * 
 * Provides server-authoritative wallet balance management and immutable transaction ledgers
 * backed by authenticated Firebase user identities and Firestore records.
 */

import {
  UserAccount,
  ProductionWallet,
  ProductionWalletTransaction,
  ServiceResult,
  WalletTransactionSource,
} from '../../types';
import { DataStore, globalDataStore } from '../data/dataStore';

export interface CreditWalletInput {
  paymentTransactionId: string;
  amountPaise: number;
  description: string;
  source?: WalletTransactionSource;
  provider?: string;
  providerReference?: string;
}

export interface DebitWalletInput {
  consultationId: string;
  amountPaise: number;
  description: string;
  source?: WalletTransactionSource;
}

export class ProductionWalletService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Retrieves or initializes a production wallet for the authenticated user.
   */
  public async getOrCreateWallet(
    requestingUser: UserAccount | null
  ): Promise<ServiceResult<ProductionWallet>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to access production wallet.',
        code: 'UNAUTHENTICATED',
      };
    }

    let wallet = await this.dataStore.getProductionWallet(requestingUser.id);
    if (!wallet) {
      const now = new Date().toISOString();
      wallet = {
        userId: requestingUser.id,
        balancePaise: 0,
        balance: 0.0,
        currency: 'INR',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      await this.dataStore.saveProductionWallet(wallet);
    }

    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * Returns authoritative wallet balance for authenticated user.
   */
  public async getWalletBalance(
    requestingUser: UserAccount | null
  ): Promise<ServiceResult<{ balancePaise: number; balance: number; currency: string }>> {
    const walletRes = await this.getOrCreateWallet(requestingUser);
    if (!walletRes.success) {
      return walletRes;
    }

    return {
      success: true,
      data: {
        balancePaise: walletRes.data.balancePaise,
        balance: walletRes.data.balance,
        currency: walletRes.data.currency,
      },
    };
  }

  /**
   * Credits production wallet driven by server-verified payment or refund event.
   * Includes strict idempotency check to prevent duplicate credits.
   */
  public async creditWalletFromPayment(
    requestingUser: UserAccount | null,
    input: CreditWalletInput
  ): Promise<ServiceResult<{ wallet: ProductionWallet; transaction: ProductionWalletTransaction }>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to credit wallet.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (input.amountPaise <= 0) {
      return {
        success: false,
        error: 'Credit amount must be greater than zero.',
        code: 'INVALID_AMOUNT',
      };
    }

    // Idempotency check: look for existing transaction with paymentTransactionId
    const existingTxs = await this.dataStore.listProductionWalletTransactionsByUserId(requestingUser.id);
    const existingCredit = existingTxs.find(
      t => t.paymentTransactionId === input.paymentTransactionId && t.type === 'CREDIT'
    );

    const currentWalletRes = await this.getOrCreateWallet(requestingUser);
    if (!currentWalletRes.success) {
      return currentWalletRes;
    }

    if (existingCredit) {
      return {
        success: true,
        data: {
          wallet: currentWalletRes.data,
          transaction: existingCredit,
        },
      };
    }

    const now = new Date().toISOString();
    const newBalancePaise = currentWalletRes.data.balancePaise + input.amountPaise;
    const newBalance = newBalancePaise / 100;

    const updatedWallet: ProductionWallet = {
      ...currentWalletRes.data,
      balancePaise: newBalancePaise,
      balance: newBalance,
      updatedAt: now,
    };

    const wtxId = `wtx_cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTransaction: ProductionWalletTransaction = {
      id: wtxId,
      userId: requestingUser.id,
      type: 'CREDIT',
      amountPaise: input.amountPaise,
      amount: input.amountPaise / 100,
      balanceAfterPaise: newBalancePaise,
      balanceAfter: newBalance,
      source: input.source || 'PAYMENT_GATEWAY',
      description: input.description,
      paymentTransactionId: input.paymentTransactionId,
      provider: input.provider || 'RAZORPAY',
      providerReference: input.providerReference,
      status: 'SUCCESS',
      createdAt: now,
      isDemo: false,
    };

    await this.dataStore.saveProductionWallet(updatedWallet);
    const savedTx = await this.dataStore.saveProductionWalletTransaction(newTransaction);

    return {
      success: true,
      data: {
        wallet: updatedWallet,
        transaction: savedTx,
      },
    };
  }

  /**
   * Debits production wallet for consultation fee with server-authoritative balance check.
   * Strictly prevents negative balances or duplicate debits.
   */
  public async debitWalletForConsultation(
    requestingUser: UserAccount | null,
    input: DebitWalletInput
  ): Promise<ServiceResult<{ wallet: ProductionWallet; transaction: ProductionWalletTransaction }>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to debit wallet.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (input.amountPaise <= 0) {
      return {
        success: false,
        error: 'Debit amount must be greater than zero.',
        code: 'INVALID_AMOUNT',
      };
    }

    // Idempotency check: prevent duplicate debits for the same consultation
    const existingTxs = await this.dataStore.listProductionWalletTransactionsByUserId(requestingUser.id);
    const existingDebit = existingTxs.find(
      t => t.consultationId === input.consultationId && t.type === 'DEBIT'
    );

    const currentWalletRes = await this.getOrCreateWallet(requestingUser);
    if (!currentWalletRes.success) {
      return currentWalletRes;
    }

    if (existingDebit) {
      return {
        success: true,
        data: {
          wallet: currentWalletRes.data,
          transaction: existingDebit,
        },
      };
    }

    // Insufficient funds check
    if (currentWalletRes.data.balancePaise < input.amountPaise) {
      const requiredRs = (input.amountPaise / 100).toFixed(2);
      const availableRs = (currentWalletRes.data.balancePaise / 100).toFixed(2);
      return {
        success: false,
        error: `Insufficient wallet balance. Required: ₹${requiredRs}, Available: ₹${availableRs}. Please top up your wallet.`,
        code: 'INSUFFICIENT_FUNDS',
      };
    }

    const now = new Date().toISOString();
    const newBalancePaise = currentWalletRes.data.balancePaise - input.amountPaise;
    const newBalance = newBalancePaise / 100;

    const updatedWallet: ProductionWallet = {
      ...currentWalletRes.data,
      balancePaise: newBalancePaise,
      balance: newBalance,
      updatedAt: now,
    };

    const wtxId = `wtx_deb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTransaction: ProductionWalletTransaction = {
      id: wtxId,
      userId: requestingUser.id,
      type: 'DEBIT',
      amountPaise: input.amountPaise,
      amount: input.amountPaise / 100,
      balanceAfterPaise: newBalancePaise,
      balanceAfter: newBalance,
      source: input.source || 'CONSULTATION_DEBIT',
      description: input.description,
      consultationId: input.consultationId,
      status: 'SUCCESS',
      createdAt: now,
      isDemo: false,
    };

    await this.dataStore.saveProductionWallet(updatedWallet);
    const savedTx = await this.dataStore.saveProductionWalletTransaction(newTransaction);

    return {
      success: true,
      data: {
        wallet: updatedWallet,
        transaction: savedTx,
      },
    };
  }

  /**
   * Retrieves production wallet transaction ledger for authenticated user.
   */
  public async listWalletTransactions(
    requestingUser: UserAccount | null,
    targetUserId?: string
  ): Promise<ServiceResult<ProductionWalletTransaction[]>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to list wallet transactions.',
        code: 'UNAUTHENTICATED',
      };
    }

    const userId = targetUserId || requestingUser.id;
    if (requestingUser.id !== userId && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Cannot view another user\'s wallet transactions.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const txs = await this.dataStore.listProductionWalletTransactionsByUserId(userId);
    return {
      success: true,
      data: txs,
    };
  }
}

export const productionWalletService = new ProductionWalletService();
