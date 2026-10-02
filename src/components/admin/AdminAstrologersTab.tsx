/**
 * Admin Astrologers Tab
 * 
 * Allows an authorized ADMIN to view all registered astrologer profiles from Firestore
 * and approve or reject them, enforcing the strict Step 15 access control.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Check, 
  X, 
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { AstrologerProfile } from '../../types';
import { astrologerService } from '../../services/astrologerService';
import { authService } from '../../services/auth/authService';

interface AdminAstrologersTabProps {
  // kept for compatibility if passed
  astrologers?: any[];
  onUpdateStatus?: (id: string, newStatus: any) => void;
}

export const AdminAstrologersTab: React.FC<AdminAstrologersTabProps> = () => {
  const [astrologers, setAstrologers] = useState<AstrologerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved'>('All');

  useEffect(() => {
    loadAstrologers();
  }, []);

  const loadAstrologers = async () => {
    setLoading(true);
    setError(null);
    const user = authService.getCurrentUser();
    const res = await astrologerService.listAllAstrologers(user);
    setLoading(false);
    if (res.success) {
      setAstrologers(res.data);
    } else {
      setError(res.error || 'Failed to load astrologers for admin review.');
    }
  };

  const handleApproveToggle = async (astrologerId: string, makeApproved: boolean) => {
    setError(null);
    const user = authService.getCurrentUser();
    const res = await astrologerService.adminApproveAstrologer(user, astrologerId, makeApproved);
    if (!res.success) {
      setError(res.error);
    } else {
      // Refresh list
      loadAstrologers();
    }
  };

  const filteredAstrologers = astrologers.filter((a) => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      statusFilter === 'All' ||
      (statusFilter === 'Approved' && a.isApproved) ||
      (statusFilter === 'Pending' && !a.isApproved);

    return matchesSearch && matchesFilter;
  });

  const pendingCount = astrologers.filter(a => !a.isApproved).length;
  const approvedCount = astrologers.filter(a => a.isApproved).length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Firestore Astrologer Approval Management</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono border border-[#233562]">
                {astrologers.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review credential submissions and approve astrologer profiles to make them visible in the public directory.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Admin Authorization Verified</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Chips */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, title, specialization, or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Pending', 'Approved'] as const).map((filter) => {
            const count = filter === 'All' 
              ? astrologers.length 
              : filter === 'Approved' ? approvedCount : pendingCount;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === filter
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-[#111a30] text-slate-300 hover:text-slate-100 hover:bg-[#16203c] border border-[#1e2b4f]'
                }`}
              >
                <span>{filter}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  statusFilter === filter ? 'bg-slate-950/20 text-slate-950' : 'bg-[#16203c] text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Astrologers Table */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-[#0a0f1d] border border-[#1e2b4f] rounded-2xl">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading astrologer profiles from Firestore...</p>
        </div>
      ) : filteredAstrologers.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-[#0a0f1d] border border-[#1e2b4f] rounded-2xl p-6">
          <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No astrologer profiles found.</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            No astrologers match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="border border-[#1e2b4f] rounded-2xl overflow-hidden bg-[#0a0f1d] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e162b] border-b border-[#1e2b4f] text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Astrologer</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Languages</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b4f]/60">
                {filteredAstrologers.map((astro) => (
                  <tr key={astro.id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {astro.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 block">{astro.name}</span>
                          <span className="text-[10px] text-amber-300 block">{astro.title}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-[200px]">
                      <span className="line-clamp-1">{astro.skills.join(', ')}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400 text-[11px]">
                        {astro.languages.join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-amber-300 font-bold">
                      ₹{astro.perMinuteCharge}/min
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        astro.isApproved 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}>
                        {astro.isApproved ? 'Approved' : 'Pending Review'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {astro.isApproved ? (
                        <button
                          onClick={() => handleApproveToggle(astro.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Revoke Approval</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveToggle(astro.id, true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Profile</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
