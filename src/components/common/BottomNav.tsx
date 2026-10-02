import React from 'react';
import { Home, Compass, PhoneCall, Sparkles, User, Sun } from 'lucide-react';
import { DashboardSection } from '../../types';
import { useTranslation } from '../../services/languageService';

interface BottomNavProps {
  activeSection: DashboardSection;
  onNavigateSection: (section: DashboardSection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onNavigateSection,
}) => {
  const { t } = useTranslation();
  const isHomeActive =
    activeSection === 'overview' ||
    activeSection === 'ai-astrologer' ||
    activeSection === 'compatibility' ||
    activeSection === 'kundli-matching' ||
    activeSection === 'numerology' ||
    activeSection === 'panchang';
  const isKundliActive = activeSection === 'kundli';
  const isTalkActive = activeSection === 'talk';
  const isHoroscopeActive = activeSection === 'horoscope';
  const isProfileActive = activeSection === 'profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1222]/95 backdrop-blur-lg border-t border-[#1e2b4f] px-2 py-1.5 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* 1. Home */}
        <button
          id="nav-home-btn"
          onClick={() => onNavigateSection('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isHomeActive
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('home')}</span>
          {isHomeActive && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 2. Kundli */}
        <button
          id="nav-kundli-btn"
          onClick={() => onNavigateSection('kundli')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isKundliActive
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('kundli')}</span>
          {isKundliActive && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 3. Center CTA: Talk With Astrologers */}
        <button
          id="nav-talk-astrologer-btn"
          onClick={() => onNavigateSection('talk')}
          className="relative -top-2.5 flex flex-col items-center justify-center px-3"
          aria-label="Talk with Astrologers"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isTalkActive
                ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300'
                : 'bg-[#141e34] text-slate-400 border border-[#1e2b4f] hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <PhoneCall className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight transition-colors ${
              isTalkActive ? 'text-amber-300 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {t('talk')}
          </span>
        </button>

        {/* 4. Horoscope */}
        <button
          id="nav-horoscope-btn"
          onClick={() => onNavigateSection('horoscope')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isHoroscopeActive
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('horoscope')}</span>
          {isHoroscopeActive && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>

        {/* 5. Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => onNavigateSection('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isProfileActive
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">{t('profile')}</span>
          {isProfileActive && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
        </button>
      </div>
    </nav>
  );
};
