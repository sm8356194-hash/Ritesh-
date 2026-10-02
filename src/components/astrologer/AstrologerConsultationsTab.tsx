import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  PhoneCall, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  Check,
  X,
  Play,
  AlertCircle
} from 'lucide-react';
import { DemoConsultationItem, DemoClient, ConsultationRecord } from '../../types';
import { consultationService } from '../../services/consultationService';
import { astrologerService } from '../../services/astrologerService';
import { authService } from '../../services/auth/authService';
import { DEMO_ASTROLOGER_PROFILE } from '../../data/demoClients';

interface AstrologerConsultationsTabProps {
  consultations: DemoConsultationItem[];
  clients: DemoClient[];
  onStartConsultationWithClient: (client: DemoClient) => void;
  onOpenConsultationSession?: (consultation: ConsultationRecord) => void;
}

export const AstrologerConsultationsTab: React.FC<AstrologerConsultationsTabProps> = ({
  consultations: demoConsultations,
  clients,
  onStartConsultationWithClient,
  onOpenConsultationSession,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [realConsultations, setRealConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadRealConsultations();
  }, []);

  const loadRealConsultations = async () => {
    setLoading(true);
    const user = authService.getCurrentUser();
    if (user) {
      let astroId = DEMO_ASTROLOGER_PROFILE.id;
      const astroRes = await astrologerService.getAstrologerByUserId(user.id);
      if (astroRes.success && astroRes.data) {
        astroId = astroRes.data.id;
      }
      const res = await consultationService.listAstrologerConsultations(user, astroId);
      if (res.success) {
        setRealConsultations(res.data);
      }
    }
    setLoading(false);
  };

  const handleAccept = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.acceptConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadRealConsultations();
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.rejectConsultation(user, id, 'Rejected by astrologer');
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadRealConsultations();
    }
  };

  const handleStart = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.startConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadRealConsultations();
    }
  };

  const handleComplete = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.completeConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadRealConsultations();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'IN PROGRESS':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'CONFIRMED':
      case 'UPCOMING':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'REQUESTED':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-3.5 pb-24 text-slate-100">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Real Consultation Management</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Manage client requests: REQUESTED → CONFIRMED → ACTIVE → COMPLETED.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-mono">
            LIVE WORKFLOW
          </span>
        </div>

        {actionError && (
          <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search consultation by client or topic..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none">
          {['All', 'REQUESTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                filterType === f
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-[#111a30] border-[#1e2b4f] text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Loading consultation requests...</div>
        ) : realConsultations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No consultation requests yet.</p>
            <p className="text-[11px] text-slate-500">
              New requests submitted by users will appear here automatically for acceptance and scheduling.
            </p>
          </div>
        ) : (
          realConsultations
            .filter((item) => {
              const matchesFilter = filterType === 'All' || item.status.toUpperCase() === filterType.toUpperCase();
              const matchesSearch = item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.topic && item.topic.toLowerCase().includes(searchQuery.toLowerCase()));
              return matchesFilter && matchesSearch;
            })
            .map((session) => {
              const matchedClient = clients.find(c => c.id === session.userId || c.name === session.userName);

              return (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-500/30 transition-all shadow-md space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                          {session.userName}
                        </h3>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
                          {session.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300/90 font-medium mt-0.5">
                        {session.topic || 'General Vedic Consultation'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusBadge(session.status)}`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2b4f]/60 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{session.scheduledDate} • {session.scheduledTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{session.durationMinutes} Mins • ₹{session.fee || (session.durationMinutes * 15)}</span>
                    </div>
                  </div>

                  {/* Payment Status & Expected Share */}
                  <div className="p-2 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Payment:</span>
                      <span className={`font-semibold px-2 py-0.2 rounded text-[10px] uppercase ${
                        session.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : session.paymentStatus === 'PAYMENT_PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {session.paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Est. Net Share (85%): </span>
                      <span className="text-amber-300 font-mono font-bold">
                        ₹{Math.round((session.fee || (session.durationMinutes * 15)) * 0.85)}
                      </span>
                    </div>
                  </div>

                  {/* Actions based on status */}
                  <div className="pt-2 border-t border-[#1e2b4f]/60 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {session.id}</span>

                    <div className="flex items-center gap-2">
                      {(session.status === 'REQUESTED' || session.status === 'Requested') && (
                        <>
                          <button
                            onClick={() => handleReject(session.id)}
                            className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleAccept(session.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </>
                      )}

                      {(session.status === 'CONFIRMED' || session.status === 'Accepted') && (
                        <button
                          onClick={() => handleStart(session.id)}
                          className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Start Consultation</span>
                        </button>
                      )}

                      {session.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleComplete(session.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Consultation</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (onOpenConsultationSession) {
                            onOpenConsultationSession(session);
                          } else if (matchedClient) {
                            onStartConsultationWithClient(matchedClient);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {session.status === 'COMPLETED' || session.status === 'CANCELLED' || session.status === 'REJECTED'
                            ? 'View Archive'
                            : 'Chat Workspace'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Strict role security enforced: Only assigned astrologer can manage consultation lifecycle states.</span>
      </div>
    </div>
  );
};
