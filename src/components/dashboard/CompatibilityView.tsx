import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Award
} from 'lucide-react';
import { ZODIAC_SIGNS } from '../../data/astrologyMockData';
import { UserBirthDetails } from '../../types';

interface CompatibilityViewProps {
  userDetails: UserBirthDetails;
}

export const CompatibilityView: React.FC<CompatibilityViewProps> = ({ userDetails }) => {
  const [partnerName, setPartnerName] = useState('Sample Partner');
  const [partnerSignId, setPartnerSignId] = useState('sagittarius');
  const [calculated, setCalculated] = useState(true);

  const kootas = [
    { name: 'Varna', meaning: 'Spiritual alignment & ego harmony', max: 1, scored: 1 },
    { name: 'Vashya', meaning: 'Mutual attraction & influence', max: 2, scored: 2 },
    { name: 'Tara', meaning: 'Destiny, health & longevity bond', max: 3, scored: 2.5 },
    { name: 'Yoni', meaning: 'Physical intimacy & biological compatibility', max: 4, scored: 3 },
    { name: 'Graha Maitri', meaning: 'Mental friendship & planetary kinship', max: 5, scored: 4.5 },
    { name: 'Gana', meaning: 'Temperament & psychological disposition', max: 6, scored: 5 },
    { name: 'Bhakoot', meaning: 'Family happiness & financial prosperity', max: 7, scored: 6 },
    { name: 'Nadi', meaning: 'Genetic constitution & progeny health', max: 8, scored: 7 },
  ];

  const totalScored = kootas.reduce((acc, k) => acc + k.scored, 0); // 31 out of 36

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-serif font-bold text-slate-100">
                Matchmaking (Ashtakoot Gun Milan Demo)
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                DEMO DATA
              </span>
            </div>
            <p className="text-[11px] text-amber-300/80">
              Sample 8-fold compatibility simulation for lifelong partnership.
            </p>
          </div>
        </div>

        {/* Partner Input Card */}
        <div className="mt-3 p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f] space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Primary Chart</label>
              <div className="p-2 rounded-lg bg-[#111a30] text-slate-200 font-semibold truncate">
                {userDetails.fullName || 'Arya Sharma'} (Leo ♌)
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Partner's Name</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner name"
                className="w-full p-2 rounded-lg bg-[#111a30] text-slate-100 border border-[#1e2b4f] focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Partner's Moon Rashi / Zodiac</label>
            <select
              value={partnerSignId}
              onChange={(e) => setPartnerSignId(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#111a30] text-slate-200 border border-[#1e2b4f] text-xs focus:outline-none focus:border-amber-400"
            >
              {ZODIAC_SIGNS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.symbol} {s.name} ({s.sanskritName}) - {s.element}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Compatibility Result Scorecard */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-amber-400/40 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Sample Gun Milan Score
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                DEMO DATA
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-bold text-amber-300">
                {totalScored}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ 36 Sample Gunas</span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sample Rating: Uttam (Auspicious Archetype)</span>
            </p>
          </div>

          <div className="px-3 py-2 rounded-xl bg-[#16203c] border border-amber-500/30 text-center">
            <span className="text-[11px] font-bold text-amber-300 block font-serif">Sample Match</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Demo Milan</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 mt-3 pt-3 border-t border-[#1e2b4f]/60 leading-relaxed">
          Illustrative preview: The pairing between <span className="text-amber-300 font-medium">Leo (Simha)</span> and <span className="text-amber-300 font-medium">Sagittarius (Dhanu)</span> represents a demonstrative fire-sign harmonic archetype. Not calculated from personal birth horoscopes.
        </p>
      </div>

      {/* 8-Koota Breakdown List */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Sample Ashtakoot 8-Pillar Scoring
          </h3>
          <span className="text-[9px] text-slate-500">Demo Breakdown</span>
        </div>

        <div className="space-y-2.5">
          {kootas.map((k, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200 font-serif">
                  {idx + 1}. {k.name}
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {k.scored} / {k.max} pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{k.meaning}</p>
              
              {/* Progress bar */}
              <div className="w-full bg-[#0c1222] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full"
                  style={{ width: `${(k.scored / k.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dosha Reconciliation */}
      <div className="p-3.5 rounded-xl bg-[#0c1222] border border-emerald-500/30 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-300 leading-relaxed">
          <span className="font-semibold text-emerald-300 block mb-0.5">Sample Nadi & Dosha Reconciliation (Demo Only)</span>
          Illustrative clearance shown for prototype simulation. Real matrimonial matchmaking requires comprehensive kundli analysis.
        </div>
      </div>

      <p className="text-[10px] text-slate-500 text-center px-4 leading-relaxed">
        * Matchmaking scores and koota points are sample demonstration data only.
      </p>
    </div>
  );
};
