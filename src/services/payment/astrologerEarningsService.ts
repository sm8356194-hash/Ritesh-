/**
 * Astrologer Earnings & Payout Settlement Service (Step 74)
 * 
 * Manages the financial lifecycles of practitioner earnings ledger entries,
 * available-for-payout balances, and atomic payout settlement transitions.
 */

import {
  UserAccount,
  AstrologerEarningRecord,
  AstrologerPayoutRecord,
  ConsultationRecord,
  PaymentTransaction,
  ServiceResult,
  PayoutStatus,
  EarningStatus,
  ConsultationType
} from '../../types';
import { DataStore, globalDataStore } from '../data/dataStore';
import { calculateFinancialBreakdown } from './paymentService';

export interface EarningsSummary {
  totalEarnings: number; // Rupees
  totalEarningsPaise: number;
  pendingEarnings: number; // Rupees
  pendingEarningsPaise: number;
  availableForPayout: number; // Rupees
  availableForPayoutPaise: number;
  paidOut: number; // Rupees
  paidOutPaise: number;
  refundedOrAdjusted: number; // Rupees
  refundedOrAdjustedPaise: number;
}

export class AstrologerEarningsService {
  private dataStore: DataStore;

  constructor(dataStore: DataStore = globalDataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Processes and creates an authoritative earning record for a completed and paid consultation.
   * Ensures absolute protection against double-earning and unverified payment states.
   */
  public async createEarningForCompletedConsultation(
    requestingUserOrSystem: UserAccount | null,
    consultationId: string
  ): Promise<ServiceResult<AstrologerEarningRecord>> {
    // 1. Fetch consultation
    const consultation = await this.dataStore.getConsultationById(consultationId);
    if (!consultation) {
      return {
        success: false,
        error: `Consultation '${consultationId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    // 2. Validate states
    if (consultation.status !== 'COMPLETED') {
      return {
        success: false,
        error: `Cannot generate earnings. Consultation status is '${consultation.status}' (must be COMPLETED).`,
        code: 'INVALID_CONSULTATION_STATE',
      };
    }

    if (consultation.paymentStatus !== 'PAID') {
      return {
        success: false,
        error: 'Cannot generate earnings. Consultation has not been marked as PAID.',
        code: 'UNPAID_CONSULTATION',
      };
    }

    // 3. Fetch payment transaction
    const transaction = await this.dataStore.getPaymentTransactionByConsultationId(consultationId);
    if (!transaction || transaction.status !== 'PAID') {
      return {
        success: false,
        error: 'Verification failed. No matching verified payment transaction was found.',
        code: 'UNVERIFIED_PAYMENT',
      };
    }

    // 4. Duplicate prevention check
    const existingEarnings = await this.dataStore.listAstrologerEarningsByAstrologerUserId(consultation.astrologerUserId || '');
    const alreadyExists = existingEarnings.find(e => e.consultationId === consultationId);
    if (alreadyExists) {
      return {
        success: true,
        data: alreadyExists,
      };
    }

    // 5. Exclude demo consultations
    const isDemo = consultation.isDemo || false;

    // 6. Calculate breakdown
    const commissionPercent = 15; // standard 85/15 split
    const breakdown = calculateFinancialBreakdown(transaction.amount, commissionPercent);

    const now = new Date().toISOString();
    const earningId = `earn_${transaction.id}`;

    const newEarning: AstrologerEarningRecord = {
      id: earningId,
      astrologerUserId: consultation.astrologerUserId || '',
      astrologerId: consultation.astrologerId,
      consultationId: consultation.id,
      paymentTransactionId: transaction.id,
      grossAmount: breakdown.grossAmount,
      grossAmountPaise: breakdown.grossAmountPaise,
      platformFee: breakdown.platformFee,
      platformFeePaise: breakdown.platformFeePaise,
      platformFeePercent: commissionPercent,
      astrologerAmount: breakdown.astrologerAmount,
      astrologerAmountPaise: breakdown.astrologerAmountPaise,
      refundAdjustment: 0,
      refundAdjustmentPaise: 0,
      netAmount: breakdown.astrologerAmount,
      netAmountPaise: breakdown.astrologerAmountPaise,
      currency: transaction.currency,
      status: 'EARNED',
      payoutId: null,
      createdAt: now,
      updatedAt: now,
      isDemo,
      consultationType: consultation.type,
      durationSeconds: consultation.durationMinutes * 60,
    };

    const saved = await this.dataStore.saveAstrologerEarning(newEarning);

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Compiles server-authoritative earnings summary statistics for an astrologer.
   */
  public async getEarningsSummaryForAstrologer(
    requestingUser: UserAccount | null,
    astrologerUserId: string
  ): Promise<ServiceResult<EarningsSummary>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to retrieve earnings summary.',
        code: 'UNAUTHENTICATED',
      };
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isSelf = requestingUser.id === astrologerUserId;

    if (!isSelf && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Cannot view private financial metrics of another practitioner.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const allEarnings = await this.dataStore.listAstrologerEarningsByAstrologerUserId(astrologerUserId);
    const allPayouts = await this.dataStore.listAstrologerPayoutsByAstrologerUserId(astrologerUserId);

    let totalEarningsPaise = 0;
    let pendingEarningsPaise = 0;
    let paidOutPaise = 0;
    let refundedOrAdjustedPaise = 0;

    // Filter by demo isolation
    const isDemoUser = requestingUser.isDemoUser || false;
    const filteredEarnings = allEarnings.filter(e => e.isDemo === isDemoUser);
    const filteredPayouts = allPayouts.filter(p => p.isDemo === isDemoUser);

    // Identify earning record IDs that are already included in settled payout requests
    const settledEarningIds = new Set<string>();
    const processingOrPaidEarningIds = new Set<string>();

    filteredPayouts.forEach(p => {
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        p.earningRecordIds.forEach(id => {
          settledEarningIds.add(id);
          if (p.status === 'PAID') {
            processingOrPaidEarningIds.add(id);
          }
        });
      }
    });

    filteredEarnings.forEach(e => {
      const amt = e.netAmountPaise || 0;
      const ref = e.refundAdjustmentPaise || 0;

      totalEarningsPaise += amt;
      refundedOrAdjustedPaise += ref;

      if (e.status === 'PENDING') {
        pendingEarningsPaise += amt;
      }
    });

    let activePayoutsPaise = 0;
    filteredPayouts.forEach(p => {
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        activePayoutsPaise += p.netPayablePaise;
      }
      if (p.status === 'PAID') {
        paidOutPaise += p.netPayablePaise;
      }
    });

    const totalNetEarningsPaise = Math.max(0, totalEarningsPaise - refundedOrAdjustedPaise);
    const availableForPayoutPaise = Math.max(0, totalNetEarningsPaise - activePayoutsPaise);

    return {
      success: true,
      data: {
        totalEarnings: totalEarningsPaise / 100,
        totalEarningsPaise,
        pendingEarnings: pendingEarningsPaise / 100,
        pendingEarningsPaise,
        availableForPayout: availableForPayoutPaise / 100,
        availableForPayoutPaise,
        paidOut: paidOutPaise / 100,
        paidOutPaise,
        refundedOrAdjusted: refundedOrAdjustedPaise / 100,
        refundedOrAdjustedPaise,
      },
    };
  }

  /**
   * Submits a payout request for an approved practitioner.
   * Implements strict double-settlement protection and balance validation.
   */
  public async requestPayout(
    requestingUser: UserAccount | null,
    amountPaise: number,
    currency: string = 'INR',
    idempotencyKey?: string
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!requestingUser) {
      return {
        success: false,
        error: 'Authentication required to request a payout.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (amountPaise <= 0) {
      return {
        success: false,
        error: 'Requested payout amount must be greater than zero.',
        code: 'INVALID_AMOUNT',
      };
    }

    // 1. Verify user profile and astrologer status
    const astrologer = await this.dataStore.getAstrologerProfileByUserId(requestingUser.id);
    if (!astrologer) {
      return {
        success: false,
        error: 'Only registered practitioners can submit payout requests.',
        code: 'NOT_A_PRACTITIONER',
      };
    }

    if (!astrologer.isApproved || astrologer.status === 'SUSPENDED') {
      return {
        success: false,
        error: 'Payout requests are blocked for suspended or pending practitioner profiles.',
        code: 'PRACTITIONER_NOT_ACTIVE',
      };
    }

    // 2. Prevent duplicate requests using same idempotency key FIRST before balance validation
    if (idempotencyKey) {
      const existingPayouts = await this.dataStore.listAstrologerPayoutsByAstrologerUserId(requestingUser.id);
      const duplicate = existingPayouts.find(p => p.idempotencyKey === idempotencyKey);
      if (duplicate) {
        return {
          success: true,
          data: duplicate,
        };
      }
    }

    // 3. Compute authoritative available-for-payout balance
    const summaryRes = await this.getEarningsSummaryForAstrologer(requestingUser, requestingUser.id);
    if (!summaryRes.success) {
      return {
        success: false,
        error: summaryRes.error,
        code: summaryRes.code,
      };
    }

    const available = summaryRes.data.availableForPayoutPaise;
    if (amountPaise > available) {
      return {
        success: false,
        error: `Insufficient available earnings. Requested: ₹${(amountPaise / 100).toFixed(2)}, Available: ₹${(available / 100).toFixed(2)}.`,
        code: 'INSUFFICIENT_FUNDS',
      };
    }

    // 4. Resolve exact list of earning record IDs to consume for this payout
    const allEarnings = await this.dataStore.listAstrologerEarningsByAstrologerUserId(requestingUser.id);
    const existingPayouts = await this.dataStore.listAllAstrologerPayouts();
    const alreadySettledEarningIds = new Set<string>();

    existingPayouts.forEach(p => {
      if (p.status !== 'CANCELLED' && p.status !== 'FAILED') {
        p.earningRecordIds.forEach(id => alreadySettledEarningIds.add(id));
      }
    });

    const isDemoUser = requestingUser.isDemoUser || false;

    // Filter available unsettled records
    const eligibleEarnings = allEarnings.filter(e => {
      if (e.isDemo !== isDemoUser) return false;
      if (e.status !== 'EARNED' && e.status !== 'REFUND_ADJUSTED') return false;
      return !alreadySettledEarningIds.has(e.id);
    });

    // Accumulate records until amount is satisfied
    let accumulatedPaise = 0;
    const consumedEarningIds: string[] = [];

    for (const e of eligibleEarnings) {
      if (accumulatedPaise >= amountPaise) break;
      const net = Math.max(0, e.astrologerAmountPaise - e.refundAdjustmentPaise);
      consumedEarningIds.push(e.id);
      accumulatedPaise += net;
    }

    const now = new Date().toISOString();
    const payoutId = `payout_${requestingUser.id}_${Date.now()}`;

    const newPayout: AstrologerPayoutRecord = {
      id: payoutId,
      astrologerUserId: requestingUser.id,
      astrologerId: astrologer.id,
      astrologerName: astrologer.name,
      earningPeriodStart: 'Earliest Available',
      earningPeriodEnd: now.substring(0, 10),
      grossEarnings: amountPaise / 100,
      grossEarningsPaise: amountPaise,
      refundAdjustments: 0,
      refundAdjustmentsPaise: 0,
      netPayable: amountPaise / 100,
      netPayablePaise: amountPaise,
      currency,
      status: 'PENDING',
      earningRecordIds: consumedEarningIds,
      consultationCount: consumedEarningIds.length,
      createdAt: now,
      updatedAt: now,
      idempotencyKey,
      isDemo: isDemoUser,
    };

    const savedPayout = await this.dataStore.saveAstrologerPayout(newPayout);

    return {
      success: true,
      data: savedPayout,
    };
  }

  /**
   * Admin approves a payout request.
   */
  public async approvePayoutByAdmin(
    adminUser: UserAccount | null,
    payoutId: string,
    adminNote?: string
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can approve payout requests.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const payout = await this.dataStore.getAstrologerPayoutById(payoutId);
    if (!payout) {
      return {
        success: false,
        error: `Payout record '${payoutId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    if (payout.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot approve payout in '${payout.status}' status (must be PENDING).`,
        code: 'INVALID_STATUS',
      };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateAstrologerPayout(payoutId, {
      status: 'APPROVED',
      approvedAt: now,
      reviewedBy: adminUser.id,
      adminNote: adminNote || 'Approved by system administrator',
      updatedAt: now,
    });

    return {
      success: true,
      data: updated!,
    };
  }

  /**
   * Admin transitions payout to PROCESSING.
   */
  public async transitionPayoutToProcessing(
    adminUser: UserAccount | null,
    payoutId: string,
    provider: string = 'MOCK_DEV'
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    const payout = await this.dataStore.getAstrologerPayoutById(payoutId);
    if (!payout) {
      return {
        success: false,
        error: 'Payout not found.',
        code: 'NOT_FOUND',
      };
    }

    if (payout.status !== 'APPROVED') {
      return {
        success: false,
        error: `Invalid transition to PROCESSING from status '${payout.status}'.`,
        code: 'INVALID_STATUS',
      };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateAstrologerPayout(payoutId, {
      status: 'PROCESSING',
      processedAt: now,
      provider,
      updatedAt: now,
    });

    return {
      success: true,
      data: updated!,
    };
  }

  /**
   * Admin completes a payout request as PAID after verified provider settlement.
   */
  public async finalizePayoutAsPaid(
    adminUser: UserAccount | null,
    payoutId: string,
    providerReference: string,
    adminNote?: string
  ): Promise<ServiceResult<AstrologerPayoutRecord>> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can finalize payout settlements.',
        code: 'UNAUTHORIZED_ACCESS',
      };
    }

    if (!providerReference || providerReference.trim().length === 0) {
      return {
        success: false,
        error: 'Verified provider transaction reference is required to mark a payout as PAID.',
        code: 'MISSING_PROVIDER_REFERENCE',
      };
    }

    const payout = await this.dataStore.getAstrologerPayoutById(payoutId);
    if (!payout) {
      return {
        success: false,
        error: `Payout record '${payoutId}' not found.`,
        code: 'NOT_FOUND',
      };
    }

    if (payout.status !== 'PROCESSING') {
      return {
        success: false,
        error: `Invalid transition to PAID from status '${payout.status}'. Payout must be in PROCESSING status.`,
        code: 'INVALID_STATUS',
      };
    }

    const now = new Date().toISOString();
    const updated = await this.dataStore.updateAstrologerPayout(payoutId, {
      status: 'PAID',
      completedAt: now,
      providerReference,
      adminNote: adminNote || 'Paid via verified settlement reconciliation',
      updatedAt: now,
    });

    // Mark associated earning records with payout ID to securely close the loop
    for (const earnId of payout.earningRecordIds) {
      const earning = await this.dataStore.getAstrologerEarningById(earnId);
      if (earning) {
        await this.dataStore.updateAstrologerEarning(earnId, {
          payoutId,
          status: 'EARNED',
          paidAt: now,
        });
      }
    }

    return {
      success: true,
      data: updated!,
    };
  }
}

export const astrologerEarningsService = new AstrologerEarningsService();
