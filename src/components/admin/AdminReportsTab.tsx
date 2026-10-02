import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  X, 
  MessageSquare, 
  Filter, 
  FileText,
  UserCheck
} from 'lucide-react';
import { AdminSupportTicket } from '../../types';

interface AdminReportsTabProps {
  tickets: AdminSupportTicket[];
  onToggleTicketStatus: (id: string) => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  tickets,
  onToggleTicketStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);

  const categories = [
    'All',
    'User Complaint',
    'Astrologer Complaint',
    'Consultation Dispute',
    'Support Request',
  ];

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <span>Reports & Support Queue (Demo)</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono border border-[#233562]">
                {filteredTickets.length} Tickets
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track client grievances, astrologer reporting, session dispute tickets, and platform support queries.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Demonstration ticketing desk. No external email or notification dispatch.</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by title, description, or submitter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-[#111a30] text-slate-300 hover:text-slate-100 hover:bg-[#16203c] border border-[#1e2b4f]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 border-l border-[#1e2b4f] pl-2">
          {(['All', 'Open', 'Resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                statusFilter === status
                  ? 'bg-[#233562] text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-[#0a0f1d] border border-[#1e2b4f] rounded-2xl text-slate-400 text-xs">
            No support tickets match the selected filters.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] hover:border-amber-500/30 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-amber-300 text-xs font-bold">
                    {ticket.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111a30] text-slate-300 border border-[#1e2b4f] font-medium">
                    {ticket.category}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    ticket.priority === 'High' 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : ticket.priority === 'Medium'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ticket.status === 'Open'
                        ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      ticket.status === 'Open' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    {ticket.status}
                  </span>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {ticket.date}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-100">{ticket.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              {/* Submitter & Actions Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#1e2b4f]/60 text-xs">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-slate-500">Submitted by:</span>
                  <span className="font-bold text-slate-200">{ticket.submittedBy}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#16203c] text-amber-300">
                    {ticket.userRole}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-2.5 py-1 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] text-[11px] font-medium transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => onToggleTicketStatus(ticket.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      ticket.status === 'Open'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border-amber-400/40'
                    }`}
                  >
                    {ticket.status === 'Open' ? 'Mark as Resolved' : 'Mark as Open'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0a0f1d] border border-amber-500/30 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b4f]">
              <div>
                <span className="text-[10px] font-mono text-amber-300 block">{selectedTicket.id}</span>
                <h3 className="font-serif font-bold text-slate-100">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-[#111a30] text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-amber-300">{selectedTicket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-slate-200">{selectedTicket.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted By:</span>
                  <span className="font-bold text-slate-200">{selectedTicket.submittedBy} ({selectedTicket.userRole})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submission Date:</span>
                  <span className="font-mono text-slate-300">{selectedTicket.date}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-bold mb-1">Detailed Grievance / Inquiry:</span>
                <div className="p-3 rounded-xl bg-[#0c1222] border border-[#1e2b4f] text-slate-300 leading-relaxed text-[11px]">
                  {selectedTicket.description}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#1e2b4f]">
              <button
                onClick={() => {
                  onToggleTicketStatus(selectedTicket.id);
                  setSelectedTicket(prev => prev ? { ...prev, status: prev.status === 'Open' ? 'Resolved' : 'Open' } : null);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all"
              >
                {selectedTicket.status === 'Open' ? 'Mark as Resolved' : 'Re-open Ticket'}
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 rounded-lg bg-[#16203c] text-slate-300 hover:text-slate-100 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
