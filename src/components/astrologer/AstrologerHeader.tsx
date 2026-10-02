import React from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Settings, 
  ShieldCheck, 
  UserCheck, 
  Layers,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';
import { Astrologer, AstrologerPanelTab } from '../../types';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AstrologerHeaderProps {
  astrologer: Astrologer;
  activeTab: AstrologerPanelTab;
  onSwitchToClientApp: () => void;
  onSwitchToAdminPanel?: () => void;
  onOpenSettingsOrProfile: () => void;
}

export const AstrologerHeader: React.FC<AstrologerHeaderProps> = ({
  astrologer,
  activeTab,
  onSwitchToClientApp,
  onSwitchToAdminPanel,
  onOpenSettingsOrProfile,
}) => {
  const { t } = useTranslation();

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return t('astrologerDashboard');
      case 'clients': return t('clients');
      case 'consultations': return t('consultations');
      case 'profile': return t('myProfile');
      default: return t('astrologerDashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0f1d]/95 backdrop-blur-md border-b border-[#1e2b4f] px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Identity & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-300 text-xs">
              {astrologer.name.charAt(0)}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-sm font-serif font-bold text-slate-100 truncate">
                {t('astrologerDashboard')}
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider shrink-0">
                DEMO MODE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              <span className="text-amber-300 font-medium">{astrologer.name}</span>
              <span>•</span>
              <span className="text-emerald-400">{t('online')} (Demo)</span>
            </p>
          </div>
        </div>

        {/* Right: Actions: GlobalLanguageSelector, Admin Panel, Profile/Settings & Return to Client App */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Always-visible Global Language Selector */}
          <GlobalLanguageSelector id="astrologer-global-lang-selector" />

          {onSwitchToAdminPanel && (
            <button
              onClick={onSwitchToAdminPanel}
              className="px-2 py-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-amber-300 border border-[#1e2b4f] text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Open Admin Operations Panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t('adminPanel')}</span>
            </button>
          )}

          <button
            onClick={onOpenSettingsOrProfile}
            className="p-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] transition-all"
            title="Profile & Settings"
            aria-label="Profile and Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onSwitchToClientApp}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#16203c] to-[#1a2647] hover:from-[#1e2c52] hover:to-[#223360] text-amber-300 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm active:scale-95"
            title="Return to Client Application"
          >
            <LogOut className="w-3 h-3 text-amber-400 rotate-180" />
            <span className="hidden xs:inline">{t('clientApp')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
