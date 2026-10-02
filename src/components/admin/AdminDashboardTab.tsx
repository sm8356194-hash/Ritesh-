import React from 'react';
import { 
  Users, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  Clock, 
  LifeBuoy, 
  AlertCircle,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { AdminSection, AdminUserItem, AdminAstrologerItem, AdminConsultationRecord, AdminPaymentRecord, AdminSupportTicket } from '../../types';

interface AdminDashboardTabProps {
  users: AdminUserItem[];
  astrologers: AdminAstrologerItem[];
  consultations: AdminConsultationRecord[];
  payments: AdminPaymentRecord[];
  tickets: AdminSupportTicket[];
  onNavigateSection: (section: AdminSection) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  users,
  astrologers,
  consultations,
  payments,
  tickets,
  onNavigateSection,
}) => {
  // Demo aggregated counts (realistic, not inflated)
  const totalUsersDemo = 128; // Realistic demo scale
  const totalAstrologersDemo = astrologers.length;
  const activeConsultationsDemo = consultations.filter(c => c.status === 'Active' || c.status === 'Requested').length;
  const completedConsultationsDemo = consultations.filter(c => c.status === 'Completed').length + 58; // 64 total demo completed

  // Demo revenue calculation from settled payments
  const totalDemoGross = payments.reduce((acc, p) => acc + p.demoAmount, 0) + 18500;
  const platformMarginDemo = Math.round(totalDemoGross * 0.20);
  const astrologerPayoutDemo = totalDemoGross - platformMarginDemo;

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;
  const pendingAstrologersCount = astrologers.filter(a => a.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Platform Owner Welcome & Demo Disclaimer Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a30] via-[#0c1222] to-[#111a30] border border-amber-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                ADMIN PROTOTYPE — DEMO DATA ONLY
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-100 mt-1.5">
              Platform Overview & Operations Center
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring prototype for user engagement, astrologer availability, consultation dispatch, and settlement ledger. All statistics below represent demonstration scenarios.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateSection('users')}
              className="px-3 py-2 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-xs font-bold border border-[#233562] transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => onNavigateSection('astrologers')}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Astrologers ({pendingAstrologersCount} Pending)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Required Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users — Demo */}
        <div 
          onClick={() => onNavigateSection('users')}
          className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Users — Demo</span>
            <div className="w-8 h-8 rounded-lg bg-[#111a30] group-hover:bg-amber-400/20 text-slate-300 group-hover:text-amber-300 flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-slate-100">
              {totalUsersDemo}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center">
              +12 this week
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Registered profiles</span>
            <span className="text-amber-400/80 group-hover:text-amber-300 text-[10px] font-bold flex items-center">
              View list <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>

        {/* Total Astrologers — Demo */}
        <div 
          onClick={() => onNavigateSection('astrologers')}
          className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Astrologers — Demo</span>
            <div className="w-8 h-8 rounded-lg bg-[#111a30] group-hover:bg-amber-400/20 text-slate-300 group-hover:text-amber-300 flex items-center justify-center transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-slate-100">
              {totalAstrologersDemo}
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
              {pendingAstrologersCount} awaiting review
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Specialists & Readers</span>
            <span className="text-amber-400/80 group-hover:text-amber-300 text-[10px] font-bold flex items-center">
              Review <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>

        {/* Active Consultations — Demo */}
        <div 
          onClick={() => onNavigateSection('consultations')}
          className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Consultations — Demo</span>
            <div className="w-8 h-8 rounded-lg bg-[#111a30] group-hover:bg-emerald-400/20 text-slate-300 group-hover:text-emerald-300 flex items-center justify-center transition-colors">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-emerald-300">
              {activeConsultationsDemo}
            </span>
            <span className="text-[10px] text-slate-400">
              Live in session now
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Chat & Voice slots</span>
            <span className="text-amber-400/80 group-hover:text-amber-300 text-[10px] font-bold flex items-center">
              Live queue <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>

        {/* Completed Consultations — Demo */}
        <div 
          onClick={() => onNavigateSection('consultations')}
          className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Completed Consultations — Demo</span>
            <div className="w-8 h-8 rounded-lg bg-[#111a30] group-hover:bg-amber-400/20 text-slate-300 group-hover:text-amber-300 flex items-center justify-center transition-colors">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-slate-100">
              {completedConsultationsDemo}
            </span>
            <span className="text-[10px] text-slate-400">
              Sessions fulfilled
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Historic logs</span>
            <span className="text-amber-400/80 group-hover:text-amber-300 text-[10px] font-bold flex items-center">
              History <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>
      </div>

      {/* DEMO Analytics Section: User Registrations, Consultation Activity, Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. User Registrations (Demo Trend) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-100">
                User Registrations (Demo)
              </h3>
              <p className="text-[10px] text-slate-400">Past 7 days sign-up velocity</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +18% W-o-W
            </span>
          </div>

          {/* Simple Clean Bar Chart Demonstration */}
          <div className="space-y-2 pt-2">
            {[
              { day: 'Mon', count: 14, percent: '56%' },
              { day: 'Tue', count: 18, percent: '72%' },
              { day: 'Wed', count: 22, percent: '88%' },
              { day: 'Thu', count: 16, percent: '64%' },
              { day: 'Fri', count: 25, percent: '100%' },
              { day: 'Sat', count: 21, percent: '84%' },
              { day: 'Sun', count: 12, percent: '48%' },
            ].map((d) => (
              <div key={d.day} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-[11px] text-slate-400 font-mono">{d.day}</span>
                <div className="flex-1 bg-[#111a30] h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                    style={{ width: d.percent }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] font-mono font-bold text-slate-300">
                  {d.count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#1e2b4f] flex items-center justify-between text-[11px] text-slate-400">
            <span>Total weekly: 128 accounts</span>
            <span className="text-amber-400/80">Demo sample</span>
          </div>
        </div>

        {/* 2. Consultation Activity (by Type) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-100">
                Consultation Activity (Demo)
              </h3>
              <p className="text-[10px] text-slate-400">Distribution by interaction medium</p>
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Active Modes
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Chat Consultations */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Chat Consultations
                </span>
                <span className="font-mono font-bold text-slate-200">58% (37 sessions)</span>
              </div>
              <div className="w-full bg-[#111a30] h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            {/* Voice Consultations */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Voice Consultations
                </span>
                <span className="font-mono font-bold text-slate-200">32% (20 sessions)</span>
              </div>
              <div className="w-full bg-[#111a30] h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: '32%' }} />
              </div>
            </div>

            {/* Video Consultations */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Video Consultations
                </span>
                <span className="font-mono font-bold text-slate-200">10% (7 sessions)</span>
              </div>
              <div className="w-full bg-[#111a30] h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] text-[11px] text-slate-400 leading-tight">
            Chat consultations maintain highest retention with average session length of 22 minutes.
          </div>
        </div>

        {/* 3. Revenue — Demo Only */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-100">
                Revenue — Demo Only
              </h3>
              <p className="text-[10px] text-slate-400">Platform billing volume snapshot</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ₹24,850 Total
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c1222] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Gross Volume (Demo):</span>
              <span className="font-mono font-bold text-slate-100">₹{totalDemoGross.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-medium">Platform Margin (20%):</span>
              <span className="font-mono font-bold text-amber-300">₹{platformMarginDemo.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e2b4f]">
              <span className="text-slate-400">Astrologer Net Payout (80%):</span>
              <span className="font-mono font-bold text-slate-200">₹{astrologerPayoutDemo.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] text-slate-400 leading-relaxed bg-[#111a30] p-2.5 rounded-xl border border-[#1e2b4f]">
            <p className="font-bold text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> No Real Payments Connected
            </p>
            <p>
              Financial amounts displayed are illustrative prototype simulations. No merchant gateway or banking API is tied to this demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Highlights & Pending Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Astrologer Approvals */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pending Astrologer Reviews ({pendingAstrologersCount})</span>
            </h3>
            <button
              onClick={() => onNavigateSection('astrologers')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {astrologers
              .filter(a => a.status === 'Pending')
              .map((astro) => (
                <div 
                  key={astro.id}
                  className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-200">{astro.name}</h4>
                    <p className="text-[11px] text-slate-400">{astro.specialization}</p>
                    <span className="text-[10px] text-amber-300">₹{astro.demoPrice}/min • {astro.experienceYears} yrs exp</span>
                  </div>
                  <button
                    onClick={() => onNavigateSection('astrologers')}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold shrink-0 transition-all"
                  >
                    Review
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Support & Dispute Queue Preview */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-100 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Recent Support Tickets ({openTicketsCount} Open)</span>
            </h3>
            <button
              onClick={() => onNavigateSection('reports')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold"
            >
              Support Desk
            </button>
          </div>

          <div className="space-y-2">
            {tickets.slice(0, 3).map((ticket) => (
              <div 
                key={ticket.id}
                className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200">{ticket.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      ticket.status === 'Open' 
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {ticket.description}
                  </p>
                  <span className="text-[10px] text-slate-500">By {ticket.submittedBy} ({ticket.userRole}) • {ticket.date}</span>
                </div>
                <button
                  onClick={() => onNavigateSection('reports')}
                  className="px-2 py-1 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-[10px] font-bold shrink-0 transition-all"
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
