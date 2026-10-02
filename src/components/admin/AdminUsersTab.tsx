import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Eye, 
  Compass, 
  History, 
  Ban, 
  CheckCircle, 
  Filter, 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserAccount, AdminUserItem, AdminConsultationRecord } from '../../types';
import { authService } from '../../services/auth/authService';

interface AdminUsersTabProps {
  users?: any[];
  consultations?: any[];
  onToggleUserStatus?: (userId: string) => void;
  onOpenKundli?: (user: any) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  onOpenKundli,
}) => {
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('All');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserAccount | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const currentUser = authService.getCurrentUser();
    const res = await authService.listAllUsersForAdmin(currentUser);
    setLoading(false);
    if (res.success) {
      setUserList(res.data);
    } else {
      setError(res.error || 'Failed to load user directory for admin oversight.');
    }
  };

  const handleToggleStatus = async (targetUser: UserAccount) => {
    setActionError(null);
    const currentUser = authService.getCurrentUser();
    const nextStatus = targetUser.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const res = await authService.updateUserStatusForAdmin(currentUser, targetUser.id, nextStatus);
    if (!res.success) {
      setActionError(res.error);
    } else {
      loadUsers();
    }
  };

  const filteredUsers = userList.filter((u) => {
    const name = u.displayName || 'User';
    const email = u.email || '';
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === 'All' || u.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar: Title & Safety Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Registered User Directory</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 border border-[#233562] font-mono">
              {filteredUsers.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse registered client accounts, verify roles, inspect user metadata, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Real-time user repository synchronization active.</span>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((status) => (
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

      {/* Users Table */}
      <div className="border border-[#1e2b4f] rounded-2xl overflow-hidden bg-[#0a0f1d] shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">Loading registered users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-1.5 text-center">
              <Users className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No registered users found.</p>
              <p className="text-[11px] text-slate-500">
                Registered user accounts will be listed here automatically for platform administration.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e162b] border-b border-[#1e2b4f] text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Name / Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b4f]/60">
                {filteredUsers.map((user) => {
                  const upperStatus = user.status?.toUpperCase() || 'ACTIVE';
                  const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-[#0f172a]/60 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#111a30] border border-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block">{user.displayName || 'Unnamed User'}</span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {user.email}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono block">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#16203c] text-amber-300 border border-[#233562] font-mono text-[10px] font-bold uppercase">
                          {user.role}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            upperStatus === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : upperStatus === 'PENDING'
                              ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            upperStatus === 'ACTIVE' ? 'bg-emerald-400' : upperStatus === 'PENDING' ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Profile Modal Trigger */}
                          <button
                            onClick={() => setSelectedUserForProfile(user)}
                            className="p-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] transition-all"
                            title="View Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Activate */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              upperStatus === 'SUSPENDED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                            title={upperStatus === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}
                          >
                            {upperStatus === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </button>
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

      {/* User Detail Modal */}
      {selectedUserForProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c1222] border border-[#1e2b4f] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b4f] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-slate-100 text-sm">User Details</h3>
              </div>
              <button
                onClick={() => setSelectedUserForProfile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">User ID:</span>
                <span className="font-mono text-amber-300 text-[11px]">{selectedUserForProfile.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-slate-100">{selectedUserForProfile.displayName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-mono">{selectedUserForProfile.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">Role:</span>
                <span className="font-mono text-amber-400 uppercase font-bold">{selectedUserForProfile.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">Account Status:</span>
                <span className="font-bold text-slate-200">{selectedUserForProfile.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2b4f]/40">
                <span className="text-slate-400">Created At:</span>
                <span className="text-slate-300 font-mono text-[11px]">{selectedUserForProfile.createdAt}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUserForProfile(null)}
              className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
