import React, { useState, useEffect } from 'react';
import { AppPortalMode, AdminSection, AdminUserItem, AdminAstrologerItem, AdminConsultationRecord, AdminPaymentRecord, AdminSupportTicket, AdminPlatformSettings } from '../../types';
import { 
  INITIAL_ADMIN_USERS, 
  INITIAL_ADMIN_ASTROLOGERS, 
  INITIAL_ADMIN_CONSULTATIONS, 
  INITIAL_ADMIN_PAYMENTS, 
  INITIAL_ADMIN_TICKETS, 
  INITIAL_ADMIN_SETTINGS 
} from '../../data/adminMockData';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminAstrologersTab } from './AdminAstrologersTab';
import { AdminConsultationsTab } from './AdminConsultationsTab';
import { AdminPaymentsTab } from './AdminPaymentsTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminContentTab } from './AdminContentTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminSharedKundliModal } from './AdminSharedKundliModal';
import { authService } from '../../services/auth/authService';
import { astrologerService } from '../../services/astrologerService';
import { consultationService } from '../../services/consultationService';

interface AdminPanelProps {
  onSwitchPortalMode: (mode: AppPortalMode) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSwitchPortalMode }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform state in memory (prototype)
  const [users, setUsers] = useState<AdminUserItem[]>(INITIAL_ADMIN_USERS);
  const [astrologers, setAstrologers] = useState<AdminAstrologerItem[]>(INITIAL_ADMIN_ASTROLOGERS);
  const [consultations, setConsultations] = useState<AdminConsultationRecord[]>(INITIAL_ADMIN_CONSULTATIONS);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>(INITIAL_ADMIN_PAYMENTS);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>(INITIAL_ADMIN_TICKETS);
  const [settings, setSettings] = useState<AdminPlatformSettings>(INITIAL_ADMIN_SETTINGS);

  // Live count state
  const [liveUserCount, setLiveUserCount] = useState<number>(INITIAL_ADMIN_USERS.length);
  const [liveAstrologerCount, setLiveAstrologerCount] = useState<number>(INITIAL_ADMIN_ASTROLOGERS.length);
  const [liveConsultationCount, setLiveConsultationCount] = useState<number>(INITIAL_ADMIN_CONSULTATIONS.length);

  useEffect(() => {
    loadLiveCounts();
  }, [activeSection]);

  const loadLiveCounts = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      const uRes = await authService.listAllUsersForAdmin(user);
      if (uRes.success) setLiveUserCount(uRes.data.length);

      const aRes = await astrologerService.listAllAstrologers(user);
      if (aRes.success) setLiveAstrologerCount(aRes.data.length);

      const cRes = await consultationService.listAllConsultationsForAdmin(user);
      if (cRes.success) setLiveConsultationCount(cRes.data.length);
    }
  };

  // Shared Kundli modal state
  const [inspectingKundliUser, setInspectingKundliUser] = useState<AdminUserItem | null>(null);

  // User Actions
  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Astrologer Actions
  const handleUpdateAstrologerStatus = (id: string, newStatus: 'Approved' | 'Pending' | 'Suspended') => {
    setAstrologers(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // Consultation Actions
  const handleUpdateConsultationStatus = (id: string, newStatus: 'Requested' | 'Active' | 'Completed' | 'Cancelled') => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  // Payment Actions
  const handleUpdatePaymentStatus = (id: string, newStatus: 'Settled' | 'Pending' | 'Refunded') => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  // Support Ticket Actions
  const handleToggleTicketStatus = (id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Open' ? 'Resolved' : 'Open';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Settings Actions
  const handleUpdateSettings = (newSettings: Partial<AdminPlatformSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Counts for badge displays in sidebar
  const pendingAstrologersCount = astrologers.filter(a => a.status === 'Pending').length;
  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Admin Header */}
      <AdminHeader
        activeSection={activeSection}
        onNavigateSection={(section) => setActiveSection(section)}
        onSwitchToClientApp={() => onSwitchPortalMode('client')}
        onSwitchToAstrologerPanel={() => onSwitchPortalMode('astrologer')}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Admin Workspace (Sidebar + Tab View) */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar & Mobile Drawer */}
        <AdminSidebar
          activeSection={activeSection}
          onNavigateSection={(section: AdminSection) => {
            setActiveSection(section);
            setMobileMenuOpen(false);
          }}
          counts={{
            users: liveUserCount,
            astrologers: liveAstrologerCount,
            consultations: liveConsultationCount,
            openTickets: openTicketsCount,
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Dynamic Section Tab Canvas */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeSection === 'dashboard' && (
            <AdminDashboardTab
              users={users}
              astrologers={astrologers}
              consultations={consultations}
              payments={payments}
              tickets={tickets}
              onNavigateSection={(sec) => setActiveSection(sec)}
            />
          )}

          {activeSection === 'users' && (
            <AdminUsersTab
              users={users}
              consultations={consultations}
              onToggleUserStatus={handleToggleUserStatus}
              onOpenKundli={(user) => setInspectingKundliUser(user)}
            />
          )}

          {activeSection === 'astrologers' && (
            <AdminAstrologersTab
              astrologers={astrologers}
              onUpdateStatus={handleUpdateAstrologerStatus}
            />
          )}

          {activeSection === 'consultations' && (
            <AdminConsultationsTab
              consultations={consultations}
              onUpdateConsultationStatus={handleUpdateConsultationStatus}
            />
          )}

          {activeSection === 'payments' && (
            <AdminPaymentsTab
              payments={payments}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}

          {activeSection === 'reports' && (
            <AdminReportsTab
              tickets={tickets}
              onToggleTicketStatus={handleToggleTicketStatus}
            />
          )}

          {activeSection === 'content' && (
            <AdminContentTab />
          )}

          {activeSection === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {/* Mandatory Demo / Privacy Notice at Bottom of Admin Canvas */}
          <footer className="mt-12 pt-6 border-t border-[#1e2b4f] pb-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-mono text-amber-400/80 font-bold uppercase tracking-wider">
              ADMIN PROTOTYPE — DEMO DATA ONLY
            </p>
            <p className="max-w-xl mx-auto text-[11px] text-slate-400">
              No real user, astrologer, payment or consultation data is connected. Built strictly as a prototype interface demonstration for Talk With Astrologers platform operators.
            </p>
          </footer>
        </main>
      </div>

      {/* Shared Kundli Horoscopic Modal */}
      {inspectingKundliUser && (
        <AdminSharedKundliModal
          user={inspectingKundliUser}
          onClose={() => setInspectingKundliUser(null)}
        />
      )}
    </div>
  );
};
