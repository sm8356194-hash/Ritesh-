import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  Percent, 
  AlertTriangle,
  FileText,
  RefreshCw,
  PieChart,
  Building2,
  PlusCircle,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Check
} from 'lucide-react';
import { 
  AdminPaymentRecord, 
  PaymentTransaction, 
  PaymentAuditLog, 
  AstrologerEarningRecord, 
  PlatformEarningRecord, 
  AstrologerPayoutRecord,
  SettlementPreviewResult,
  PayoutStatus,
  AstrologerProfile
} from '../../types';
import { paymentService } from '../../services/payment/paymentService';
import { authService } from '../../services/auth/authService';
import { globalDataStore } from '../../services/data/dataStore';

interface AdminPaymentsTabProps {
  payments: AdminPaymentRecord[];
  onUpdatePaymentStatus: (id: string, newStatus: 'Settled' | 'Pending' | 'Refunded') => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  payments: initialDemoPayments,
  onUpdatePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Settled' | 'Pending' | 'Refunded'>('All');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'All' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED'>('All');
  
  const [realTransactions, setRealTransactions] = useState<PaymentTransaction[]>([]);
  const [astrologerEarnings, setAstrologerEarnings] = useState<AstrologerEarningRecord[]>([]);
  const [platformEarnings, setPlatformEarnings] = useState<PlatformEarningRecord[]>([]);
  const [payouts, setPayouts] = useState<AstrologerPayoutRecord[]>([]);
  const [astrologers, setAstrologers] = useState<AstrologerProfile[]>([]);

  // Payout Creation Modal / Preview State
  const [selectedAstroUserId, setSelectedAstroUserId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedTxAuditLogs, setSelectedTxAuditLogs] = useState<{ txId: string; logs: PaymentAuditLog[] } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const admin = authService.getCurrentUser();
    if (admin) {
      const txRes = await paymentService.listAllTransactionsForAdmin(admin);
      if (txRes.success) setRealTransactions(txRes.data);

      const earnRes = await paymentService.listAllAstrologerEarnings(admin);
      if (earnRes.success) setAstrologerEarnings(earnRes.data);

      const platRes = await paymentService.listAllPlatformEarnings(admin);
      if (platRes.success) setPlatformEarnings(platRes.data);

      const payoutRes = await paymentService.listAllPayoutsForAdmin(admin);
      if (payoutRes.success) setPayouts(payoutRes.data);

      const astroList = await globalDataStore.listAstrologers(false);
      setAstrologers(astroList);
      if (astroList.length > 0 && !selectedAstroUserId) {
        setSelectedAstroUserId(astroList[0].userId || astroList[0].id);
      }
    }
    setLoading(false);
  };

  const handlePreviewSettlement = async () => {
    if (!selectedAstroUserId) return;
    setActionError(null);
    setPreviewLoading(true);
    const admin = authService.getCurrentUser();
    const res = await paymentService.previewSettlementForAstrologer(admin, selectedAstroUserId, periodStart, periodEnd);
    setPreviewLoading(false);
    if (res.success) {
      setSettlementPreview(res.data);
    } else {
      setActionError(res.error);
    }
  };

  const handleCreateSettlement = async () => {
    if (!selectedAstroUserId) return;
    setActionError(null);
    setActionSuccess(null);
    const admin = authService.getCurrentUser();
    const res = await paymentService.createSettlementPayout(admin, {
      astrologerUserId: selectedAstroUserId,
      periodStart,
      periodEnd,
      adminNote: 'Admin generated settlement payout record',
    });
    if (res.success) {
      setActionSuccess(`Settlement payout '${res.data.id}' created in PENDING state.`);
      setShowCreateModal(false);
      setSettlementPreview(null);
      loadAllData();
    } else {
      setActionError(res.error);
    }
  };

  const handleUpdatePayoutStatus = async (payoutId: string, newStatus: PayoutStatus) => {
    setActionError(null);
    setActionSuccess(null);
    const admin = authService.getCurrentUser();
    const res = await paymentService.updatePayoutStatus(admin, {
      payoutId,
      newStatus,
      adminNote: `Admin updated status to ${newStatus}`,
    });
    if (res.success) {
      setActionSuccess(`Payout '${payoutId}' status updated to ${newStatus}.`);
      loadAllData();
    } else {
      setActionError(res.error);
    }
  };

  const handleAdminReconcile = async (txId: string) => {
    setActionError(null);
    setActionSuccess(null);
    const admin = authService.getCurrentUser();
    const res = await paymentService.reconcilePaymentForAdminTest(admin, txId);
    if (!res.success) {
      setActionError(res.error);
    } else {
      setActionSuccess(`Payment reconciled as PAID for transaction ${txId}.`);
      loadAllData();
    }
  };

  const handleAdminRefund = async (txId: string) => {
    setActionError(null);
    setActionSuccess(null);
    const admin = authService.getCurrentUser();
    const res = await paymentService.processRefund(admin, {
      transactionId: txId,
      reason: 'Admin-initiated refund request',
    });
    if (!res.success) {
      setActionError(res.error);
    } else {
      setActionSuccess(`Refund processed successfully for transaction ${txId}.`);
      loadAllData();
    }
  };

  const handleViewAuditLogs = async (txId: string) => {
    const admin = authService.getCurrentUser();
    const res = await paymentService.getAuditLogsForTransaction(admin, txId);
    if (res.success) {
      setSelectedTxAuditLogs({ txId, logs: res.data });
    }
  };

  // Authoritative Metrics Aggregation
  const paidRealTxs = realTransactions.filter(t => t.status === 'PAID' || t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED');
  
  const grossRealVolume = paidRealTxs.reduce((acc, t) => acc + t.amount, 0);
  const grossDemoVolume = initialDemoPayments.reduce((acc, p) => acc + (p.status !== 'Refunded' ? p.demoAmount : 0), 0);
  const totalGrossVolume = grossRealVolume + grossDemoVolume;

  const realPlatformFees = platformEarnings.reduce((acc, p) => acc + (p.netPlatformEarning || p.platformFee), 0);
  const demoPlatformFees = initialDemoPayments.reduce((acc, p) => acc + (p.status !== 'Refunded' ? p.platformCommission : 0), 0);
  const totalPlatformFees = (realPlatformFees > 0 ? realPlatformFees : Math.round(grossRealVolume * 0.15)) + demoPlatformFees;

  const realAstroShare = astrologerEarnings.reduce((acc, e) => acc + (e.netAmount || e.astrologerAmount), 0);
  const demoAstroShare = initialDemoPayments.reduce((acc, p) => acc + (p.status !== 'Refunded' ? p.astrologerAmount : 0), 0);
  const totalAstrologerEarnings = (realAstroShare > 0 ? realAstroShare : Math.round(grossRealVolume * 0.85)) + demoAstroShare;

  const totalRefunds = realTransactions.reduce((acc, t) => acc + (t.refundAmount || 0), 0);

  const filteredRealTxs = realTransactions.filter((tx) => {
    const matchesSearch = (tx.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tx.astrologerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.consultationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Settled' && tx.status === 'PAID') ||
                          (statusFilter === 'Pending' && tx.status === 'PAYMENT_PENDING') ||
                          (statusFilter === 'Refunded' && (tx.status === 'REFUNDED' || tx.status === 'PARTIALLY_REFUNDED'));
    return matchesSearch && matchesStatus;
  });

  const filteredPayouts = payouts.filter((p) => {
    const matchesStatus = payoutStatusFilter === 'All' || p.status === payoutStatusFilter;
    const matchesSearch = (p.astrologerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.astrologerUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0c1222] to-amber-500/10 border border-amber-500/30 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Financial Billing & Astrologer Settlement Ledger</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono border border-emerald-400/30">
                STEP 23 SETTLEMENT FOUNDATION
              </span>
            </div>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              Authoritative financial ledger tracking gross volume, 15% platform commission, 85% astrologer earnings, and admin settlement payout records.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>New Settlement Payout</span>
          </button>
        </div>

        {actionError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Financial Aggregates Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-[#1e2b4f]">
          <span className="text-[11px] text-slate-400 block">Gross Consultation Volume</span>
          <span className="text-lg font-serif font-bold text-slate-100 font-mono mt-1 block">
            ₹{totalGrossVolume.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Total customer payments</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-amber-500/30">
          <span className="text-[11px] text-amber-300 font-bold block">Net Platform Share (15%)</span>
          <span className="text-lg font-serif font-bold text-amber-300 font-mono mt-1 block">
            ₹{totalPlatformFees.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Retained operational margin</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-[#1e2b4f]">
          <span className="text-[11px] text-emerald-400 font-bold block">Astrologer Net Share (85%)</span>
          <span className="text-lg font-serif font-bold text-emerald-300 font-mono mt-1 block">
            ₹{totalAstrologerEarnings.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Earned by practitioners</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-rose-500/30">
          <span className="text-[11px] text-rose-400 font-bold block">Total Refunds Processed</span>
          <span className="text-lg font-serif font-bold text-rose-300 font-mono mt-1 block">
            ₹{totalRefunds.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Proportional adjustments</span>
        </div>
      </div>

      {/* SECTION A: ASTROLOGER PAYOUT SETTLEMENTS LEDGER (Step 23) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Astrologer Settlement Payout Records ({payouts.length})</span>
          </h3>
          <button
            onClick={loadAllData}
            className="p-1.5 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 transition-colors text-[10px] flex items-center gap-1 border border-[#1e2b4f]"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Refresh Payouts</span>
          </button>
        </div>

        <div className="border border-sky-500/30 rounded-2xl overflow-hidden bg-[#0c1222] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111a30] border-b border-[#1e2b4f] text-[10px] text-sky-300 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3">Payout ID / Period</th>
                  <th className="py-2.5 px-3">Astrologer</th>
                  <th className="py-2.5 px-3">Gross</th>
                  <th className="py-2.5 px-3">Refund Adjustments</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">State Machine Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b4f]">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 text-xs">
                      No settlement payout records found in Firestore ledger.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#111a30]/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                        {p.id}
                        <span className="block text-[9px] text-slate-400 font-sans">{p.earningPeriodStart} to {p.earningPeriodEnd}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <span className="font-bold block">{p.astrologerName || p.astrologerUserId}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Sessions: {p.consultationCount}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">₹{p.grossEarnings}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-300">₹{p.refundAdjustments}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">₹{p.netPayable}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          p.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : p.status === 'APPROVED' || p.status === 'PROCESSING'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : p.status === 'FAILED' || p.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                          {p.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'APPROVED')}
                                className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'CANCELLED')}
                                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {p.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdatePayoutStatus(p.id, 'PROCESSING')}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold"
                            >
                              Process
                            </button>
                          )}
                          {p.status === 'PROCESSING' && (
                            <>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'PAID')}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold"
                                title="Administrative record update only - no money transferred"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'FAILED')}
                                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold"
                              >
                                Mark Failed
                              </button>
                            </>
                          )}
                          {p.status === 'FAILED' && (
                            <button
                              onClick={() => handleUpdatePayoutStatus(p.id, 'PENDING')}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold"
                            >
                              Reset Pending
                            </button>
                          )}
                          {p.status === 'PAID' && (
                            <span className="text-emerald-400 font-bold px-2">Settled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, astrologer, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Settled', 'Pending', 'Refunded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-[#111a30] text-slate-300 hover:text-slate-100 hover:bg-[#16203c] border border-[#1e2b4f]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Real Firestore Payment Transactions Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Authoritative Payment Transactions ({filteredRealTxs.length})</span>
          </h3>
        </div>

        <div className="border border-amber-500/30 rounded-2xl overflow-hidden bg-[#0c1222] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111a30] border-b border-[#1e2b4f] text-[10px] text-amber-300 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3">Transaction / Date</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Astrologer</th>
                  <th className="py-2.5 px-3">Gross</th>
                  <th className="py-2.5 px-3">Platform (15%)</th>
                  <th className="py-2.5 px-3">Astrologer (85%)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b4f]">
                {filteredRealTxs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                      No matching real payment transactions found in Firestore ledger.
                    </td>
                  </tr>
                ) : (
                  filteredRealTxs.map((tx) => {
                    const gross = tx.amount;
                    const platformFee = tx.earningsBreakdown?.platformFee || Math.round(gross * 0.15);
                    const astroShare = tx.earningsBreakdown?.astrologerAmount || Math.max(0, gross - platformFee);

                    return (
                      <tr key={tx.id} className="hover:bg-[#111a30]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                          {tx.id}
                          <span className="block text-[9px] text-slate-400 font-sans">{tx.createdAt.split('T')[0]}</span>
                          {tx.providerOrderId && (
                            <span className="block text-[8px] text-slate-500 font-mono">Ord: {tx.providerOrderId}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">
                          <span className="font-bold block">{tx.userName || 'Client'}</span>
                          <span className="text-[9px] text-slate-500 font-mono">Ref: {tx.consultationId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{tx.astrologerName || tx.astrologerId}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-100">₹{gross}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">₹{platformFee}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">₹{astroShare}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            tx.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : tx.status === 'PAYMENT_PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.status === 'PAYMENT_PENDING' && (
                              <button
                                onClick={() => handleAdminReconcile(tx.id)}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-colors"
                              >
                                Reconcile Paid
                              </button>
                            )}
                            {tx.status === 'PAID' && (
                              <button
                                onClick={() => handleAdminRefund(tx.id)}
                                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-colors"
                              >
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => handleViewAuditLogs(tx.id)}
                              className="px-2 py-1 rounded bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 border border-[#1e2b4f] text-[10px] transition-colors"
                            >
                              Audit Log
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE SETTLEMENT PAYOUT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1222] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => { setShowCreateModal(false); setSettlementPreview(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-sm"
            >
              ✕
            </button>

            <h4 className="text-sm font-serif font-bold text-amber-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Generate Settlement Payout Record</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Astrologer</label>
                <select
                  value={selectedAstroUserId}
                  onChange={(e) => { setSelectedAstroUserId(e.target.value); setSettlementPreview(null); }}
                  className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  {astrologers.map((a) => (
                    <option key={a.id} value={a.userId || a.id}>
                      {a.name} ({a.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => { setPeriodStart(e.target.value); setSettlementPreview(null); }}
                    className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-2.5 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => { setPeriodEnd(e.target.value); setSettlementPreview(null); }}
                    className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <button
                onClick={handlePreviewSettlement}
                disabled={previewLoading}
                className="w-full py-2 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 font-bold border border-amber-500/30 transition-colors"
              >
                {previewLoading ? 'Calculating Net Payable...' : 'Preview Unsettled Earnings'}
              </button>

              {settlementPreview && (
                <div className="p-3 rounded-2xl bg-[#111a30] border border-amber-500/30 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-[#1e2b4f] pb-1 text-slate-300">
                    <span>Eligible Sessions:</span>
                    <span className="text-amber-300 font-bold">{settlementPreview.consultationCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gross 85% Share:</span>
                    <span>₹{settlementPreview.grossEarnings}</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Refund Adjustments:</span>
                    <span>-₹{settlementPreview.refundAdjustments}</span>
                  </div>
                  <div className="flex justify-between text-emerald-300 font-bold pt-1 border-t border-[#1e2b4f] text-xs">
                    <span>Net Payable:</span>
                    <span>₹{settlementPreview.netPayable}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateSettlement}
                disabled={!settlementPreview || settlementPreview.consultationCount === 0}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                Confirm Settlement Payout Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Inspection Modal */}
      {selectedTxAuditLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1222] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-3 text-slate-100 relative">
            <button
              onClick={() => setSelectedTxAuditLogs(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-sm"
            >
              ✕
            </button>
            <h4 className="text-sm font-serif font-bold text-amber-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Audit Trail: {selectedTxAuditLogs.txId}</span>
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {selectedTxAuditLogs.logs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No audit log records found.</p>
              ) : (
                selectedTxAuditLogs.logs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f] text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-mono text-[10px]">
                      <span>{log.eventType}</span>
                      <span className="text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{log.details}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Actor ID: {log.actorId}</p>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setSelectedTxAuditLogs(null)}
              className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Close Audit Trail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
