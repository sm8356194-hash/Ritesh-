import React from 'react';
import { X, Sparkles, Compass, ShieldCheck, Calendar, Clock, MapPin, Eye } from 'lucide-react';
import { AdminUserItem, BirthProfile } from '../../types';
import { calculateBirthChart } from '../../services/astrologyEngine';

interface AdminSharedKundliModalProps {
  user: AdminUserItem;
  onClose: () => void;
}

export const AdminSharedKundliModal: React.FC<AdminSharedKundliModalProps> = ({ user, onClose }) => {
  // Use the identical shared calculation pipeline
  const chartData = calculateBirthChart(user.birthProfile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#0a0f1d] border border-amber-500/30 rounded-2xl shadow-2xl p-4 sm:p-6 my-auto text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#1e2b4f] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-300">
                <Compass className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-serif font-bold text-slate-100">
                  Kundli Horoscopic Inspection
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  SHARED DATA LAYER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                User: <span className="text-amber-300 font-bold">{user.name}</span> ({user.id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111a30] hover:bg-[#16203c] text-slate-400 hover:text-slate-100 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification banner */}
        <div className="p-3 rounded-xl bg-[#0c1222] border border-[#1e2b4f] mb-4 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            This Kundli uses the <strong>exact same calculation pipeline</strong> (<code>services/astrologyEngine.ts</code>) shared between the Client App, the Astrologer Workstation, and the Admin Panel. No secondary ephemeris or duplicate mathematical instance is instantiated.
          </p>
        </div>

        {/* Birth Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-xs">
          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
            <span className="text-[10px] text-slate-400 block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> Date of Birth
            </span>
            <span className="font-bold text-slate-200 mt-0.5 block">
              {user.birthProfile.dateOfBirth}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
            <span className="text-[10px] text-slate-400 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Time of Birth
            </span>
            <span className="font-bold text-slate-200 mt-0.5 block">
              {user.birthProfile.birthTimeKnown ? user.birthProfile.birthTime : 'Unknown (Solar 12:00)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f] col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> Location
            </span>
            <span className="font-bold text-slate-200 mt-0.5 block truncate" title={user.birthProfile.birthPlace}>
              {user.birthProfile.city || user.birthProfile.birthPlace}
            </span>
          </div>
        </div>

        {/* Primary Horoscopic Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              Ascendant (Lagna)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-serif font-bold text-slate-100">
                {chartData.ascendant.sign}
              </span>
              <span className="text-xs font-mono text-amber-300">
                {chartData.ascendant.degree}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nakshatra: {chartData.ascendant.nakshatra} (Pada {chartData.ascendant.pada})
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              Moon Sign (Rashi)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-serif font-bold text-slate-100">
                {chartData.moonSign.sign}
              </span>
              <span className="text-xs font-mono text-amber-300">
                Exalted (Uchcha)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nakshatra: {chartData.moonSign.nakshatra} (Pada {chartData.moonSign.pada})
            </p>
          </div>
        </div>

        {/* Planetary Positions Table */}
        <div className="border border-[#1e2b4f] rounded-xl overflow-hidden mb-4">
          <div className="bg-[#111a30] px-3 py-2 border-b border-[#1e2b4f] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Planetary Placements (Grahas)
            </span>
            <span className="text-[10px] text-amber-300 font-mono">D1 Rashi Chart</span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-[#1e2b4f]/60 text-xs">
            {chartData.planets.map((graha) => (
              <div key={graha.planet} className="px-3 py-2 flex items-center justify-between hover:bg-[#111a30]/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{graha.planet}</span>
                  <span className="text-slate-400 text-[11px]">({graha.sanskritName})</span>
                  {graha.isRetrograde && (
                    <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                      Vakri (R)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-300 text-[11px]">{graha.sign}</span>
                  <span className="font-mono text-amber-300 text-[11px] w-14 text-right">
                    {graha.degree}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16203c] text-slate-300 border border-[#233562] w-20 text-center">
                    House {graha.house}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1e2b4f]">
          <span>Calculation status: DEMO_VALUES_OK</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-xs font-bold transition-all"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
