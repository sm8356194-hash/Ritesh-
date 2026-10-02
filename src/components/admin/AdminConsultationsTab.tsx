import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Video, 
  FileText,
  Filter,
  DollarSign,
  Loader2,
  AlertCircle,
  Play,
  Check,
  X
} from 'lucide-react';
import { ConsultationRecord } from '../../types';
import { consultationService } from '../../services/consultationService';
import { authService } from '../../services/auth/authService';

interface AdminConsultationsTabProps {
  consultations?: any[];
  onUpdateConsultationStatus?: (id: string, newStatus: any) => void;
}

export const AdminConsultationsTab: React.FC<AdminConsultationsTabProps> = () => {
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    setLoading(true);
    setError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.listAllConsultationsForAdmin(user);
    setLoading(false);
    if (res.success) {
      setConsultations(res.data);
    } else {
      setError(res.error || 'Failed to load consultations for admin oversight.');
    }
  };

  const handleAccept = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.acceptConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadConsultations();
    }
  };

  const handleStart = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.startConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadConsultations();
    }
  };

  const handleComplete = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.completeConsultation(user, id);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadConsultations();
    }
  };

  const handleCancel = async (id: string) => {
    setActionError(null);
    const user = authService.getCurrentUser();
    const res = await consultationService.cancelConsultation(user, id, 'Cancelled by Admin platform oversight');
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadConsultations();
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    const topic = c.topic || 'General Consultation';
    const matchesSearch = 
      c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.astrologerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesType = typeFilter === 'All' || c.type.toUpperCase() === typeFilter.toUpperCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REQUESTED':
        return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
      case 'CONFIRMED':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      default:
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Platform Consultation Oversight</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono border border-[#233562]">
                {filteredConsultations.length} Sessions Listed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supervise platform consultation sessions, monitor active Jyotish discussions, and inspect persistent consultation records.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Real-time platform synchronization active.</span>
          </div>
        </div>

        {actionError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, astrologer, consultation topic, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['All', 'REQUESTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((status) => (
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

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none border-l border-[#1e2b4f] pl-2">
          {['All', 'Chat', 'Voice', 'Video'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-[#233562] text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations Table */}
      <div className="border border-[#1e2b4f] rounded-2xl overflow-hidden bg-[#0a0f1d] shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">Loading platform consultations...</span>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-1.5 text-center">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No consultation records match criteria.</p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Real consultations booked by users will appear here automatically for administrative oversight.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e162b] border-b border-[#1e2b4f] text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Session ID / Topic</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Astrologer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Fee / Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b4f]/60">
                {filteredConsultations.map((c) => {
                  const upperStatus = c.status?.toUpperCase();
                  const feeAmount = c.fee || (c.durationMinutes ? c.durationMinutes * 15 : 450);

                  return (
                    <tr key={c.id} className="hover:bg-[#0f172a]/60 transition-colors">
                      {/* Session ID & Topic */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-amber-300 text-[10px] block font-bold">
                          {c.id}
                        </span>
                        <span className="font-bold text-slate-200 block truncate max-w-[200px]" title={c.topic || 'Vedic Astrology Consultation'}>
                          {c.topic || 'General Vedic Consultation'}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-200 block">{c.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.userId}</span>
                      </td>

                      {/* Astrologer */}
                      <td className="py-3 px-4">
                        <span className="text-slate-200 block">{c.astrologerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.astrologerId}</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111a30] text-slate-300 border border-[#1e2b4f] text-[10px] font-mono">
                          {c.type === 'Chat' && <MessageSquare className="w-3 h-3 text-amber-400" />}
                          {c.type === 'Voice' && <Phone className="w-3 h-3 text-blue-400" />}
                          {c.type === 'Video' && <Video className="w-3 h-3 text-purple-400" />}
                          <span>{c.type}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(c.status)}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            upperStatus === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : upperStatus === 'REQUESTED' ? 'bg-amber-400' : upperStatus === 'COMPLETED' ? 'bg-blue-400' : 'bg-rose-400'
                          }`} />
                          {c.status}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        <div>{c.scheduledDate}</div>
                        <div className="text-[10px] text-slate-500">{c.scheduledTime} ({c.durationMinutes} mins)</div>
                      </td>

                      {/* Demo Amount */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-300">
                          ₹{feeAmount}
                        </span>
                        <span className="block text-[9px] text-slate-400 uppercase">
                          {c.paymentStatus || 'PAID'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {upperStatus === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => handleAccept(c.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all"
                                title="Approve/Accept Session"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleCancel(c.id)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition-all"
                                title="Cancel Session"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {upperStatus === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStart(c.id)}
                              className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold transition-all"
                              title="Start Session"
                            >
                              Start
                            </button>
                          )}

                          {upperStatus === 'ACTIVE' && (
                            <button
                              onClick={() => handleComplete(c.id)}
                              className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition-all"
                              title="Complete Active Session"
                            >
                              Complete
                            </button>
                          )}

                          {upperStatus === 'COMPLETED' && (
                            <span className="text-[10px] text-emerald-400 font-mono px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                              Fulfilled
                            </span>
                          )}

                          {(upperStatus === 'CANCELLED' || upperStatus === 'REJECTED') && (
                            <span className="text-[10px] text-slate-500 font-mono px-2 py-1">
                              Void
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
