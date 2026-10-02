import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Compass, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Globe
} from 'lucide-react';
import { BirthProfile } from '../../types';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface ChartPreparationScreenProps {
  birthProfile: BirthProfile;
  onComplete: () => void;
}

export const ChartPreparationScreen: React.FC<ChartPreparationScreenProps> = ({
  birthProfile,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(15);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    { title: 'Ingesting Birth Parameters', status: 'Completed', detail: 'Name, DOB, Time & Coordinates registered' },
    { title: 'Swiss Ephemeris WASM Engine', status: 'Completed', detail: 'Swiss Ephemeris v2.10 (Lahiri Sidereal) connected' },
    { title: t('calculatingPlanetaryPositions'), status: 'Active', detail: 'Computing planetary longitudes & house cusps' },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStageIndex(1);
    }, 700);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setStageIndex(2);
    }, 1800);

    const timer3 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between p-5 max-w-md mx-auto text-slate-100">
      <div className="space-y-4">
        {/* Top Header with Global Language Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold font-serif">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('vedicPortal')}</span>
          </div>
          <GlobalLanguageSelector id="chart-prep-global-lang-selector" />
        </div>

        {/* Active Engine Status Banner */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('swissEphemerisEngineActive')}</span>
          </div>
          <p className="text-[11px] text-emerald-200/90 leading-snug">
            Precision Astronomical Engine: Computing planetary longitudes and house positions via Swiss Ephemeris (Vedic Sidereal Lahiri).
          </p>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1 pt-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 mx-auto shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#0c1222] flex items-center justify-center text-amber-300">
              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-100 tracking-tight pt-1">
            {t('preparingBirthChart')}
          </h2>
          <p className="text-xs text-slate-300">
            Handoff of registered parameters to chart display pipeline
          </p>
        </motion.div>

        {/* Captured Parameters Summary Box */}
        <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#1e2b4f]/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {t('registeredBirthData')}
            </span>
            <span className="text-[9px] text-slate-400">Saved in Client State</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-[#111a30]">
              <span className="text-[10px] text-slate-400 block">{t('fullName')}</span>
              <span className="font-semibold text-slate-200 truncate block">
                {birthProfile.name || 'Demo Profile'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#111a30]">
              <span className="text-[10px] text-slate-400 block">{t('dateOfBirth')}</span>
              <span className="font-semibold text-slate-200 block">
                {birthProfile.dateOfBirth}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#111a30]">
              <span className="text-[10px] text-slate-400 block">{t('timeOfBirth')}</span>
              <span className="font-semibold text-slate-200 block">
                {birthProfile.birthTimeKnown ? birthProfile.birthTime : 'Unknown (Solar Chart: 12:00)'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#111a30]">
              <span className="text-[10px] text-slate-400 block">{t('placeOfBirth')}</span>
              <span className="font-semibold text-slate-200 font-mono text-[10px] block truncate">
                {birthProfile.birthPlace || 'New Delhi, India'}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#111a30] text-xs">
            <span className="text-[10px] text-slate-400 block">{t('placeOfBirth')} & Coordinates</span>
            <span className="font-semibold text-slate-200 block truncate">
              {birthProfile.birthPlace}
            </span>
            <span className="text-[10px] font-mono text-amber-300/80 block mt-0.5">
              Lat: {birthProfile.latitude.toFixed(4)}° • Long: {birthProfile.longitude.toFixed(4)}°
            </span>
          </div>
        </div>

        {/* Processing Pipeline Stages */}
        <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Calculation Pipeline Stages
          </span>

          <div className="space-y-2">
            {stages.map((stg, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  idx === stageIndex
                    ? 'bg-[#16203c] border-amber-400/40'
                    : idx < stageIndex
                    ? 'bg-[#0f172a] border-emerald-500/30'
                    : 'bg-[#070b14] border-[#1e2b4f]/40 opacity-70'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    {idx < stageIndex ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : idx === stageIndex ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                    )}
                    <span>{stg.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                    {stg.detail}
                  </div>
                </div>

                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold ${
                    stg.status === 'Completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-sky-950 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {stg.status}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#070b14] h-2 rounded-full overflow-hidden border border-[#1e2b4f] mt-2">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Immediate Skip/Proceed Action */}
      <div className="pt-4 space-y-2 text-center">
        <button
          onClick={onComplete}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>View Birth Chart Now</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
        <p className="text-[10px] text-slate-500">
          Redirecting automatically to your calculated birth chart view...
        </p>
      </div>
    </div>
  );
};
