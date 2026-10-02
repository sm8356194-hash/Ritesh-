import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Compass, ShieldCheck, PhoneCall, Star, ArrowRight, BookOpen, HeartHandshake } from 'lucide-react';
import { useTranslation } from '../../services/languageService';

interface WelcomeScreenProps {
  onEnterDetails: () => void;
  onExploreSample: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterDetails,
  onExploreSample,
}) => {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      title: t('vedicKundliChart'),
      desc: 'Accurate Lagna, Navamsha, and planetary strength analysis.',
    },
    {
      icon: <PhoneCall className="w-5 h-5 text-amber-400" />,
      title: t('connectWithAstrologers'),
      desc: 'Preview upcoming audio & chat consultation workflows with astrologers.',
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-amber-400" />,
      title: t('kundliMatching'),
      desc: '36-Guna compatibility scoring for marriage and relationships.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      title: t('panchang'),
      desc: 'Reference calendar for Tithi, Nakshatra, and auspicious Abhijit timing.',
    },
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Top Welcome Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16203c] border border-amber-500/30 text-amber-300 text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sacred Celestial Science</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full font-medium">
            <span>Frontend Prototype</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2 mb-6"
        >
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight leading-snug">
            {t('welcomeTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('tagline')}
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-2.5 my-4">
          {highlights.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0c1222]/90 border border-[#1e2b4f] hover:border-amber-500/40 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-[#16203c] border border-amber-500/20 shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 font-serif">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust & Action Footer */}
      <div className="pt-4 pb-2 space-y-3">
        {/* Prototype Badges */}
        <div className="flex items-center justify-center gap-3 py-2 border-y border-[#1e2b4f]/60 text-[11px] text-slate-400">
          <span>Interactive Frontend Demo</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>Sample Data & Mock Workflows</span>
        </div>

        {/* Primary CTA: Enter Details */}
        <button
          id="welcome-enter-details-btn"
          onClick={onEnterDetails}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>{t('enterBirthDetails')}</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>

        {/* Secondary CTA: Sample Chart */}
        <button
          id="welcome-sample-chart-btn"
          onClick={onExploreSample}
          className="w-full py-2.5 px-4 rounded-xl bg-[#16203c]/70 hover:bg-[#1e2b4f] border border-amber-500/20 text-xs font-medium text-amber-300 transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('exploreSample')}</span>
        </button>
      </div>
    </div>
  );
};
