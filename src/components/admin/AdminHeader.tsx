import React from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft, 
  Settings as SettingsIcon, 
  SlidersHorizontal, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AdminSection } from '../../types';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AdminHeaderProps {
  activeSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  onSwitchToClientApp: () => void;
  onSwitchToAstrologerPanel: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeSection,
  onNavigateSection,
  onSwitchToClientApp,
  onSwitchToAstrologerPanel,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070b14]/95 backdrop-blur-md border-b border-[#1e2b4f] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Branding & Dashboard Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[#111a30] text-slate-300 hover:text-amber-300 border border-[#1e2b4f]"
            aria-label="Toggle navigation menu"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shrink-0 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-300 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-serif font-bold tracking-tight text-slate-100 hidden sm:inline">
                {t('appTitle')}
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <h1 className="text-xs sm:text-sm font-bold text-amber-300 truncate">
                {t('adminDashboard')}
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider shrink-0">
                DEMO MODE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Platform Owner Management Console — Prototype Only
            </p>
          </div>
        </div>

        {/* Right: Quick Portal Navigation, Language Selector & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Always visible Global Language Selector */}
          <GlobalLanguageSelector id="admin-global-lang-selector" />

          {/* Switch to Astrologer Panel */}
          <button
            onClick={onSwitchToAstrologerPanel}
            className="px-2.5 py-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] text-[11px] font-medium hidden sm:flex items-center gap-1.5 transition-all"
            title="Open Astrologer Professional Workstation"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('astrologerPanel')}</span>
          </button>

          {/* Switch to Client App */}
          <button
            onClick={onSwitchToClientApp}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Return to Client Application"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('clientApp')}</span>
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => onNavigateSection('settings')}
            className={`p-1.5 rounded-lg border transition-all ${
              activeSection === 'settings'
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'bg-[#111a30] text-slate-400 hover:text-slate-200 border-[#1e2b4f]'
            }`}
            title="Platform Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
