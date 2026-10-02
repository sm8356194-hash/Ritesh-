import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  MessageSquare, 
  CreditCard, 
  LifeBuoy, 
  FileText, 
  Settings, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  PhoneCall
} from 'lucide-react';
import { AdminSection } from '../../types';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  counts?: {
    users: number;
    astrologers: number;
    consultations: number;
    openTickets: number;
  };
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onNavigateSection,
  counts,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('adminDashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      label: t('users'),
      icon: Users,
      badge: counts?.users,
    },
    {
      id: 'astrologers',
      label: t('astrologers'),
      icon: Sparkles,
      badge: counts?.astrologers,
    },
    {
      id: 'consultations',
      label: t('consultations'),
      icon: MessageSquare,
      badge: counts?.consultations,
    },
    {
      id: 'payments',
      label: `${t('payments')} / ${t('accounting')}`,
      icon: CreditCard,
      badge: 'Demo',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: LifeBuoy,
      badge: counts?.openTickets ? `${counts.openTickets} open` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'content',
      label: t('content'),
      icon: FileText,
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
    },
  ];

  const handleSelectSection = (section: AdminSection) => {
    onNavigateSection(section);
    setMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Navigation Section Title */}
        <div className="px-3 pt-2">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Platform Management
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 font-bold border border-amber-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-[#111a30] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        item.badgeColor || 'bg-[#16203c] text-slate-300 border-[#233562]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Language Selector in Sidebar */}
      <div className="mt-4 pt-3 border-t border-[#1e2b4f]/60">
        <GlobalLanguageSelector variant="expanded" id="admin-sidebar-lang-selector" />
      </div>

      {/* Bottom Disclaimer & Environment Status */}
      <div className="p-3 bg-[#0c1222] rounded-2xl border border-[#1e2b4f] space-y-2 mt-6">
        <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>PROTOTYPE ENVIRONMENT</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Demo data only. No real user, astrologer, payment or consultation data is connected.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md and up) */}
      <aside className="hidden md:block w-64 shrink-0 bg-[#070b14] border-r border-[#1e2b4f] p-4 min-h-[calc(100vh-53px)] sticky top-[53px]">
        {navContent}
      </aside>

      {/* Mobile Drawer (visible on mobile when menu opened) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#070b14] border-r border-[#1e2b4f] p-4 flex flex-col z-10 shadow-2xl h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2b4f] mb-4">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-slate-100">Admin Console</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  DEMO
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#111a30]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
