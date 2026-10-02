/**
 * Consultation Request Modal Component with Razorpay Integration
 * 
 * Supports Step 21 Razorpay Checkout order creation and server-side HMAC verification.
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, CreditCard, ShieldAlert, Loader2, MessageSquare, Wallet, Plus } from 'lucide-react';
import { AstrologerProfile, PersistentBirthProfile, ConsultationType, ConsultationRecord, PaymentTransaction } from '../../types';
import { consultationService } from '../../services/consultationService';
import { birthProfileService } from '../../services/birthProfileService';
import { authService } from '../../services/auth/authService';
import { paymentService } from '../../services/payment/paymentService';
import { languageService } from '../../services/languageService';
import { walletService } from '../../services/walletService';
import { AddMoneyModal } from '../common/AddMoneyModal';

interface ConsultationRequestModalProps {
  astrologer: AstrologerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (consultation: ConsultationRecord) => void;
}

export const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({
  astrologer,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [birthProfiles, setBirthProfiles] = useState<PersistentBirthProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('Chat');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successConsultation, setSuccessConsultation] = useState<ConsultationRecord | null>(null);
  const [paymentTx, setPaymentTx] = useState<PaymentTransaction | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(walletService.getBalance());
  const [showAddMoneyModal, setShowAddMoneyModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = walletService.subscribe(bal => {
      setWalletBalance(bal);
    });
    return unsubscribe;
  }, []);

  const loadProfiles = async () => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const res = await birthProfileService.listBirthProfilesForUser(user, user.id);
    if (res.success && res.data.length > 0) {
      setBirthProfiles(res.data);
      const defaultProf = res.data.find(p => p.isDefault) || res.data[0];
      setSelectedProfileId(defaultProf.id);
    }
  };

  /**
   * Helper to dynamically load the Razorpay checkout.js script
   */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * Triggers Razorpay Checkout popup if key ID is present
   */
  const triggerRazorpayCheckout = async (
    order: any,
    consultation: ConsultationRecord,
    user: any
  ) => {
    setVerifying(true);
    setPaymentError(null);

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded || !(window as any).Razorpay) {
      setVerifying(false);
      setPaymentError('Failed to load Razorpay Checkout SDK script.');
      return;
    }

    const options = {
      key: order.razorpayKeyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency || 'INR',
      name: 'Talk With Astrologers',
      description: `Consultation with ${astrologer.name} (${durationMinutes} mins)`,
      order_id: order.providerOrderId,
      prefill: {
        name: user.displayName || 'Client',
        email: user.email || '',
      },
      theme: {
        color: '#f59e0b',
      },
      handler: async function (response: any) {
        // Step 21: Server Signature Verification Call
        const verifyRes = await paymentService.verifyAndProcessPayment(user, {
          transactionId: order.transactionId,
          providerOrderId: response.razorpay_order_id,
          providerPaymentId: response.razorpay_payment_id,
          providerSignature: response.razorpay_signature,
          consultationId: consultation.id,
        });

        setVerifying(false);

        if (verifyRes.success) {
          setPaymentTx(prev => prev ? { ...prev, status: 'PAID', providerPaymentId: response.razorpay_payment_id } : null);
          setSuccessConsultation(prev => prev ? { ...prev, paymentStatus: 'PAID' } : null);
        } else {
          setPaymentError(verifyRes.error || 'Razorpay server payment verification failed.');
        }
      },
      modal: {
        ondismiss: function () {
          setVerifying(false);
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setVerifying(false);
        setPaymentError(response.error?.description || 'Payment failed via Razorpay.');
      });
      rzp.open();
    } catch (e: any) {
      setVerifying(false);
      setPaymentError(e?.message || 'Error opening Razorpay checkout window.');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentError(null);
    setLoading(true);

    const user = authService.getCurrentUser();
    if (!user) {
      setError('Please sign in to request a consultation.');
      setLoading(false);
      return;
    }

    const estimatedTotal = astrologer.perMinuteCharge * durationMinutes;
    if (!walletService.hasSufficientBalance(estimatedTotal)) {
      setLoading(false);
      setError(`Insufficient wallet balance. Total required: ₹${estimatedTotal}, Available: ₹${walletBalance.toFixed(2)}. Please top up your wallet.`);
      return;
    }

    // Deduct demo balance
    walletService.deductBalance(
      estimatedTotal,
      `Consultation with ${astrologer.name} (${durationMinutes} mins)`,
      `cons_pending_${Date.now()}`
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().substring(0, 5);

    const res = await consultationService.bookConsultation(user, {
      astrologerId: astrologer.id,
      type: consultationType,
      scheduledDate: todayStr,
      scheduledTime: timeStr,
      durationMinutes,
      birthProfileId: selectedProfileId || undefined,
      topic: topic.trim() || undefined,
    });

    if (!res.success) {
      setLoading(false);
      setError(res.error);
      return;
    }

    const consultation = res.data;

    // Create Razorpay payment order via Server
    const payRes = await paymentService.createConsultationPaymentOrder(user, {
      consultationId: consultation.id,
      userId: user.id,
      userName: user.displayName,
      astrologerId: astrologer.id,
      astrologerName: astrologer.name,
      astrologerUserId: astrologer.userId,
      durationMinutes,
      perMinuteCharge: astrologer.perMinuteCharge,
      currency: 'INR',
    });

    setLoading(false);
    setSuccessConsultation(consultation);

    if (payRes.success && payRes.data) {
      setOrderResult(payRes.data);
      const txRes = await paymentService.getTransactionByConsultationId(user, consultation.id);
      if (txRes.success && txRes.data) {
        setPaymentTx(txRes.data);
      }

      // If Razorpay key ID is provided by server, trigger Razorpay Checkout
      if (payRes.data.razorpayKeyId) {
        triggerRazorpayCheckout(payRes.data, consultation, user);
      }
    }

    onSuccess(consultation);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0c1222] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#16203c] hover:bg-[#1e2b4f] text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-2 border-b border-[#1e2b4f]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-slate-100">
              Request Consultation
            </h3>
            <p className="text-[11px] text-amber-300/80">
              With {astrologer.name}
            </p>
          </div>
        </div>

        {successConsultation ? (
          <div className="py-4 text-center space-y-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${
              paymentTx?.status === 'PAID'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">
              {paymentTx?.status === 'PAID' ? 'Consultation Request & Razorpay Payment Confirmed' : 'Consultation Request & Payment Order Created'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consultation ID: <span className="font-mono text-amber-300">{successConsultation.id}</span>
            </p>

            {/* Billing Snapshot Card */}
            <div className="p-3 rounded-2xl bg-[#16203c]/70 border border-[#1e2b4f] text-left space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#1e2b4f]/60">
                <span className="text-slate-400">{languageService.t('consultationFee')}</span>
                <span className="font-mono font-bold text-amber-300">
                  ₹{successConsultation.fee || (astrologer.perMinuteCharge * durationMinutes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{languageService.t('paymentStatus')}</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                  paymentTx?.status === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {paymentTx?.status || successConsultation.paymentStatus || 'PAYMENT_PENDING'}
                </span>
              </div>
              {paymentTx?.providerOrderId && (
                <div className="flex items-center justify-between pt-1 border-t border-[#1e2b4f]/60 text-[10px]">
                  <span className="text-slate-400">Razorpay Order ID:</span>
                  <span className="font-mono text-slate-300">{paymentTx.providerOrderId}</span>
                </div>
              )}
              {paymentTx?.providerPaymentId && (
                <div className="flex items-center justify-between pt-0.5 text-[10px]">
                  <span className="text-slate-400">Razorpay Payment ID:</span>
                  <span className="font-mono text-emerald-300">{paymentTx.providerPaymentId}</span>
                </div>
              )}
            </div>

            {paymentError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Provider Integration Notice */}
            {orderResult?.razorpayKeyId ? (
              paymentTx?.status === 'PAYMENT_PENDING' && (
                <button
                  onClick={() => triggerRazorpayCheckout(orderResult, successConsultation, authService.getCurrentUser())}
                  disabled={verifying}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying Razorpay Signature...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-slate-950" />
                      <span>Pay Now via Razorpay</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Razorpay Server Integration Active</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Payment order registered with status <span className="font-semibold text-amber-300">PAYMENT_PENDING</span>. Server endpoints (`/api/payment/create-order` & `/api/payment/verify`) are ready for Razorpay transactions.
                </p>
                <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-amber-500/20">
                  To open Razorpay Checkout popups, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment variables.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (successConsultation) onSuccess(successConsultation);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-slate-950" />
                <span>Enter Consultation Chat</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Birth Profile
              </label>
              {birthProfiles.length === 0 ? (
                <p className="text-[11px] text-amber-400 bg-[#16203c] p-2.5 rounded-xl border border-amber-400/20">
                  No saved birth profiles found. Default profile will be used.
                </p>
              ) : (
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  {birthProfiles.map((p: PersistentBirthProfile) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.dateOfBirth}, {p.birthPlace})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Consultation Type
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                  className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Chat">Chat</option>
                  <option value="Voice">Voice</option>
                  <option value="Video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Topic / Question (Optional)
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Briefly state your consultation question or area of focus..."
                rows={2}
                className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Wallet & Cost Breakdown */}
            <div className="p-3.5 rounded-xl bg-[#16203c]/80 border border-amber-500/20 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2b4f]/60">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>Available Wallet Balance</span>
                </div>
                <span className="font-mono font-bold text-amber-300">₹{walletBalance.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Consultation Rate</span>
                  <span className="text-amber-300 font-bold font-mono">₹{astrologer.perMinuteCharge}/min × {durationMinutes} mins</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Estimated Total</span>
                  <span className="text-amber-300 font-bold font-mono text-sm">₹{astrologer.perMinuteCharge * durationMinutes}</span>
                </div>
              </div>

              {/* Insufficient Balance Notice & Direct Add Money CTA */}
              {walletBalance < (astrologer.perMinuteCharge * durationMinutes) && (
                <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Short by <strong className="text-amber-300">₹{((astrologer.perMinuteCharge * durationMinutes) - walletBalance).toFixed(2)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMoneyModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Top Up Wallet (Add ₹{Math.max(100, Math.ceil(((astrologer.perMinuteCharge * durationMinutes) - walletBalance) / 50) * 50)})</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || walletBalance < (astrologer.perMinuteCharge * durationMinutes)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Creating Request & Order...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Request Consultation & Order</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Embedded Add Money Modal */}
        <AddMoneyModal
          isOpen={showAddMoneyModal}
          onClose={() => setShowAddMoneyModal(false)}
          suggestedAmount={Math.max(100, Math.ceil(((astrologer.perMinuteCharge * durationMinutes) - walletBalance) / 50) * 50)}
        />
      </div>
    </div>
  );
};
