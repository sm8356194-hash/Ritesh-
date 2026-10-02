/**
 * Centralized Payment Service
 * 
 * Manages financial billing data models, idempotency, audit logging, refund workflows,
 * and integration with consultation lifecycle states.
 */

import {
  UserAccount,
  PaymentTransaction,
  PaymentStatus,
  PaymentAuditLog,
  PaymentEarningsBreakdown,
  ServiceResult,
  ConsultationRecord,
  AppSettingsRecord,
  AstrologerEarningRecord,
  PlatformEarningRecord,
  AstrologerPayoutRecord,
  SettlementPreviewResult,
  PayoutStatus,
} from '../../types';

import {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
  RefundRequestInput,
  PaymentOrderResult,
  PaymentVerificationResult,
  RefundResult,
} from './paymentTypes';

import { getApiBaseUrl } from '../../config/apiConfig';
import { DataStore, globalDataStore } from '../data/dataStore';

export function calculateFinancialBreakdown(grossRupees: number, platformFeePercent: number = 15) {
  const grossAmountPaise = Math.round(grossRupees * 100);
  const platformFeePaise = Math.round((grossAmountPaise * platformFeePercent) / 100);
  const astrologerAmountPaise = Math.max(0, grossAmountPaise - platformFeePaise);

  return {
    grossAmount: grossAmountPaise / 100,
    grossAmountPaise,
    platformFee: platformFeePaise / 100,
    platformFeePaise,
    platformFeePercent,
    astrologerAmount: astrologerAmountPaise / 100,
    astrologerAmountPaise,
    currency: 'INR',
  };
}

export function calculateRefundBreakdown(
  grossRupees: number,
  refundRupees: number,
  platformFeePercent: number = 15
) {
  const grossAmountPaise = Math.round(grossRupees * 100);
  const refundPaise = Math.min(grossAmountPaise, Math.round(refundRupees * 100));
  const platformFeeRefundPaise = Math.round((refundPaise * platformFeePercent) / 100);
  const astrologerAdjustmentPaise = Math.max(0, refundPaise - platformFeeRefundPaise);

  return {
    refundAmount: refundPaise / 100,
    refundPaise,
    platformFeeRefund: platformFeeRefundPaise / 100,
    platformFeeRefundPaise,
    astrologerAdjustment: astrologerAdjustmentPaise / 100,
    astrologerAdjustmentPaise,
    currency: 'INR',
  };
}

export class PaymentService {
  private dataStore: DataStore;
  public readonly isServerVerificationConfigured: boolean = true; // Server-side verification layer connected

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Calculates authoritative consultation price based on astrologer profile and duration.
   */
  public async calculateAuthoritativeFee(
    astrologerId: string,
    durationMinutes: number
  ): Promise<{ fee: number; currency: string; ratePerMinute: number }> {
    const astrologer = await this.dataStore.getAstrologerProfileById(astrologerId);
    const ratePerMinute = astrologer?.perMinuteCharge && astrologer.perMinuteCharge > 0 ? astrologer.perMinuteCharge : 15;
    const minutes = Math.max(5, durationMinutes);
    const appSettings = await this.dataStore.getAppSettings();
    const currency = appSettings.currency || 'INR';
    const fee = Math.max(appSettings.minConsultationPrice || 10, minutes * ratePerMinute);

    return {
      fee,
      currency,
      ratePerMinute,
    };
  }

  /**
   * Creates a secure payment transaction order for a consultation via server backend.
   * Enforces server-side authoritative pricing and idempotency.
   */
  public async createConsultationPaymentOrder(
    requestingUser: UserAccount | null,
    params: CreatePaymentOrderInput
  ): Promise<ServiceResult<PaymentOrderResult>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to create a payment order.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (requestingUser.id !== params.userId && requestingUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Cannot create payment order for another user.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    // Attempt Server API endpoint call
    try {
      const response = await fetch(`${getApiBaseUrl()}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: params.consultationId,
          userId: requestingUser.id,
          astrologerId: params.astrologerId,
          durationMinutes: params.durationMinutes,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.order) {
          return {
            success: true,
            data: json.order,
          };
        }
      }
    } catch (e) {
      console.warn('Server payment order creation endpoint failed, attempting fallback store creation:', e);
    }

    // Fallback local/dataStore implementation
    const consultation = await this.dataStore.getConsultationById(params.consultationId);
    if (!consultation) {
      return {
        success: false,
        error: `Consultation '${params.consultationId}' not found.`,
        code: 'CONSULTATION_NOT_FOUND',
      };
    }

    const existingTx = await this.dataStore.getPaymentTransactionByConsultationId(params.consultationId);
    if (existingTx) {
      if (existingTx.status === 'PAID') {
        return {
          success: false,
          error: 'Consultation is already paid.',
          code: 'ALREADY_PAID',
        };
      }
      if (existingTx.status === 'PAYMENT_PENDING') {
        return {
          success: true,
          data: {
            transactionId: existingTx.id,
            consultationId: existingTx.consultationId,
            amount: existingTx.amount,
            currency: existingTx.currency,
            provider: existingTx.provider,
            providerOrderId: existingTx.providerOrderId || `ord_${existingTx.id}`,
            status: existingTx.status,
            isServerVerificationRequired: true,
          },
        };
      }
    }

    const priceCalculation = await this.calculateAuthoritativeFee(params.astrologerId, params.durationMinutes);
    const now = new Date().toISOString();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const providerOrderId = `ord_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const transaction: PaymentTransaction = {
      id: txId,
      consultationId: params.consultationId,
      userId: requestingUser.id,
      userName: requestingUser.displayName,
      astrologerId: params.astrologerId,
      astrologerName: params.astrologerName || consultation.astrologerName,
      astrologerUserId: params.astrologerUserId || consultation.astrologerUserId,
      amount: priceCalculation.fee,
      currency: priceCalculation.currency,
      provider: 'PENDING_CONFIG',
      providerOrderId,
      status: 'PAYMENT_PENDING',
      createdAt: now,
      updatedAt: now,
      idempotencyKey: params.idempotencyKey || `idem_${params.consultationId}`,
    };

    const savedTx = await this.dataStore.savePaymentTransaction(transaction);

    const auditLog: PaymentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: savedTx.id,
      consultationId: savedTx.consultationId,
      eventType: 'PAYMENT_ORDER_CREATED',
      actorId: requestingUser.id,
      details: `Payment order created for amount ${savedTx.currency} ${savedTx.amount}`,
      timestamp: now,
    };
    await this.dataStore.savePaymentAuditLog(auditLog);

    await this.dataStore.updateConsultation(params.consultationId, {
      paymentStatus: 'PAYMENT_PENDING',
      paymentId: savedTx.id,
      fee: savedTx.amount,
      currency: savedTx.currency,
      priceSnapshot: {
        fee: priceCalculation.fee,
        currency: priceCalculation.currency,
        ratePerMinute: priceCalculation.ratePerMinute,
        durationMinutes: params.durationMinutes,
      },
    });

    return {
      success: true,
      data: {
        transactionId: savedTx.id,
        consultationId: savedTx.consultationId,
        amount: savedTx.amount,
        currency: savedTx.currency,
        provider: savedTx.provider,
        providerOrderId: savedTx.providerOrderId!,
        status: savedTx.status,
        isServerVerificationRequired: true,
      },
    };
  }

  /**
   * Attempts server-side payment verification via POST /api/payment/verify.
   * Enforces zero-trust principle: Server signature and order validation are strictly required.
   */
  public async verifyAndProcessPayment(
    requestingUser: UserAccount | null,
    params: VerifyPaymentInput
  ): Promise<ServiceResult<PaymentVerificationResult>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: params.transactionId,
          providerOrderId: params.providerOrderId,
          providerPaymentId: params.providerPaymentId,
          providerSignature: params.providerSignature,
          consultationId: params.consultationId,
          userId: requestingUser.id,
        }),
      });

      const json = await response.json();
      if (response.ok && json.success && json.verification) {
        return {
          success: true,
          data: json.verification,
        };
      }

      return {
        success: false,
        error: json.error || 'Server payment verification failed.',
        code: json.code || 'VERIFICATION_FAILED',
      };
    } catch (e: any) {
      console.error('Payment verification server error:', e);
      return {
        success: false,
        error: e?.message || 'Failed to reach payment verification server.',
        code: 'SERVER_UNREACHABLE',
      };
    }
  }

  /**
   * Admin-authorized manual reconciliation for development/test environments.
   * Marks a transaction as PAID and records earnings breakdown idempotently.
   */
  public async reconcilePaymentForAdminTest(
    adminUser: UserAccount | null,
    transactionId: string,
    providerPaymentId?: string
  ): Promise<ServiceResult<PaymentVerificationResult>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only Admin can perform manual payment reconciliation.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const tx = await this.dataStore.getPaymentTransactionById(transactionId);
    if (!tx) {
      return { success: false, error: 'Transaction not found.', code: 'TRANSACTION_NOT_FOUND' };
    }

    if (tx.status === 'PAID') {
      const existingBreakdown = tx.earningsBreakdown || {
        grossAmount: tx.amount,
        platformFee: Math.round(tx.amount * 0.15),
        astrologerAmount: Math.round(tx.amount * 0.85),
        currency: tx.currency,
      };
      return {
        success: true,
        data: {
          transactionId: tx.id,
          consultationId: tx.consultationId,
          status: 'PAID',
          paidAt: tx.paidAt || tx.updatedAt,
          earningsBreakdown: existingBreakdown,
        },
      };
    }

    const now = new Date().toISOString();
    const appSettings = await this.dataStore.getAppSettings();
    const commissionPercent = appSettings.platformCommissionPercent || 15;
    const platformFee = Math.round((tx.amount * commissionPercent) / 100);
    const astrologerAmount = Math.max(0, tx.amount - platformFee);

    const earningsBreakdown: PaymentEarningsBreakdown = {
      grossAmount: tx.amount,
      platformFee,
      astrologerAmount,
      currency: tx.currency,
    };

    const updatedTx = await this.dataStore.updatePaymentTransaction(tx.id, {
      status: 'PAID',
      providerPaymentId: providerPaymentId || `pay_sim_${Date.now()}`,
      paidAt: now,
      earningsBreakdown,
    });

    // Update Consultation document
    await this.dataStore.updateConsultation(tx.consultationId, {
      paymentStatus: 'PAID',
      paymentId: tx.id,
    });

    // Audit Log
    const auditLog: PaymentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: tx.id,
      consultationId: tx.consultationId,
      eventType: 'PAYMENT_VERIFIED',
      actorId: adminUser.id,
      details: `Payment verified via Admin Reconciliation for ${tx.currency} ${tx.amount}`,
      timestamp: now,
    };
    await this.dataStore.savePaymentAuditLog(auditLog);

    return {
      success: true,
      data: {
        transactionId: updatedTx!.id,
        consultationId: updatedTx!.consultationId,
        status: 'PAID',
        paidAt: now,
        earningsBreakdown,
      },
    };
  }

  /**
   * Process refund request (Admin authorized).
   */
  public async processRefund(
    adminUser: UserAccount | null,
    params: RefundRequestInput
  ): Promise<ServiceResult<RefundResult>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only Admin can process payment refunds.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const tx = await this.dataStore.getPaymentTransactionById(params.transactionId);
    if (!tx) {
      return { success: false, error: 'Transaction not found.', code: 'TRANSACTION_NOT_FOUND' };
    }

    if (tx.status !== 'PAID') {
      return {
        success: false,
        error: `Cannot refund transaction in status '${tx.status}'. Must be PAID.`,
        code: 'INVALID_TRANSACTION_STATUS',
      };
    }

    const refundAmount = params.amount && params.amount > 0 ? Math.min(params.amount, tx.amount) : tx.amount;
    const isPartial = refundAmount < tx.amount;
    const newStatus: PaymentStatus = isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
    const now = new Date().toISOString();

    const updatedTx = await this.dataStore.updatePaymentTransaction(tx.id, {
      status: newStatus,
      refundAmount,
      refundedAt: now,
    });

    // Update consultation
    await this.dataStore.updateConsultation(tx.consultationId, {
      paymentStatus: newStatus,
    });

    // Audit Log
    const auditLog: PaymentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: tx.id,
      consultationId: tx.consultationId,
      eventType: 'REFUND_VERIFIED',
      actorId: adminUser.id,
      details: `Refund processed (${newStatus}): ${tx.currency} ${refundAmount}. Reason: ${params.reason}`,
      timestamp: now,
    };
    await this.dataStore.savePaymentAuditLog(auditLog);

    return {
      success: true,
      data: {
        transactionId: updatedTx!.id,
        consultationId: updatedTx!.consultationId,
        status: newStatus,
        refundedAmount: refundAmount,
        refundedAt: now,
      },
    };
  }

  /**
   * Retrieves transaction by consultation ID.
   */
  public async getTransactionByConsultationId(
    requestingUser: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<PaymentTransaction | null>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const tx = await this.dataStore.getPaymentTransactionByConsultationId(consultationId);
    if (!tx) {
      return { success: true, data: null };
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isClient = tx.userId === requestingUser.id;
    const isAstrologer = tx.astrologerUserId === requestingUser.id || tx.astrologerId === requestingUser.id;

    if (!isClient && !isAstrologer && !isAdmin) {
      return { success: false, error: 'Unauthorized access to transaction.', code: 'UNAUTHORIZED_ACCESS' };
    }

    return { success: true, data: tx };
  }

  /**
   * Lists transactions for client user.
   */
  public async listUserTransactions(
    requestingUser: UserAccount | null
  ): Promise<ServiceResult<PaymentTransaction[]>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const txs = await this.dataStore.listPaymentTransactionsByUserId(requestingUser.id);
    return { success: true, data: txs };
  }

  /**
   * Lists transactions for astrologer.
   */
  public async listAstrologerTransactions(
    requestingUser: UserAccount | null,
    astrologerId: string
  ): Promise<ServiceResult<PaymentTransaction[]>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(astrologerId);
    const isAstrologer = (astrologer?.userId === requestingUser.id) || (astrologerId === requestingUser.id);
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isAstrologer && !isAdmin) {
      return { success: false, error: 'Unauthorized access.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const txs = await this.dataStore.listPaymentTransactionsByAstrologerId(astrologerId);
    return { success: true, data: txs };
  }

  /**
   * Admin list all transactions.
   */
  public async listAllTransactionsForAdmin(
    adminUser: UserAccount | null
  ): Promise<ServiceResult<PaymentTransaction[]>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const txs = await this.dataStore.listAllPaymentTransactions();
    return { success: true, data: txs };
  }

  /**
   * Get audit logs for transaction.
   */
  public async getAuditLogsForTransaction(
    adminUser: UserAccount | null,
    transactionId: string
  ): Promise<ServiceResult<PaymentAuditLog[]>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const logs = await this.dataStore.listPaymentAuditLogsByTransactionId(transactionId);
    return { success: true, data: logs };
  }

  /**
   * Retrieves earnings for an astrologer.
   */
  public async listAstrologerEarnings(
    requestingUser: UserAccount | null,
    astrologerUserId: string
  ): Promise<ServiceResult<AstrologerEarningRecord[]>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isSelf = requestingUser.id === astrologerUserId;

    if (!isSelf && !isAdmin) {
      return { success: false, error: 'Unauthorized to view these earnings.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const earnings = await this.dataStore.listAstrologerEarningsByAstrologerUserId(astrologerUserId);
    return { success: true, data: earnings };
  }

  /**
   * Admin list all platform earnings.
   */
  public async listAllPlatformEarnings(
    adminUser: UserAccount | null
  ): Promise<ServiceResult<PlatformEarningRecord[]>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const earnings = await this.dataStore.listAllPlatformEarnings();
    return { success: true, data: earnings };
  }

  /**
   * Admin list all astrologer earnings.
   */
  public async listAllAstrologerEarnings(
    adminUser: UserAccount | null
  ): Promise<ServiceResult<AstrologerEarningRecord[]>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const earnings = await this.dataStore.listAllAstrologerEarnings();
    return { success: true, data: earnings };
  }

  // ==========================================================================
  // STEP 23 — PAYOUT & SETTLEMENT ARCHITECTURE FOUNDATION METHODS
  // ==========================================================================

  /**
   * Previews settlement amount for an astrologer for a period without creating a record.
   * Derives payable ONLY from authoritative astrologer_earnings ledger in integer paise.
   */
  public async previewSettlementForAstrologer(
    adminUser: UserAccount | null,
    astrologerUserId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ServiceResult<SettlementPreviewResult>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin privileges required.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const astrologer = await this.dataStore.getAstrologerProfileById(astrologerUserId) || 
                       await this.dataStore.getAstrologerProfileByUserId(astrologerUserId);

    const astrologerName = astrologer?.name || 'Astrologer';

    // 1. Get all earnings for this astrologer
    const allEarnings = await this.dataStore.listAstrologerEarningsByAstrologerUserId(astrologerUserId);

    // 2. Get all existing payouts to identify already settled/included earning IDs
    const existingPayouts = await this.dataStore.listAllAstrologerPayouts();
    const alreadySettledEarningIds = new Set<string>();
    for (const p of existingPayouts) {
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        (p.earningRecordIds || []).forEach(id => alreadySettledEarningIds.add(id));
      }
    }

    // 3. Filter eligible earnings not previously included
    const eligibleEarnings = allEarnings.filter(e => {
      if (alreadySettledEarningIds.has(e.id)) return false;
      if (e.status === 'PENDING' || e.status === 'REVERSED') return false;
      // Date filter check if provided
      if (periodStart && e.createdAt.substring(0, 10) < periodStart) return false;
      if (periodEnd && e.createdAt.substring(0, 10) > periodEnd) return false;
      return true;
    });

    let grossEarningsPaise = 0;
    let refundAdjustmentsPaise = 0;

    eligibleEarnings.forEach(e => {
      const gPaise = e.grossAmountPaise || Math.round(e.grossAmount * 100);
      const rPaise = e.refundAdjustmentPaise || Math.round((e.refundAdjustment || 0) * 100);
      const aPaise = e.astrologerAmountPaise || Math.round(e.astrologerAmount * 100);

      grossEarningsPaise += aPaise;
      refundAdjustmentsPaise += rPaise;
    });

    const netPayablePaise = Math.max(0, grossEarningsPaise - refundAdjustmentsPaise);

    return {
      success: true,
      data: {
        astrologerUserId,
        astrologerId: astrologer?.id || astrologerUserId,
        astrologerName,
        earningPeriodStart: periodStart || 'Beginning',
        earningPeriodEnd: periodEnd || 'Current',
        grossEarnings: grossEarningsPaise / 100,
        grossEarningsPaise,
        refundAdjustments: refundAdjustmentsPaise / 100,
        refundAdjustmentsPaise,
        netPayable: netPayablePaise / 100,
        netPayablePaise,
        currency: 'INR',
        eligibleEarningRecordIds: eligibleEarnings.map(e => e.id),
        consultationCount: eligibleEarnings.length,
      },
    };
  }

  /**
   * Admin creates a settlement payout record in PENDING state.
   */
  public async createSettlementPayout(
    adminUser: UserAccount | null,
    params: {
      astrologerUserId: string;
      periodStart: string;
      periodEnd: string;
      adminNote?: string;
    }
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin privileges required.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const previewRes = await this.previewSettlementForAstrologer(
      adminUser,
      params.astrologerUserId,
      params.periodStart,
      params.periodEnd
    );

    if (!previewRes.success) {
      return { success: false, error: previewRes.error, code: previewRes.code };
    }

    const preview = previewRes.data;

    if (preview.eligibleEarningRecordIds.length === 0) {
      return {
        success: false,
        error: 'No eligible unsettled earnings found for the selected period.',
        code: 'NO_ELIGIBLE_EARNINGS',
      };
    }

    const now = new Date().toISOString();
    const payoutId = `payout_${params.astrologerUserId}_${Date.now()}`;

    const newPayout: AstrologerPayoutRecord = {
      id: payoutId,
      astrologerUserId: params.astrologerUserId,
      astrologerId: preview.astrologerId,
      astrologerName: preview.astrologerName,
      earningPeriodStart: params.periodStart || 'Beginning',
      earningPeriodEnd: params.periodEnd || 'Current',
      grossEarnings: preview.grossEarnings,
      grossEarningsPaise: preview.grossEarningsPaise,
      refundAdjustments: preview.refundAdjustments,
      refundAdjustmentsPaise: preview.refundAdjustmentsPaise,
      netPayable: preview.netPayable,
      netPayablePaise: preview.netPayablePaise,
      currency: 'INR',
      status: 'PENDING',
      earningRecordIds: preview.eligibleEarningRecordIds,
      consultationCount: preview.consultationCount,
      createdAt: now,
      updatedAt: now,
      adminNote: params.adminNote || 'Admin initiated settlement creation',
    };

    const savedPayout = await this.dataStore.saveAstrologerPayout(newPayout);

    // Audit Log
    const auditLog: PaymentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: `payout_tx_${payoutId}`,
      consultationId: 'SETTLEMENT',
      payoutId,
      eventType: 'PAYOUT_CREATED',
      actorId: adminUser.id,
      details: `Settlement payout '${payoutId}' created in PENDING status for ${preview.currency} ${preview.netPayable}`,
      timestamp: now,
    };
    await this.dataStore.savePaymentAuditLog(auditLog);

    return { success: true, data: savedPayout };
  }

  /**
   * Admin advances payout status along state machine path:
   * PENDING -> APPROVED -> PROCESSING -> PAID
   * Failure path: PROCESSING -> FAILED -> PENDING
   * Cancellation path: PENDING -> CANCELLED
   */
  public async updatePayoutStatus(
    adminUser: UserAccount | null,
    params: {
      payoutId: string;
      newStatus: PayoutStatus;
      adminNote?: string;
      failureReason?: string;
    }
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin privileges required.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const payout = await this.dataStore.getAstrologerPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: `Payout record '${params.payoutId}' not found.`, code: 'PAYOUT_NOT_FOUND' };
    }

    const current = payout.status;
    const next = params.newStatus;

    // Validate State Machine Transitions
    const isValidTransition = 
      (current === 'PENDING' && (next === 'APPROVED' || next === 'CANCELLED')) ||
      (current === 'APPROVED' && (next === 'PROCESSING' || next === 'CANCELLED')) ||
      (current === 'PROCESSING' && (next === 'PAID' || next === 'FAILED')) ||
      (current === 'FAILED' && next === 'PENDING');

    if (!isValidTransition) {
      return {
        success: false,
        error: `Invalid payout state transition from '${current}' to '${next}'.`,
        code: 'INVALID_STATE_TRANSITION',
      };
    }

    const now = new Date().toISOString();
    const updates: Partial<AstrologerPayoutRecord> = {
      status: next,
      updatedAt: now,
      adminNote: params.adminNote || payout.adminNote,
    };

    let auditEventType: any = 'PAYOUT_APPROVED';

    if (next === 'APPROVED') {
      updates.approvedAt = now;
      auditEventType = 'PAYOUT_APPROVED';
    } else if (next === 'PROCESSING') {
      updates.processedAt = now;
      auditEventType = 'PAYOUT_PROCESSING';
    } else if (next === 'PAID') {
      updates.completedAt = now;
      auditEventType = 'PAYOUT_PAID';
    } else if (next === 'FAILED') {
      updates.rejectedAt = now;
      updates.failureReason = params.failureReason || 'Settlement processing failed';
      auditEventType = 'PAYOUT_FAILED';
    } else if (next === 'CANCELLED') {
      updates.rejectedAt = now;
      auditEventType = 'PAYOUT_CANCELLED';
    }

    const updatedPayout = await this.dataStore.updateAstrologerPayout(params.payoutId, updates);

    // Audit Log
    const auditLog: PaymentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: `payout_tx_${params.payoutId}`,
      consultationId: 'SETTLEMENT',
      payoutId: params.payoutId,
      eventType: auditEventType,
      actorId: adminUser.id,
      details: `Settlement payout '${params.payoutId}' status changed from '${current}' to '${next}'. Note: ${params.adminNote || 'N/A'}`,
      timestamp: now,
    };
    await this.dataStore.savePaymentAuditLog(auditLog);

    return { success: true, data: updatedPayout! };
  }

  /**
   * Retrieves payout records for an astrologer.
   */
  public async listAstrologerPayouts(
    requestingUser: UserAccount | null,
    astrologerUserId: string
  ): Promise<ServiceResult<AstrologerPayoutRecord[]>> {
    if (!requestingUser) {
      return { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' };
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isSelf = requestingUser.id === astrologerUserId;

    if (!isSelf && !isAdmin) {
      return { success: false, error: 'Unauthorized to view these payouts.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const payouts = await this.dataStore.listAstrologerPayoutsByAstrologerUserId(astrologerUserId);
    return { success: true, data: payouts };
  }

  /**
   * Admin lists all payout settlement records.
   */
  public async listAllPayoutsForAdmin(
    adminUser: UserAccount | null
  ): Promise<ServiceResult<AstrologerPayoutRecord[]>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED_ACCESS' };
    }

    const payouts = await this.dataStore.listAllAstrologerPayouts();
    return { success: true, data: payouts };
  }
}

export const paymentService = new PaymentService();
