import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  UserCheck 
} from 'lucide-react';
import { AstrologerPanelTab } from '../../types';
import { useTranslation } from '../../services/languageService';

interface AstrologerBottomNavProps {
  activeTab: AstrologerPanelTab;
  onNavigateTab: (tab: AstrologerPanelTab) => void;
}

export const AstrologerBottomNav: React.FC<AstrologerBottomNavProps> = ({
  activeTab,
  onNavigateTab,
}) => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-lg border-t border-[#1e2b4f] px-2 py-1.5 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* 1. Dashboard */}
        <button
          id="astro-nav-dashboard-btn"
          onClick={() => onNavigateTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('astrologerDashboard')}</span>
          {activeTab === 'dashboard' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 2. Clients */}
        <button
          id="astro-nav-clients-btn"
          onClick={() => onNavigateTab('clients')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'clients'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('clients')}</span>
          {activeTab === 'clients' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 3. Consultations */}
        <button
          id="astro-nav-consultations-btn"
          onClick={() => onNavigateTab('consultations')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'consultations'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('consultations')}</span>
          {activeTab === 'consultations' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 4. Profile */}
        <button
          id="astro-nav-profile-btn"
          onClick={() => onNavigateTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'profile'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('profile')}</span>
          {activeTab === 'profile' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>
      </div>
    </nav>
  );
};
