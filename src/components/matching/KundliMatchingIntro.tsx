import React from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Award, 
  Moon, 
  Users, 
  Flame, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface KundliMatchingIntroProps {
  onStartMatching: () => void;
  onQuickDemoMatch: () => void;
}

export const KundliMatchingIntro: React.FC<KundliMatchingIntroProps> = ({
  onStartMatching,
  onQuickDemoMatch,
}) => {
  return (
    <div className="space-y-4">
      {/* Hero Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden text-center"
      >
        {/* Ambient Cosmic Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-400/30 flex items-center justify-center text-rose-300 shadow-inner mb-3">
          <HeartHandshake className="w-7 h-7 text-amber-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Vedic Milan Prototype</span>
        </div>

        <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-tight">
          Kundli Matching
        </h1>

        <p className="text-xs text-amber-300/85 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Compare two birth profiles using traditional Vedic matching methods.
        </p>

        {/* Main CTA: Start Matching */}
        <div className="mt-5 space-y-2.5">
          <button
            id="start-matching-btn"
            onClick={onStartMatching}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <span>Start Matching</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="quick-demo-match-btn"
            onClick={onQuickDemoMatch}
            className="w-full py-2.5 px-4 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-amber-500/20 text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Sample Pair & View Match (Instant Demo)</span>
          </button>
        </div>

        {/* Small Mandatory Safety Note */}
        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed px-2">
          Traditional astrology interpretation only. This prototype does not determine relationship or marriage decisions.
        </p>
      </motion.div>

      {/* Conceptual Vedic Pillars Overview */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e2b4f]/70 pb-2.5">
          <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Traditional Ashtakoota 36-Guna Framework</span>
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25">
            DEMO
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Traditional Vedic matchmaking evaluates harmony across eight distinct physiological, psychological, and astrological dimensions totaling 36 points:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">1. Varna</span>
              <span className="text-[10px] text-amber-300 font-mono">1 pt</span>
            </div>
            <p className="text-[10px] text-slate-400">Spiritual ego & work nature</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">2. Vashya</span>
              <span className="text-[10px] text-amber-300 font-mono">2 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Mutual attraction & rapport</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">3. Tara</span>
              <span className="text-[10px] text-amber-300 font-mono">3 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Destiny & birth star harmony</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">4. Yoni</span>
              <span className="text-[10px] text-amber-300 font-mono">4 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Biological & physical affinity</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">5. Graha Maitri</span>
              <span className="text-[10px] text-amber-300 font-mono">5 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Mental friendship & kinship</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">6. Gana</span>
              <span className="text-[10px] text-amber-300 font-mono">6 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Temperament disposition</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">7. Bhakoot</span>
              <span className="text-[10px] text-amber-300 font-mono">7 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Family joy & financial welfare</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-200">8. Nadi</span>
              <span className="text-[10px] text-amber-300 font-mono">8 pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Constitutional & genetic health</p>
          </div>
        </div>
      </div>

      {/* Safety & Prototype Notice */}
      <div className="p-3.5 rounded-xl bg-[#0c1222] border border-amber-500/25 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-300 leading-relaxed">
          <span className="font-semibold text-amber-300 block mb-0.5">
            Sample / Demo Calculation Notice
          </span>
          Traditional astrology-based matching is shown for informational/entertainment purposes. Real calculation and interpretation will be added later.
        </div>
      </div>
    </div>
  );
};
