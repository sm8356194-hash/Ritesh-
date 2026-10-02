import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CalendarClock, 
  CheckCircle2, 
  Radio, 
  Clock, 
  MessageSquare, 
  PhoneCall, 
  Compass, 
  Sparkles, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Wallet,
  DollarSign,
  Percent,
  RefreshCw,
  FileText,
  Building2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { DemoClient, DemoConsultationItem, AstrologerEarningRecord, AstrologerPayoutRecord } from '../../types';
import { paymentService } from '../../services/payment/paymentService';
import { authService } from '../../services/auth/authService';

interface AstrologerDashboardTabProps {
  clients: DemoClient[];
  consultations: DemoConsultationItem[];
  onOpenClientKundli: (client: DemoClient) => void;
  onOpenClientProfile: (client: DemoClient) => void;
  onStartActiveConsultation: (client: DemoClient) => void;
  onNavigateToClients: () => void;
  onNavigateToConsultations: () => void;
}

export const AstrologerDashboardTab: React.FC<AstrologerDashboardTabProps> = ({
  clients,
  consultations,
  onOpenClientKundli,
  onOpenClientProfile,
  onStartActiveConsultation,
  onNavigateToClients,
  onNavigateToConsultations,
}) => {
  // Availability States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [availableForChat, setAvailableForChat] = useState<boolean>(true);
  const [availableForVoice, setAvailableForVoice] = useState<boolean>(true);

  // Real Earnings & Payouts State
  const [earnings, setEarnings] = useState<AstrologerEarningRecord[]>([]);
  const [payouts, setPayouts] = useState<AstrologerPayoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = authService.getCurrentUser();
    if (user) {
      const earnRes = await paymentService.listAstrologerEarnings(user, user.id);
      if (earnRes.success) {
        setEarnings(earnRes.data);
      }
      const payRes = await paymentService.listAstrologerPayouts(user, user.id);
      if (payRes.success) {
        setPayouts(payRes.data);
      }
    }
    setLoading(false);
  };

  // Aggregated Financial Metrics
  const totalEarned = earnings.reduce((sum, e) => sum + (e.status === 'EARNED' ? e.netAmount : 0), 0);
  const totalRefundAdjustments = earnings.reduce((sum, e) => sum + (e.refundAdjustment || 0), 0);
  const paidCount = earnings.filter(e => e.status === 'EARNED' || e.status === 'REFUND_ADJUSTED').length;

  const paidPayoutVolume = payouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.netPayable, 0);
  const pendingPayoutVolume = payouts.filter(p => p.status === 'PENDING' || p.status === 'APPROVED' || p.status === 'PROCESSING').reduce((sum, p) => sum + p.netPayable, 0);
  const netAvailableForSettlement = Math.max(0, totalEarned - paidPayoutVolume - pendingPayoutVolume);

  // Active client
  const activeClient = clients.find(c => c.isCurrentAppUser) || clients[0];

  return (
    <div className="space-y-4 pb-24 text-slate-100">
      {/* 1. PROFESSIONAL HERO BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] font-bold tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PROFESSIONAL PORTAL</span>
            </div>
            <h2 className="text-base font-serif font-bold text-slate-100">
              Astrologer Workstation
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Review live client birth charts, manage consultation queues, and inspect authoritative 85% consultation earnings & settlement status ledger.
            </p>
          </div>

          <div className="shrink-0 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
            <Radio className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
        </div>

        {/* Active Consultation Notification Card */}
        <div className="mt-4 p-3 rounded-xl bg-[#141e38] border border-amber-400/30 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Consultation In Queue</span>
            </div>
            <p className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {activeClient.name} • {activeClient.birthPlace}
            </p>
            <p className="text-[10px] text-amber-300/80 truncate">
              {activeClient.summary}
            </p>
          </div>

          <button
            onClick={() => onStartActiveConsultation(activeClient)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shrink-0 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1"
          >
            <span>Open Session</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. ASTROLOGER EARNINGS & LEDGER SECTION (Step 22 & Step 23) */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-emerald-500/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-serif font-bold text-slate-100">
                Earnings & Settlement Status Ledger
              </h3>
              <p className="text-[10px] text-emerald-300/80">
                Authoritative 85% share calculated server-side in integer paise
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 text-[10px] transition-colors flex items-center gap-1 border border-[#1e2b4f]"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Aggregated Financial Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#111a30] border border-emerald-500/30">
            <span className="text-[10px] text-slate-400 block">Total Net Earned</span>
            <span className="text-base font-serif font-bold text-emerald-300 font-mono mt-0.5 block">
              ₹{totalEarned}
            </span>
            <span className="text-[9px] text-slate-500 block">85% Practitioner Share</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111a30] border border-sky-500/30">
            <span className="text-[10px] text-slate-400 block">Available For Settlement</span>
            <span className="text-base font-serif font-bold text-sky-300 font-mono mt-0.5 block">
              ₹{netAvailableForSettlement}
            </span>
            <span className="text-[9px] text-slate-500 block">Unsettled Ledger Balance</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111a30] border border-amber-500/30">
            <span className="text-[10px] text-slate-400 block">Pending Settlement</span>
            <span className="text-base font-serif font-bold text-amber-300 font-mono mt-0.5 block">
              ₹{pendingPayoutVolume}
            </span>
            <span className="text-[9px] text-slate-500 block">Admin Processing</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
            <span className="text-[10px] text-slate-400 block">Settled Volume</span>
            <span className="text-base font-serif font-bold text-slate-100 font-mono mt-0.5 block">
              ₹{paidPayoutVolume}
            </span>
            <span className="text-[9px] text-slate-500 block">Completed Settlements</span>
          </div>
        </div>

        {/* Settlement Status Notice (Step 23 Foundation) */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 block text-[11px]">Settlement Status Ledger Notice</span>
            <p className="text-[10px] leading-relaxed text-slate-300">
              Settlements are processed administratively per policy period. This ledger tracks official payable accounting records; real money transfers occur separately via authorized banking channels.
            </p>
          </div>
        </div>

        {/* Settlement Payout History Table */}
        {payouts.length > 0 && (
          <div className="border border-[#1e2b4f] rounded-xl overflow-hidden bg-[#070b14] space-y-1">
            <div className="p-2.5 bg-[#111a30] border-b border-[#1e2b4f] flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200">Settlement Payout Records</span>
              <span className="text-amber-300 font-mono text-[10px]">Admin Controlled State Machine</span>
            </div>
            <div className="overflow-x-auto max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e162b] border-b border-[#1e2b4f] text-[9px] text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="py-2 px-2.5">Period</th>
                    <th className="py-2 px-2.5">Payout ID</th>
                    <th className="py-2 px-2.5">Gross</th>
                    <th className="py-2 px-2.5">Deductions</th>
                    <th className="py-2 px-2.5">Net Payable</th>
                    <th className="py-2 px-2.5 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b4f]/60">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#111a30]/60">
                      <td className="py-2 px-2.5 font-mono text-[10px] text-slate-300">{p.earningPeriodStart} - {p.earningPeriodEnd}</td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-amber-300">{p.id}</td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-200">₹{p.grossEarnings}</td>
                      <td className="py-2 px-2.5 font-mono text-rose-300">₹{p.refundAdjustments}</td>
                      <td className="py-2 px-2.5 font-mono text-emerald-300 font-bold">₹{p.netPayable}</td>
                      <td className="py-2 px-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Earnings History Table */}
        <div className="border border-[#1e2b4f] rounded-xl overflow-hidden bg-[#070b14]">
          <div className="p-2.5 bg-[#111a30] border-b border-[#1e2b4f] flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-200">Session Earnings Breakdown</span>
            <span className="text-slate-400 font-mono text-[10px]">15% Platform / 85% Astrologer</span>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            {earnings.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No earning records in ledger yet. Completed paid consultations will reflect here.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e162b] border-b border-[#1e2b4f] text-[9px] text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Consultation ID</th>
                    <th className="py-2 px-2.5">Gross</th>
                    <th className="py-2 px-2.5">Platform (15%)</th>
                    <th className="py-2 px-2.5">Your Share (85%)</th>
                    <th className="py-2 px-2.5">Net</th>
                    <th className="py-2 px-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b4f]/60">
                  {earnings.map((e) => (
                    <tr key={e.id} className="hover:bg-[#111a30]/60">
                      <td className="py-2 px-2.5 font-mono text-[10px] text-slate-400">{e.createdAt.split('T')[0]}</td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-amber-300">{e.consultationId}</td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-200">₹{e.grossAmount}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-400">₹{e.platformFee}</td>
                      <td className="py-2 px-2.5 font-mono text-emerald-300 font-bold">₹{e.astrologerAmount}</td>
                      <td className="py-2 px-2.5 font-mono text-emerald-400 font-bold">₹{e.netAmount}</td>
                      <td className="py-2 px-2.5 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          e.status === 'EARNED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : e.status === 'REFUND_ADJUSTED' || e.status === 'REVERSED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 3. TODAY SECTION: OVERVIEW CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Overview</span>
          </h3>
          <span className="text-[10px] font-mono text-amber-400/90 font-semibold">
            Live Consultation Metrics
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#0c1222] border border-amber-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 leading-tight">Requests In Queue</span>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-amber-300">3</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pending</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 leading-tight">Upcoming Sessions</span>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-slate-100">2</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Scheduled</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0c1222] border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 leading-tight">Completed Sessions</span>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-emerald-400">{paidCount || 14}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">This Month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT CLIENTS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Clients</span>
          </h3>
          <button
            onClick={onNavigateToClients}
            className="text-[11px] text-amber-300 hover:text-amber-200 font-medium flex items-center gap-0.5"
          >
            <span>View All ({clients.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {clients.slice(0, 3).map((client) => (
            <div
              key={client.id}
              className="p-3 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
            >
              <div 
                onClick={() => onOpenClientProfile(client)}
                className="min-w-0 cursor-pointer flex-1"
              >
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-100 hover:text-amber-300 transition-colors truncate">
                    {client.name}
                  </h4>
                  {client.isCurrentAppUser && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-semibold shrink-0">
                      App User
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {client.dateOfBirth} • {client.birthTime} • {client.birthPlace}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenClientKundli(client)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Open Kundli Chart"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Kundli</span>
                </button>

                <button
                  onClick={() => onStartActiveConsultation(client)}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  title="Open Consultation"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
