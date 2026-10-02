import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Compass, 
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Info,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  Bot,
  PhoneCall
} from 'lucide-react';
import { UserBirthDetails, DashboardSection } from '../../types';
import { calculatePanchang } from '../../services/astrologyEngine';
import { useTranslation } from '../../services/languageService';

interface PanchangViewProps {
  userDetails?: UserBirthDetails;
  onNavigateSection?: (section: DashboardSection) => void;
}

export const PanchangView: React.FC<PanchangViewProps> = ({
  userDetails,
  onNavigateSection,
}) => {
  const { t } = useTranslation();
  // Format today's date YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Derive location from user details if available
  const userLocation = userDetails?.birthPlace || userDetails?.city 
    ? `${userDetails?.city || ''}${userDetails?.city && userDetails?.country ? ', ' : ''}${userDetails?.country || userDetails?.birthPlace || ''}`
    : 'New Delhi, Delhi, India';

  // Compute panchangData using the required placeholder function
  const panchang = calculatePanchang(selectedDate, userLocation);

  // Date Navigation handlers
  const adjustDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);
    currentDate.setDate(currentDate.getDate() + days);
    const nextYear = currentDate.getFullYear();
    const nextMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(currentDate.getDate()).padStart(2, '0');
    setSelectedDate(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  const handlePreviousDay = () => adjustDate(-1);
  const handleNextDay = () => adjustDate(1);
  const handleToday = () => setSelectedDate(getTodayString());

  const isToday = selectedDate === getTodayString();

  return (
    <div className="space-y-4 pb-20">
      {/* 0. Demo Prototype Notice Banner */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-amber-300">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="font-semibold">{panchang.demoLabel}</span>
        </div>
        <span className="text-[10px] text-amber-200/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          Sample Calculations
        </span>
      </div>

      {/* 1. Panchang Header & Date Navigation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121c35] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-lg relative overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-serif font-bold text-slate-100">
                  {t('panchang')}
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Demo
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-amber-400/90 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{panchang.location}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-[#1e2b4f] block mb-1">
              {panchang.season}
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">
              {panchang.ayana}
            </span>
          </div>
        </div>

        {/* Date Selector & Day Navigation Controls */}
        <div className="mt-3 pt-3 border-t border-[#1e2b4f]/70">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Previous Day Button */}
            <button
              id="panchang-prev-day-btn"
              type="button"
              onClick={handlePreviousDay}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#070b14] hover:bg-[#16203c] border border-[#1e2b4f] text-slate-300 hover:text-amber-300 flex items-center gap-1 text-xs transition-all active:scale-95"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev Day</span>
            </button>

            {/* Current Selected Date Display with Click-to-Pick Date */}
            <div 
              onClick={() => {
                if (dateInputRef.current) {
                  dateInputRef.current.focus();
                  try {
                    if ('showPicker' in HTMLInputElement.prototype) {
                      dateInputRef.current.showPicker();
                    }
                  } catch {
                    // Fallback
                  }
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#070b14] border border-[#1e2b4f] hover:border-amber-400/50 flex flex-col items-center justify-center text-center cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-serif font-bold text-amber-300 group-hover:text-amber-200">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{panchang.formattedDate}</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-300 flex items-center gap-1">
                {panchang.vara} • Tap to change date
              </span>

              {/* Hidden native date input for mobile datepicker */}
              <input
                ref={dateInputRef}
                id="panchang-date-picker-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="sr-only"
                aria-label="Select Date"
              />
            </div>

            {/* Next Day Button */}
            <button
              id="panchang-next-day-btn"
              type="button"
              onClick={handleNextDay}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#070b14] hover:bg-[#16203c] border border-[#1e2b4f] text-slate-300 hover:text-amber-300 flex items-center gap-1 text-xs transition-all active:scale-95"
              aria-label="Next Day"
            >
              <span className="hidden sm:inline">Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Jump to Today Button */}
            {!isToday && (
              <button
                id="panchang-today-btn"
                type="button"
                onClick={handleToday}
                className="px-2.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition-all active:scale-95 shrink-0"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Festival / Special Observance Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0c1222] to-amber-500/5 border border-amber-500/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
          <Flame className="w-4 h-4 text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Festival & Observance (Demo)
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
              {panchang.paksha}
            </span>
          </div>
          <h2 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
            {panchang.festival}
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            {panchang.festivalDescription}
          </p>
        </div>
      </div>

      {/* 3. Sun & Moon Timings */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide">
              Sun & Moon (Celestial Timings)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Sample Timings</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Sunrise */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-300 shrink-0">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">{t('sunrise')}</span>
              <span className="text-xs font-mono font-bold text-amber-300">{panchang.sunrise}</span>
            </div>
          </div>

          {/* Sunset */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-400/10 text-orange-400 shrink-0">
              <Sun className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">{t('sunset')}</span>
              <span className="text-xs font-mono font-bold text-orange-300">{panchang.sunset}</span>
            </div>
          </div>

          {/* Moonrise */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-400/10 text-sky-300 shrink-0">
              <Moon className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">{t('moonrise')}</span>
              <span className="text-xs font-mono font-bold text-sky-300">{panchang.moonrise}</span>
            </div>
          </div>

          {/* Moonset */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-400/10 text-indigo-300 shrink-0">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">{t('moonset')}</span>
              <span className="text-xs font-mono font-bold text-indigo-300">{panchang.moonset}</span>
            </div>
          </div>
        </div>

        {/* Solar / Lunar Sign indicators */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-[#070b14]/80 border border-[#1e2b4f]/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Sun Sign (Surya Rashi)</span>
            <span className="font-semibold text-amber-300">{panchang.sunSign}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070b14]/80 border border-[#1e2b4f]/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Moon Sign (Chandra Rashi)</span>
            <span className="font-semibold text-sky-300">{panchang.moonSign}</span>
          </div>
        </div>
      </div>

      {/* 4. Today's Panchang (The Five Celestial Limbs) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2b4f]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
              The Five Celestial Limbs (Pancha-Anga)
            </h3>
          </div>
          <span className="text-[10px] text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Core Elements
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Tithi */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400">1. Tithi (Lunar Day)</span>
                <span className="text-[9px] text-slate-400">Deity: {panchang.tithi.deity}</span>
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                {panchang.tithi.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {panchang.tithi.significance}
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">Ends at</span>
              <span className="text-xs font-mono font-bold text-amber-300">{panchang.tithi.endTime}</span>
            </div>
          </div>

          {/* 2. Nakshatra */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400">2. Nakshatra (Lunar Mansion)</span>
                <span className="text-[9px] text-slate-400">Lord: {panchang.nakshatra.lord}</span>
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                {panchang.nakshatra.name} (Pada {panchang.nakshatra.pada})
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Symbol: {panchang.nakshatra.symbol}
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">Ends at</span>
              <span className="text-xs font-mono font-bold text-amber-300">{panchang.nakshatra.endTime}</span>
            </div>
          </div>

          {/* 3. Yoga */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400">3. Yoga (Planetary Conjunction)</span>
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                {panchang.yoga.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {panchang.yoga.meaning}
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">Ends at</span>
              <span className="text-xs font-mono font-bold text-amber-300">{panchang.yoga.endTime}</span>
            </div>
          </div>

          {/* 4. Karana */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400">4. Karana (Half Lunar Day)</span>
                {panchang.karana.deity && (
                  <span className="text-[9px] text-slate-400">Deity: {panchang.karana.deity}</span>
                )}
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                {panchang.karana.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Traditionally associated with daily task initiation and activities.
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">Ends at</span>
              <span className="text-xs font-mono font-bold text-amber-300">{panchang.karana.endTime}</span>
            </div>
          </div>

          {/* 5. Vara (Weekday) */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e2b4f]/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400">5. Vara (Solar Day)</span>
                <span className="text-[9px] text-slate-400">Ruler: {panchang.varaLord}</span>
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-100 mt-0.5">
                {panchang.vara}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paksha: {panchang.paksha}
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                Auspicious
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Muhurat (Auspicious & Inauspicious Intervals) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2b4f]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
              Muhurat & Planetary Windows
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Standard Vedic Intervals</span>
        </div>

        {/* Auspicious Muhurats (Shubh) */}
        <div>
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Shubh Muhurat (Auspicious Timing)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Abhijit Muhurat */}
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-emerald-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Abhijit Muhurat</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Traditionally Considered Auspicious
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-slate-100">
                {panchang.abhijitMuhurat.start} - {panchang.abhijitMuhurat.end}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {panchang.abhijitMuhurat.description}
              </p>
            </div>

            {/* Brahma Muhurat */}
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-emerald-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Brahma Muhurat</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Sacred Dawn
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-slate-100">
                {panchang.brahmaMuhurat.start} - {panchang.brahmaMuhurat.end}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {panchang.brahmaMuhurat.description}
              </p>
            </div>
          </div>
        </div>

        {/* Inauspicious / Prohibited Windows (Ashubh / Varjya) */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Ashubh Kaal (Inauspicious Windows to Avoid)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Rahu Kaal */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-rose-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300">Rahu Kaal</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold">
                  Varjya
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-100">
                {panchang.rahuKaal.start} - {panchang.rahuKaal.end}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {panchang.rahuKaal.description}
              </p>
            </div>

            {/* Yamaganda */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-rose-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300">Yamaganda</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold">
                  Caution
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-100">
                {panchang.yamagandam.start} - {panchang.yamagandam.end}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {panchang.yamagandam.description}
              </p>
            </div>

            {/* Gulika Kaal */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-amber-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Gulika Kaal</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-semibold">
                  Mixed
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-100">
                {panchang.gulikaKaal.start} - {panchang.gulikaKaal.end}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {panchang.gulikaKaal.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Traditional Vedic Explanation Card */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
        <div className="flex items-center gap-2 text-amber-300">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-serif font-bold text-slate-100 uppercase tracking-wide">
            Understanding Panchang (Traditional Philosophy)
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {panchang.traditionalExplanation}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[10px] text-center">
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#1e2b4f]/60">
            <span className="font-bold text-amber-300 block">Tithi</span>
            <span className="text-slate-400">Traditional Prosperity Themes</span>
          </div>
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#1e2b4f]/60">
            <span className="font-bold text-amber-300 block">Nakshatra</span>
            <span className="text-slate-400">Traditional Life Themes</span>
          </div>
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#1e2b4f]/60">
            <span className="font-bold text-amber-300 block">Yoga</span>
            <span className="text-slate-400">Harmony & Daily Themes</span>
          </div>
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#1e2b4f]/60">
            <span className="font-bold text-amber-300 block">Karana</span>
            <span className="text-slate-400">Task Fulfillment</span>
          </div>
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#1e2b4f]/60 col-span-2 sm:col-span-1">
            <span className="font-bold text-amber-300 block">Vara</span>
            <span className="text-slate-400">Solar Energy & Vigor</span>
          </div>
        </div>
      </div>

      {/* 7. Astrologer Consultation CTA */}
      {onNavigateSection && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c35] to-[#0c1222] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h3 className="text-xs font-serif font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Need Personalized Muhurat Guidance?
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Consult experienced Vedic astrologers for customized marriage, griha pravesh, or business inauguration timings.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection('ai-astrologer')}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('talk')}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070b14] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Astrologers</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. Mandatory Disclaimer */}
      <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f]/70 text-center space-y-1">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          * {panchang.disclaimer}
        </p>
      </div>
    </div>
  );
};
