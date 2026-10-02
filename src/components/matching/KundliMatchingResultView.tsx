import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Sparkles, 
  Award, 
  Moon, 
  Sun, 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Share2, 
  Bookmark, 
  PhoneCall, 
  ArrowLeft, 
  Check, 
  Copy, 
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { KundliMatchingResult, BirthProfile } from '../../types';

interface KundliMatchingResultViewProps {
  result: KundliMatchingResult;
  onModifyProfiles: () => void;
  onTalkToAstrologer: () => void;
}

export const KundliMatchingResultView: React.FC<KundliMatchingResultViewProps> = ({
  result,
  onModifyProfiles,
  onTalkToAstrologer,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savedMatch, setSavedMatch] = useState(false);
  const [expandedKootaId, setExpandedKootaId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveMatch = () => {
    setSavedMatch(true);
    showToast('Match saved in local demo session (Frontend Prototype Only)');
  };

  const handleShareReport = () => {
    setShowShareModal(true);
  };

  const handleCopyDemoLink = () => {
    setLinkCopied(true);
    navigator.clipboard?.writeText?.(window.location.href);
    showToast('Demo link copied to clipboard!');
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-400 text-amber-200 text-xs shadow-2xl flex items-center gap-2 max-w-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl bg-[#0c1222] border border-amber-500/30 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1e2b4f] pb-3">
              <div className="flex items-center gap-2 text-slate-100 font-serif font-bold text-sm">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share Demo Match Report</span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg hover:bg-[#16203c] text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This prototype generates a simulated link for demonstration purposes. No personal data is stored on remote servers or transmitted to third parties.
            </p>

            <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f] text-[11px] font-mono text-amber-300 flex items-center justify-between gap-2 overflow-hidden">
              <span className="truncate">
                https://talkwithastrologers.demo/match/{encodeURIComponent(result.person1.name)}-vs-{encodeURIComponent(result.person2.name)}
              </span>
              <button
                onClick={handleCopyDemoLink}
                className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:brightness-110 shrink-0"
                title="Copy Link"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Navigation & Action Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onModifyProfiles}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Profiles</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveMatch}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              savedMatch
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-[#0c1222] hover:bg-[#16203c] text-slate-300 border-[#1e2b4f]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>{savedMatch ? 'Saved (Demo)' : 'Save Match'}</span>
          </button>

          <button
            onClick={handleShareReport}
            className="px-3 py-1.5 rounded-xl bg-[#0c1222] hover:bg-[#16203c] text-slate-300 border border-[#1e2b4f] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Share Report</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: PERSON 1 VS PERSON 2 HEADER CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Vedic Kundli Matching
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {result.isCalculated ? 'CALCULATED MATCH' : 'DEMO CALCULATION'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Ashtakoot Milan
          </span>
        </div>

        {/* Person 1 vs Person 2 Comparison Banner */}
        <div className="grid grid-cols-11 items-center gap-1 bg-[#070b14]/70 p-3 rounded-xl border border-[#1e2b4f]/70 text-center">
          {/* Person 1 */}
          <div className="col-span-5 text-left">
            <span className="text-[10px] text-amber-300/80 font-medium block">Person 1</span>
            <h4 className="text-sm font-serif font-bold text-slate-100 truncate">
              {result.person1.name}
            </h4>
            <div className="text-[10px] text-slate-400 space-y-0.5 mt-0.5">
              <p className="truncate">DOB: {result.person1.dateOfBirth}</p>
              <p className="truncate">{result.person1.birthPlace}</p>
            </div>
          </div>

          {/* VS Divider */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-[10px] font-bold text-amber-300 font-serif">
              vs
            </div>
          </div>

          {/* Person 2 */}
          <div className="col-span-5 text-right">
            <span className="text-[10px] text-amber-300/80 font-medium block">Person 2</span>
            <h4 className="text-sm font-serif font-bold text-slate-100 truncate">
              {result.person2.name}
            </h4>
            <div className="text-[10px] text-slate-400 space-y-0.5 mt-0.5">
              <p className="truncate">DOB: {result.person2.dateOfBirth}</p>
              <p className="truncate">{result.person2.birthPlace}</p>
            </div>
          </div>
        </div>

        {/* SECTION 5: REAL GUNA MILAN SCORE */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#16203c]/90 to-[#101930]/90 border border-amber-400/40 text-center relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
            {result.isCalculated ? 'Ashtakoota Guna Milan' : 'Demo Guna Milan'}
          </span>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-serif font-extrabold text-amber-300 tracking-tight">
              {result.gunaMilan.totalScore} / {result.gunaMilan.maxScore}
            </span>
          </div>

          <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold uppercase tracking-wider">
            {result.gunaMilan.label}
          </div>

          <p className="text-[11px] text-slate-300 mt-2.5 max-w-sm mx-auto leading-relaxed">
            {result.gunaMilan.verdictDisclaimer}
          </p>

          <p className="text-[10px] text-amber-400/90 font-medium mt-1">
            Rating: {result.gunaMilan.level}
          </p>
        </div>
      </motion.div>

      {/* SECTION 6: ASHTAKOOTA BREAKDOWN */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e2b4f]/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-serif font-bold text-slate-100">
              Ashtakoota Breakdown (36 Gunas)
            </h3>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
            8 Kootas
          </span>
        </div>

        {/* Eight Demo Rows */}
        <div className="space-y-2">
          {result.ashtakoota.map((koota, index) => {
            const isExpanded = expandedKootaId === koota.id;
            const percentage = (koota.obtainedScore / koota.maxScore) * 100;

            return (
              <div
                key={koota.id}
                className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]/70 transition-all"
              >
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedKootaId(isExpanded ? null : koota.id)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-serif font-bold text-slate-200">
                        {index + 1}. {koota.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#16203c] text-amber-300/90 font-medium">
                        {koota.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{koota.area}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {koota.obtainedScore} / {koota.maxScore}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">pts</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="w-full bg-[#0c1222] h-1.5 rounded-full mt-2 overflow-hidden border border-[#1e2b4f]/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      koota.obtainedScore === 0
                        ? 'bg-rose-500/80'
                        : koota.obtainedScore === koota.maxScore
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-300'
                    }`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#1e2b4f]/60 text-[11px] text-slate-300 space-y-1">
                    <p className="text-slate-400">{koota.meaning}</p>
                    <p className="text-amber-200/90 font-medium bg-[#0c1222]/80 p-2 rounded-lg border border-[#1e2b4f]/40">
                      {koota.detail}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section 6 Mandatory Notice */}
        <div className="p-2.5 rounded-xl bg-[#16203c]/60 border border-amber-500/20 text-center">
          <p className="text-[11px] text-amber-300/90 font-medium">
            {result.calculationNotice}
          </p>
        </div>
      </div>

      {/* SECTION 7: OTHER SECTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-serif font-bold text-slate-200">
            Astrological Dimensions & Considerations
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
            {result.isCalculated ? 'ASHTAKOOTA' : 'SAMPLE / DEMO'}
          </span>
        </div>

        {/* 1. Moon Sign Comparison */}
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Moon Sign Comparison
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-400/10 text-sky-300 border border-sky-400/20">
              SAMPLE / DEMO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person1.name}'s Moon</span>
              <span className="font-semibold text-amber-300 text-[11px]">{result.moonSignComparison.person1Moon}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person2.name}'s Moon</span>
              <span className="font-semibold text-amber-300 text-[11px]">{result.moonSignComparison.person2Moon}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            {result.moonSignComparison.note}
          </p>
        </div>

        {/* 2. Nakshatra Comparison */}
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Nakshatra Comparison
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
              SAMPLE / DEMO
            </span>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person1.name}'s Constellation:</span>
              <span className="font-semibold text-slate-200 text-[11px]">{result.nakshatraComparison.person1Nakshatra}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person2.name}'s Constellation:</span>
              <span className="font-semibold text-slate-200 text-[11px]">{result.nakshatraComparison.person2Nakshatra}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            {result.nakshatraComparison.compatibilityNote}
          </p>
        </div>

        {/* 3. Manglik Check */}
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Manglik Check
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              SAMPLE / DEMO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person1.name}:</span>
              <span className="font-semibold text-rose-300 text-[11px]">{result.manglikCheck.person1Status}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <span className="text-[10px] text-slate-400 block">{result.person2.name}:</span>
              <span className="font-semibold text-amber-300 text-[11px]">{result.manglikCheck.person2Status}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            {result.manglikCheck.reconciliationNote}
          </p>
        </div>

        {/* 4. Bhakoot */}
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Bhakoot
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
              SAMPLE / DEMO
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60 flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">{result.bhakootCheck.status}</span>
            <span className="font-mono text-amber-300 font-bold">{result.bhakootCheck.score}</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {result.bhakootCheck.reconciliationNote}
          </p>
        </div>

        {/* 5. Nadi */}
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-serif font-bold text-slate-200">
                Nadi
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              SAMPLE / DEMO
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60 flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">{result.nadiCheck.status}</span>
            <span className="font-mono text-emerald-400 font-bold">{result.nadiCheck.score}</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {result.nadiCheck.reconciliationNote}
          </p>
        </div>

        {/* 6. Overall Traditional Interpretation */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-serif font-bold text-slate-100">
                Overall Traditional Interpretation
              </h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              SAMPLE / DEMO
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {result.overallInterpretation.summary}
          </p>

          <div className="p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-[11px] text-slate-400 leading-relaxed">
            {result.overallInterpretation.guidance}
          </div>
        </div>
      </div>

      {/* SECTION 8: ASTROLOGER CALL TO ACTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-[#101930] via-[#141e38] to-[#0c1222] border border-amber-500/40 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-serif font-bold text-slate-100">
              Want a personalized reading?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect with verified Vedic astrologers for in-depth chart matching, dasha timings, and personalized matrimonial consultation.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2b4f]">
          <button
            id="talk-to-astrologer-btn"
            onClick={onTalkToAstrologer}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-slate-950" />
            <span>Talk to an Astrologer</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
            * The matching result does not make a final decision about the relationship. Consultations are for guidance and personal insight.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
