import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hash,
  Sparkles,
  ArrowLeft,
  Bot,
  PhoneCall,
  User,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Info,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { UserBirthDetails, DashboardSection, BirthProfile, NumerologyNumberItem } from '../../types';
import { calculateNumerology } from '../../services/numerologyService';
import { useTranslation } from '../../services/languageService';

interface NumerologyViewProps {
  userDetails: UserBirthDetails;
  onNavigateSection?: (section: DashboardSection) => void;
}

export const NumerologyView: React.FC<NumerologyViewProps> = ({
  userDetails,
  onNavigateSection,
}) => {
  const { t } = useTranslation();
  // Local profile state using existing user details as initial data
  const [profile, setProfile] = useState<BirthProfile>({
    name: userDetails.name || userDetails.fullName || 'Aarav Sharma',
    dateOfBirth: userDetails.dateOfBirth || userDetails.dob || '1998-08-15',
    birthTime: userDetails.birthTime || '08:30',
    birthTimeKnown: userDetails.birthTimeKnown ?? true,
    birthPlace: userDetails.birthPlace || 'New Delhi, Delhi, India',
    latitude: userDetails.latitude || 28.6139,
    longitude: userDetails.longitude || 77.2090,
    timezone: userDetails.timezone || 'Asia/Kolkata',
    isDemoData: true,
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState<'home' | 'preparing' | 'result' | 'detail'>('home');
  const [selectedNumberKey, setSelectedNumberKey] = useState<
    'lifePath' | 'destiny' | 'soulUrge' | 'personality' | 'birthDay'
  >('lifePath');

  // Compute demo numerology result using the required placeholder function
  const numerologyResult = calculateNumerology(profile);
  const currentNumberItem: NumerologyNumberItem = numerologyResult.numbers[selectedNumberKey];

  const handleStartCalculation = () => {
    setActiveStep('preparing');
    setTimeout(() => {
      setActiveStep('result');
    }, 700);
  };

  const handleOpenDetail = (
    key: 'lifePath' | 'destiny' | 'soulUrge' | 'personality' | 'birthDay'
  ) => {
    setSelectedNumberKey(key);
    setActiveStep('detail');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* DEMO MODE BANNER - Mandatory Label */}
      <div 
        id="numerology-demo-banner"
        className="p-3 rounded-xl bg-[#0e1628] border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-md"
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
              NUMEROLOGY — DEMO MODE
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9px] font-semibold border border-amber-400/30">
              PROTOTYPE ONLY
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Real numerology calculation is not connected in this prototype. All numbers, vibration titles, and trait associations shown are curated sample demonstration data.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* 1. NUMEROLOGY HOME & 2. USER DETAILS SCREEN */}
        {/* ======================================================== */}
        {activeStep === 'home' && (
          <motion.div
            key="numerology-home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header / Intro Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121c35] via-[#0c1222] to-[#070b14] border border-amber-500/30 text-center relative overflow-hidden shadow-lg">
              <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 mb-3">
                <Hash className="w-8 h-8 text-amber-300" />
              </div>

              <h1 className="text-xl font-serif font-bold text-slate-100 tracking-tight">
                {t('numerology')}
              </h1>
              <p className="text-xs text-amber-200/90 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Explore traditional numerology interpretations from your name and birth date.
              </p>

              {/* Core Archetypes Preview Pills */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f]">
                  {t('lifePathNumber')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f]">
                  {t('destinyNumber')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f]">
                  {t('soulUrge')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f]">
                  {t('personalityNumber')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f]">
                  {t('birthDayNumber')}
                </span>
              </div>
            </div>

            {/* User Birth Details Card (Using existing user's birth profile) */}
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2b4f]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
                    Your Birth Profile
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Current App Profile</span>
              </div>

              {/* Profile Details List - Interactive Inputs */}
              <div className="space-y-2.5">
                {/* 1. Full Name Interactive Input */}
                <div
                  id="numerology-name-field-container"
                  onClick={() => nameInputRef.current?.focus()}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 hover:border-slate-600 transition-all cursor-text group"
                >
                  <label
                    htmlFor="numerology-full-name-input"
                    className="flex items-center gap-2 shrink-0 cursor-pointer select-none pr-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                    <span className="text-xs text-slate-400 group-focus-within:text-slate-200 transition-colors">
                      Full Name
                    </span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="numerology-full-name-input"
                    name="numerologyFullName"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    autoComplete="name"
                    autoCapitalize="words"
                    spellCheck={false}
                    className="w-full text-right text-xs font-semibold text-slate-100 placeholder:text-slate-500 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 cursor-text"
                  />
                </div>

                {/* 2. Date of Birth Interactive Input */}
                <div
                  id="numerology-dob-field-container"
                  onClick={() => {
                    if (dobInputRef.current) {
                      dobInputRef.current.focus();
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          dobInputRef.current.showPicker();
                        }
                      } catch {
                        // Fallback
                      }
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <label
                    htmlFor="numerology-dob-input"
                    className="flex items-center gap-2 shrink-0 cursor-pointer select-none pr-2"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                    <span className="text-xs text-slate-400 group-focus-within:text-slate-200 transition-colors">
                      Date of Birth
                    </span>
                  </label>
                  <input
                    ref={dobInputRef}
                    id="numerology-dob-input"
                    name="numerologyDob"
                    type="date"
                    value={profile.dateOfBirth}
                    max="2026-12-31"
                    min="1920-01-01"
                    onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          (e.target as HTMLInputElement).showPicker();
                        }
                      } catch {
                        // Fallback
                      }
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="text-right text-xs font-semibold text-amber-300 bg-transparent border-none outline-none focus:outline-none focus:ring-0 cursor-pointer p-0 m-0"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  id="calculate-my-numbers-btn"
                  type="button"
                  onClick={handleStartCalculation}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070b14] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('calculateNumerology')}</span>
                </button>

                <button
                  id="calculate-demo-numbers-btn"
                  type="button"
                  onClick={handleStartCalculation}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#1e2b4f]"
                >
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calculate Demo Numbers</span>
                </button>
              </div>

              {/* Small Note */}
              <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                Traditional numerology interpretation only. This prototype does not make guaranteed predictions.
              </p>
            </div>

            {/* Traditional Systems Info */}
            <div className="p-3.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Traditional numerology interprets character dispositions through symbolic number frequencies. All readings in this applet are provided for self-reflection and prototype demonstration.
              </p>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TRANSITIONAL PREPARING STATE */}
        {/* ======================================================== */}
        {activeStep === 'preparing' && (
          <motion.div
            key="numerology-preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center space-y-4"
          >
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400"
              />
              <span className="text-xl font-bold font-serif text-amber-300">#7</span>
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-slate-100">
                Preparing Demo Numbers...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Aligning traditional archetypes with sample vibration frequencies...
              </p>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 3. NUMEROLOGY RESULT DASHBOARD */}
        {/* ======================================================== */}
        {activeStep === 'result' && (
          <motion.div
            key="numerology-result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header with profile summary & Recalculate toggle */}
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Profile Analyzed (Demo)
                </span>
                <h2 className="text-sm font-serif font-bold text-slate-100">
                  {profile.name}
                </h2>
                <span className="text-[11px] text-amber-400 font-medium">
                  DOB: {profile.dateOfBirth}
                </span>
              </div>

              <button
                type="button"
                id="recalculate-numerology-btn"
                onClick={() => setActiveStep('home')}
                className="px-3 py-1.5 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 hover:text-amber-300 text-xs font-semibold border border-[#1e2b4f] transition-all"
              >
                Change Details
              </button>
            </div>

            {/* Instruction banner */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide">
                Five Core Numbers (Sample Values)
              </span>
              <span className="text-[10px] text-amber-400">Tap card for details</span>
            </div>

            {/* 5 Core Number Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Life Path Number */}
              <div
                id="number-card-life-path"
                onClick={() => handleOpenDetail('lifePath')}
                className="p-4 rounded-xl bg-gradient-to-r from-[#121b33] to-[#0c1222] border border-amber-400/40 hover:border-amber-400 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 tracking-wide block">
                      Life Path
                    </span>
                    <span className="text-2xl font-serif font-bold text-amber-300 block">
                      {numerologyResult.numbers.lifePath.numberValue}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                      {numerologyResult.numbers.lifePath.sampleBadge}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-serif font-semibold text-slate-100 group-hover:text-amber-300 transition-colors block">
                      {numerologyResult.numbers.lifePath.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Core Life Trajectory
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Destiny / Expression Number */}
              <div
                id="number-card-destiny"
                onClick={() => handleOpenDetail('destiny')}
                className="p-4 rounded-xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 tracking-wide block">
                      Destiny / Expression
                    </span>
                    <span className="text-2xl font-serif font-bold text-amber-300 block">
                      {numerologyResult.numbers.destiny.numberValue}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                      {numerologyResult.numbers.destiny.sampleBadge}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-serif font-semibold text-slate-100 group-hover:text-amber-300 transition-colors block">
                      {numerologyResult.numbers.destiny.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Expression & Talents
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Soul Urge Number */}
              <div
                id="number-card-soul-urge"
                onClick={() => handleOpenDetail('soulUrge')}
                className="p-4 rounded-xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 tracking-wide block">
                      Soul Urge
                    </span>
                    <span className="text-2xl font-serif font-bold text-amber-300 block">
                      {numerologyResult.numbers.soulUrge.numberValue}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                      {numerologyResult.numbers.soulUrge.sampleBadge}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-serif font-semibold text-slate-100 group-hover:text-amber-300 transition-colors block">
                      {numerologyResult.numbers.soulUrge.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Heart's Inner Values
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Personality Number */}
              <div
                id="number-card-personality"
                onClick={() => handleOpenDetail('personality')}
                className="p-4 rounded-xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 tracking-wide block">
                      Personality
                    </span>
                    <span className="text-2xl font-serif font-bold text-amber-300 block">
                      {numerologyResult.numbers.personality.numberValue}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                      {numerologyResult.numbers.personality.sampleBadge}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-serif font-semibold text-slate-100 group-hover:text-amber-300 transition-colors block">
                      {numerologyResult.numbers.personality.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Outer Demeanor
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Birth Day Number */}
              <div
                id="number-card-birth-day"
                onClick={() => handleOpenDetail('birthDay')}
                className="p-4 rounded-xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 tracking-wide block">
                      Birth Day Number
                    </span>
                    <span className="text-2xl font-serif font-bold text-amber-300 block">
                      {numerologyResult.numbers.birthDay.numberValue}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                      {numerologyResult.numbers.birthDay.sampleBadge}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-serif font-semibold text-slate-100 group-hover:text-amber-300 transition-colors block">
                      {numerologyResult.numbers.birthDay.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Innate Special Talent
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interplay / Synthesis Note */}
            <div className="p-3.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] space-y-1.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-serif font-bold text-slate-200">
                  Vibrational Synthesis (Sample)
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                In classical numerology, the primary Life Path (7) brings a natural gift for analytical discernment and contemplation, harmoniously balanced by the expressive communication flair of Destiny Number (3).
              </p>
            </div>

            {/* ======================================================== */}
            {/* 5. AI ASTROLOGER & ASTROLOGER CONNECTION (SECTION 5) */}
            {/* ======================================================== */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c35] to-[#0c1222] border border-amber-500/30 space-y-3 shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Deepen Your Insights
                </span>
                <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                  Want a deeper interpretation?
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Discuss your numerological themes with our AI Astrologer or book a consultation with a verified Vedic specialist.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="numerology-ask-ai-btn"
                  onClick={() => onNavigateSection?.('ai-astrologer')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Bot className="w-4 h-4" />
                  <span>Ask AI Astrologer</span>
                </button>

                <button
                  type="button"
                  id="numerology-talk-astrologer-btn"
                  onClick={() => onNavigateSection?.('talk')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070b14] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Talk to an Astrologer</span>
                </button>
              </div>
            </div>

            {/* Bottom Safety Note */}
            <p className="text-[10px] text-slate-500 text-center px-4 leading-relaxed">
              * Traditional numerology interpretation only. This prototype does not make guaranteed claims about health, wealth, marriage, career success, or future events.
            </p>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 4. NUMBER DETAILS PAGE */}
        {/* ======================================================== */}
        {activeStep === 'detail' && (
          <motion.div
            key="numerology-detail"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Back to Results Navigation */}
            <button
              type="button"
              id="back-to-numbers-btn"
              onClick={() => setActiveStep('result')}
              className="py-2 px-3 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-[#1e2b4f] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Numbers</span>
            </button>

            {/* Number Header Badge Card */}
            <div className="p-5 rounded-2xl bg-[#0c1222] border border-amber-400/40 text-center space-y-3 relative overflow-hidden shadow-lg">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-3xl font-serif font-bold text-amber-300 shadow-inner">
                {currentNumberItem.numberValue}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  {currentNumberItem.name}
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-100 mt-0.5">
                  {currentNumberItem.title}
                </h2>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {currentNumberItem.calculationSource}
                </span>
              </div>

              {/* Mandatory Interpretation Badge */}
              <div className="inline-block px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                SAMPLE TRADITIONAL INTERPRETATION
              </div>
            </div>

            {/* 1. Traditional Meaning */}
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
                  Traditional Meaning
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentNumberItem.traditionalMeaning}
              </p>
            </div>

            {/* 2. Strengths */}
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-1.5">
                {currentNumberItem.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="text-amber-400 text-sm leading-none mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Common Themes */}
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
                  Common Themes
                </h3>
              </div>
              <ul className="space-y-1.5">
                {currentNumberItem.commonThemes.map((theme, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="text-amber-400 text-sm leading-none mt-0.5">•</span>
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mandatory Safety Box */}
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f] flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldAlert className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
              <div className="leading-snug space-y-1">
                <span className="font-bold text-amber-300/90 text-[11px] block">
                  SAMPLE TRADITIONAL INTERPRETATION
                </span>
                <p className="text-[11px] text-slate-400">
                  This prototype does not make guaranteed claims about health, wealth, marriage, career success, or future events. All traditional symbolism is provided strictly for educational and philosophical contemplation.
                </p>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 5. AI ASTROLOGER & ASTROLOGER CONNECTION (SECTION 5) */}
            {/* ======================================================== */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c35] to-[#0c1222] border border-amber-500/30 space-y-3 shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Deepen Your Insights
                </span>
                <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                  Want a deeper interpretation?
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Discuss how Number {currentNumberItem.numberValue} correlates with your Vedic planetary periods.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="detail-ask-ai-btn"
                  onClick={() => onNavigateSection?.('ai-astrologer')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Bot className="w-4 h-4" />
                  <span>Ask AI Astrologer</span>
                </button>

                <button
                  type="button"
                  id="detail-talk-astrologer-btn"
                  onClick={() => onNavigateSection?.('talk')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070b14] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Talk to an Astrologer</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
