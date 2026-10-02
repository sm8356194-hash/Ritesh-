import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Heart, 
  Briefcase, 
  Sparkles, 
  Compass, 
  Star, 
  ArrowLeft, 
  Clock, 
  Palette, 
  Hash, 
  Calendar, 
  BookOpen, 
  Leaf,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ZODIAC_SIGNS } from '../../data/astrologyMockData';
import { UserBirthDetails, DashboardSection } from '../../types';
import { 
  HoroscopePeriod, 
  generateHoroscope, 
  getHoroscopeUserProfile 
} from '../../services/horoscopeService';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface HoroscopeViewProps {
  userDetails?: UserBirthDetails;
  initialSignId?: string;
  onBack?: () => void;
  onNavigateSection?: (section: DashboardSection) => void;
}

export const HoroscopeView: React.FC<HoroscopeViewProps> = ({ 
  userDetails,
  initialSignId = 'taurus',
  onBack,
  onNavigateSection,
}) => {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<HoroscopePeriod>('daily');
  const [selectedSignId, setSelectedSignId] = useState<string>(initialSignId);

  // User birth profile summary
  const userProfile = getHoroscopeUserProfile(userDetails);

  // Find zodiac metadata
  const currentSign = ZODIAC_SIGNS.find(s => s.id === selectedSignId) || ZODIAC_SIGNS[1]; // default Taurus

  // Generate horoscope via placeholder service function
  const horoscope = generateHoroscope(timeframe, userDetails, undefined, selectedSignId);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigateSection) {
      onNavigateSection('overview');
    }
  };

  return (
    <div className="flex flex-col min-h-[85vh] max-w-md mx-auto pb-24 text-slate-100 space-y-3.5">
      {/* 1. HEADER */}
      <div className="sticky top-14 z-30 bg-[#0c1222]/95 backdrop-blur-md border-b border-[#1e2b4f] px-3.5 py-2.5 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              id="horoscope-back-btn"
              onClick={handleBack}
              className="p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-[#16203c] transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-serif font-bold text-slate-100">
                  {t('horoscope')}
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  DEMO / SAMPLE
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 tracking-wide font-sans">
                Traditional Vedic astrology guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Global Language Selector */}
            <GlobalLanguageSelector id="horoscope-global-lang-selector" />

            <div className="text-right hidden xs:block">
              <span className="text-[10px] text-slate-400 block">System</span>
              <span className="text-[10px] font-semibold text-amber-300">Vedic</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TIME PERIOD TABS (Daily, Weekly, Monthly) */}
      <div className="bg-[#0c1222] p-1 rounded-2xl border border-[#1e2b4f] shadow-md">
        <div className="flex">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => {
            const isActive = timeframe === period;
            return (
              <button
                key={period}
                id={`horoscope-tab-${period}`}
                onClick={() => setTimeframe(period)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-[#16203c]/60'
                }`}
              >
                {t(period)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ZODIAC / USER PROFILE CARD */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0d1426] to-[#070b14] border border-amber-500/30 shadow-md">
        <div className="flex items-center justify-between border-b border-[#1e2b4f]/70 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-100">{userProfile.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25">
                  SAMPLE PROFILE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Birth Chart Parameters</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSignId('taurus')}
            className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
              selectedSignId === 'taurus'
                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                : 'bg-[#16203c] border-[#1e2b4f] text-slate-300 hover:text-amber-300'
            }`}
          >
            My Moon Sign
          </button>
        </div>

        {/* 4 Profile Attributes */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
              <Moon className="w-3 h-3 text-amber-400" />
              <span>Moon Sign (Rashi)</span>
            </div>
            <p className="font-semibold text-slate-100">{userProfile.moonSign}</p>
          </div>

          <div className="p-2 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
              <Star className="w-3 h-3 text-amber-400" />
              <span>Nakshatra</span>
            </div>
            <p className="font-semibold text-slate-100">{userProfile.nakshatra}</p>
          </div>

          <div className="p-2 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Ascendant (Lagna)</span>
            </div>
            <p className="font-semibold text-slate-100">{userProfile.ascendant}</p>
          </div>

          <div className="p-2 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Viewing Sign</span>
            </div>
            <p className="font-semibold text-amber-300 capitalize">{currentSign.name} ({currentSign.sanskritName})</p>
          </div>
        </div>

        {/* Horizontal Zodiac Sign Selector */}
        <div className="mt-3 pt-2.5 border-t border-[#1e2b4f]/60">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-semibold text-slate-400">Browse Zodiac Sign:</span>
            <span className="text-[9px] text-slate-500">Tap to view</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ZODIAC_SIGNS.map((sign) => {
              const isSelected = sign.id === selectedSignId;
              const isUserMoon = sign.id === 'taurus';
              return (
                <button
                  key={sign.id}
                  id={`sign-select-${sign.id}`}
                  onClick={() => setSelectedSignId(sign.id)}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-[#090e1a] border-[#1e2b4f] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{sign.symbol}</span>
                  <span>{sign.name}</span>
                  {isUserMoon && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" title="Your Moon Sign" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. TODAY'S TRADITIONAL INSIGHT (DAILY VIEW ONLY) */}
      {timeframe === 'daily' && horoscope.dailyInsight && (
        <div 
          id="todays-traditional-insight"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-[#141f3b] to-[#0c1426] border border-amber-400/40 shadow-md"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1 rounded-md bg-amber-400/20 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-serif font-bold text-amber-300">
              Today's Traditional Insight
            </h3>
            <span className="text-[9px] text-slate-400 ml-auto font-mono">Calm Reflection</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed italic">
            "{horoscope.dailyInsight}"
          </p>
        </div>
      )}

      {/* 4, 6, 7. MAIN HOROSCOPE CARD FOR SELECTED PERIOD */}
      <div className="rounded-2xl bg-[#0c1222] border border-[#1e2b4f] p-4 shadow-lg space-y-3.5">
        {/* Card Header with Sign & Period */}
        <div className="flex items-start justify-between border-b border-[#1e2b4f]/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-400/40 flex items-center justify-center text-2xl text-amber-300">
              {currentSign.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-serif font-bold text-slate-100">
                  {currentSign.name} ({currentSign.sanskritName})
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentSign.element}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentSign.dateRange} • Ruler: {currentSign.rulingPlanet}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#16203c] text-amber-300 border border-amber-500/30 capitalize">
            {timeframe}
          </span>
        </div>

        {/* Period Headline & General Overview */}
        <div>
          <h3 className="text-xs font-bold text-amber-300 mb-1">
            {horoscope.headline}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {horoscope.overview}
          </p>
        </div>

        {/* Main Traditional Theme */}
        <div className="p-3 rounded-xl bg-[#080d19] border border-[#1e2b4f]/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {timeframe === 'weekly' 
                ? 'Main Traditional Theme' 
                : timeframe === 'monthly' 
                ? 'Major Traditional Themes' 
                : 'Traditional Theme & Focus'}
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-relaxed">
            {horoscope.mainTheme}
          </p>
        </div>

        {/* Three Core Pillars: Love & Relationships, Career & Work, Personal Growth */}
        <div className="space-y-2.5">
          {/* Relationships */}
          <div className="p-3 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                <span>Love & Relationships</span>
              </div>
              <span className="text-[9px] text-slate-500 font-normal">Traditional Perspective</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {horoscope.relationships}
            </p>
          </div>

          {/* Career & Work */}
          <div className="p-3 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Career & Work</span>
              </div>
              <span className="text-[9px] text-slate-500 font-normal">Traditional Perspective</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {horoscope.careerAndWork}
            </p>
          </div>

          {/* Personal Growth */}
          <div className="p-3 rounded-xl bg-[#090e1a] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" />
                <span>Personal Growth & Contemplation</span>
              </div>
              <span className="text-[9px] text-slate-500 font-normal">Traditional Perspective</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {horoscope.personalGrowth}
            </p>
          </div>
        </div>

        {/* Lucky Insight Section */}
        <div className="pt-2 border-t border-[#1e2b4f]/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Traditional Lucky Insight ({timeframe})
              </h4>
            </div>
            <span className="text-[9px] text-amber-300/80 font-mono">Sample Attributes</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-[#080d19] border border-[#1e2b4f]/70 text-center">
              <Palette className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-[9px] text-slate-400 block">Favorable Color</span>
              <span className="text-[11px] font-semibold text-slate-200 block truncate">
                {horoscope.luckyInsight.favorableColor.split('&')[0]}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#080d19] border border-[#1e2b4f]/70 text-center">
              <Hash className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-[9px] text-slate-400 block">Harmonious Number</span>
              <span className="text-[11px] font-semibold text-amber-300 block">
                {horoscope.luckyInsight.harmoniousNumber}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#080d19] border border-[#1e2b4f]/70 text-center">
              <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-[9px] text-slate-400 block">Traditional Window</span>
              <span className="text-[10px] font-semibold text-slate-200 block truncate">
                {horoscope.luckyInsight.traditionalTimeWindow.split('(')[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety / Medical / Financial Disclaimer */}
      <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/60 text-center space-y-1">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Traditional Vedic horoscope interpretations are contemplative archetypes for personal mindfulness and reflection.
        </p>
        <p className="text-[9px] text-slate-500 leading-relaxed">
          Not scientifically proven facts. Does not provide medical diagnoses, treatment instructions, guaranteed financial returns, or definitive life predictions.
        </p>
      </div>
    </div>
  );
};
