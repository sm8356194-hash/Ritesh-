/**
 * Payment Service Types & Provider Abstraction Interfaces
 * 
 * Centralized payment status model, provider interface, and transaction parameter types
 * for Step 18 Payment Architecture & Consultation Billing Foundation.
 */

import { PaymentStatus, PaymentProviderType, PaymentEarningsBreakdown, PaymentTransaction, PaymentAuditLog, ServiceResult } from '../../types';

export interface CreatePaymentOrderInput {
  consultationId: string;
  userId: string;
  userName?: string;
  astrologerId: string;
  astrologerName?: string;
  astrologerUserId?: string;
  durationMinutes: number;
  perMinuteCharge: number;
  currency?: string; // default "INR"
  idempotencyKey?: string;
}

export interface VerifyPaymentInput {
  transactionId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  consultationId?: string;
}

export interface RefundRequestInput {
  transactionId: string;
  amount?: number; // if partial, otherwise full
  reason: string;
}

export interface PaymentOrderResult {
  transactionId: string;
  consultationId: string;
  amount: number;
  currency: string;
  provider: PaymentProviderType | string;
  providerOrderId: string;
  razorpayKeyId?: string | null;
  providerConfigured?: boolean;
  status: PaymentStatus;
  isServerVerificationRequired: true;
}

export interface PaymentVerificationResult {
  transactionId: string;
  consultationId: string;
  status: PaymentStatus;
  paidAt: string;
  earningsBreakdown: PaymentEarningsBreakdown;
}

export interface RefundResult {
  transactionId: string;
  consultationId: string;
  status: PaymentStatus;
  refundedAmount: number;
  refundedAt: string;
}

/**
 * Provider abstraction contract for payment gateways
 */
export interface PaymentProvider {
  readonly providerName: PaymentProviderType;
  isConfigured(): boolean;
  createOrder(input: CreatePaymentOrderInput): Promise<ServiceResult<{ providerOrderId: string; amount: number; currency: string }>>;
  verifyPayment(input: VerifyPaymentInput): Promise<ServiceResult<{ paid: boolean; providerPaymentId: string }>>;
  processRefund(input: RefundRequestInput): Promise<ServiceResult<{ refundId: string; amount: number }>>;
}
