import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Compass, Moon, Star, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-between p-6 overflow-hidden bg-radial from-[#101930] via-[#0c1222] to-[#070b14]">
      {/* Background Starfield & Celestial Rings */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-amber-500/20 animate-[spin_60s_linear_infinite]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-dashed border-amber-400/30 animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute top-12 left-10 w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping" />
        <div className="absolute top-28 right-12 w-1 h-1 bg-amber-300 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-16 w-1 h-1 bg-amber-200 rounded-full animate-pulse" />
        <div className="absolute top-2/3 right-8 w-1.5 h-1.5 bg-amber-100 rounded-full animate-ping" />
      </div>

      {/* Top Header with Brand Pill and Global Language Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="pt-4 w-full flex items-center justify-between z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16203c]/80 border border-amber-500/30 backdrop-blur-md shadow-sm">
          <Moon className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-amber-200/90 font-sans">
            Prototype Preview
          </span>
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        </div>
        <GlobalLanguageSelector id="splash-global-lang-selector" />
      </motion.div>

      {/* Central Celestial Mandala */}
      <div className="flex flex-col items-center text-center my-auto">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-44 h-44 flex items-center justify-center mb-8"
        >
          {/* Outer Glowing Halos */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600/30 to-amber-300/10 blur-xl animate-pulse" />
          
          {/* Sacred Mandala SVG */}
          <div className="relative w-36 h-36 rounded-full bg-[#0b1120] border-2 border-amber-400/60 p-2 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400" fill="none" stroke="currentColor">
              {/* Outer 12-petals / constellations marks */}
              <circle cx="50" cy="50" r="46" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
              <circle cx="50" cy="50" r="38" strokeWidth="1" opacity="0.8" />
              {/* Double Inverted Squares (Ashtakona / Eight-pointed Star) */}
              <rect x="22" y="22" width="56" height="56" strokeWidth="1.2" transform="rotate(0 50 50)" opacity="0.7" />
              <rect x="22" y="22" width="56" height="56" strokeWidth="1.2" transform="rotate(45 50 50)" opacity="0.7" />
              {/* Central Sun Disc */}
              <circle cx="50" cy="50" r="16" strokeWidth="1.5" className="text-amber-300" />
              <circle cx="50" cy="50" r="8" fill="currentColor" className="text-amber-400 opacity-90" />
            </svg>
            
            {/* Center Core Sparkle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Sparkles className="w-6 h-6 text-amber-200 animate-spin" style={{ animationDuration: '16s' }} />
            </div>
          </div>
        </motion.div>

        {/* Title & Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-100">
            <span className="gold-gradient-text">{t('appTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-[11px] text-amber-400/80 font-medium tracking-wide">
            {t('kundli')} • {t('horoscope')} • {t('panchang')} • {t('talk')}
          </p>
        </motion.div>
      </div>

      {/* Bottom Action / Skip Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="w-full max-w-xs pb-6 flex flex-col items-center gap-3 z-10"
      >
        <button
          id="splash-continue-button"
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>{t('beginJourney')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        
        <p className="text-[11px] text-slate-400 text-center">
          Interactive Vedic Astrology Platform
        </p>
      </motion.div>
    </div>
  );
};
