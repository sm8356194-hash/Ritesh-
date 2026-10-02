import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  Info, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCw,
  Flame,
  Award,
  Moon,
  Calendar,
  Layers,
  HeartHandshake,
  ChevronRight
} from 'lucide-react';
import { UserBirthDetails, DashboardSection } from '../../types';
import { calculateBirthChart } from '../../services/astrologyEngine';
import { SAMPLE_DASHA_PERIODS, SAMPLE_NAKSHATRA_DETAILS, KUNDLI_HOUSES_DATA } from '../../data/astrologyMockData';
import { useTranslation } from '../../services/languageService';

interface KundliViewProps {
  userDetails: UserBirthDetails;
  embeddedInConsultation?: boolean;
  onNavigateSection?: (section: DashboardSection) => void;
}

export const KundliView: React.FC<KundliViewProps> = ({ userDetails, onNavigateSection }) => {
  const { t } = useTranslation();
  const [selectedHouseNumber, setSelectedHouseNumber] = useState<number>(1);
  const [chartType, setChartType] = useState<'D1' | 'D9'>('D1');

  // Compute standard chart through centralized calculation engine
  const chartData = calculateBirthChart(userDetails);
  const isRealEngine = chartData?.calculationStatus === 'REAL' || chartData?.calculationEngineStatus === 'CONNECTED';
  const engineNotice = chartData?.calculationNotice || 'Calculated via Swiss Ephemeris (Vedic Sidereal Lahiri / Whole Sign)';
  const engineBadge = chartData?.calculationEngine || 'Swiss Ephemeris v2.10.03';

  const houses = (chartData?.houses && chartData.houses.length > 0) ? chartData.houses : KUNDLI_HOUSES_DATA;
  const planets = chartData?.planets || [];
  const nakshatra = chartData?.nakshatra || SAMPLE_NAKSHATRA_DETAILS;

  const selectedHouse = houses.find(h => h.houseNumber === selectedHouseNumber) || houses[0] || KUNDLI_HOUSES_DATA[0];

  const getHousePlanetsStr = (houseNum: number): string => {
    const h = houses.find(item => item.houseNumber === houseNum);
    if (!h || !h.planets || h.planets.length === 0) return '-';
    return h.planets.map(p => {
      if (p.startsWith('Sun')) return 'Su';
      if (p.startsWith('Moon')) return 'Mo';
      if (p.startsWith('Mars')) return 'Ma';
      if (p.startsWith('Mercury')) return 'Me';
      if (p.startsWith('Jupiter')) return 'Ju';
      if (p.startsWith('Venus')) return 'Ve';
      if (p.startsWith('Saturn')) return 'Sa';
      if (p.startsWith('Rahu')) return 'Ra';
      if (p.startsWith('Ketu')) return 'Ke';
      return p.slice(0, 2);
    }).join(' • ');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-[#1e2b4f] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-serif font-bold text-slate-100">
                  {t('vedicKundliChart')}
                </h2>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isRealEngine 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  {isRealEngine ? engineBadge : 'Sample / Demo Calculation'}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isRealEngine ? 'text-emerald-300/90' : 'text-amber-300/80'}`}>
                {isRealEngine ? engineNotice : 'Illustrative sample chart • Real ephemeris calculation engine not connected'}
              </p>
            </div>
          </div>

          {/* D1 / D9 Switcher */}
          <div className="flex bg-[#16203c] p-0.5 rounded-lg border border-[#1e2b4f]">
            <button
              onClick={() => setChartType('D1')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                chartType === 'D1'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('d1Rashi')}
            </button>
            <button
              onClick={() => setChartType('D9')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                chartType === 'D9'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('d9Navamsha')}
            </button>
          </div>
        </div>

        {/* Registered Parameters Strip */}
        <div className="pt-2 mt-2 border-t border-[#1e2b4f]/60 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
          <span>
            Profile: <strong className="text-slate-200">{userDetails.name || userDetails.fullName || 'Demo Profile'}</strong>
          </span>
          <span>
            {userDetails.dateOfBirth || userDetails.dob} • {userDetails.birthTimeKnown === false ? 'Time: Unknown (Solar 12:00)' : userDetails.birthTime}
          </span>
          <span className="font-mono text-amber-300/80">
            {userDetails.latitude !== undefined ? `${userDetails.latitude.toFixed(2)}°N, ${userDetails.longitude?.toFixed(2)}°E` : '28.61°N, 77.21°E'} ({userDetails.timezone || 'Asia/Kolkata'})
          </span>
        </div>
      </div>

      {/* Traditional North Indian Vedic Diamond Kundli Chart SVG */}
      <div 
        className="p-4 rounded-2xl bg-[#0c1222] border border-amber-500/30 shadow-xl relative overflow-hidden"
        style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', isolation: 'isolate' }}
      >
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Vedic Birth Chart ({chartType}) — <span className="text-[10px] text-amber-400/90 font-mono">{isRealEngine ? engineBadge : 'Sample / Demo Calculation'}</span>
          </span>
          <span className="text-[10px] text-slate-400">{t('tapHouseToInspect')}</span>
        </div>

        {/* Responsive Vedic Chart Diamond Grid */}
        <div 
          className="relative w-full aspect-square max-w-[340px] mx-auto bg-[#070b14] rounded-xl border border-amber-400/40 p-1 overflow-hidden"
          style={{ transform: 'translateZ(0)', contain: 'paint' }}
        >
          <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full select-none block"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Outer Box */}
            <rect x="2" y="2" width="396" height="396" fill="#0c1222" stroke="#d4af37" strokeWidth="2" />

            {/* Diagonal Crosses */}
            <line x1="2" y1="2" x2="398" y2="398" stroke="#d4af37" strokeWidth="1.5" opacity="0.8" />
            <line x1="398" y1="2" x2="2" y2="398" stroke="#d4af37" strokeWidth="1.5" opacity="0.8" />

            {/* Inner Rhombus Diamond */}
            <polygon points="200,2 398,200 200,398 2,200" fill="none" stroke="#d4af37" strokeWidth="1.75" />

            {/* Inner Diagonal Lines defining houses 2, 3, 5, 6, 8, 9, 11, 12 */}
            <line x1="2" y1="2" x2="200" y2="200" stroke="#d4af37" strokeWidth="1.2" opacity="0.5" />
            <line x1="398" y1="2" x2="200" y2="200" stroke="#d4af37" strokeWidth="1.2" opacity="0.5" />
            <line x1="2" y1="398" x2="200" y2="200" stroke="#d4af37" strokeWidth="1.2" opacity="0.5" />
            <line x1="398" y1="398" x2="200" y2="200" stroke="#d4af37" strokeWidth="1.2" opacity="0.5" />

            {/* House Labels & Clickable Targets */}
            {/* House 1 (Lagna - Top Center Diamond) */}
            <g onClick={() => setSelectedHouseNumber(1)} className="cursor-pointer">
              <polygon points="200,4 100,100 200,200 300,100" fill={selectedHouseNumber === 1 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 1 ? '0.35' : '0.1'} />
              <text x="200" y="70" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="bold">H1 (Lagna)</text>
              <text x="200" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="11">{getHousePlanetsStr(1)}</text>
              <text x="200" y="110" textAnchor="middle" fill="#94a3b8" fontSize="10">Sign {houses[0]?.signNumber || 1}</text>
            </g>

            {/* House 2 (Top Left Triangle) */}
            <g onClick={() => setSelectedHouseNumber(2)} className="cursor-pointer">
              <polygon points="4,4 100,100 200,4" fill={selectedHouseNumber === 2 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 2 ? '0.35' : '0.05'} />
              <text x="100" y="45" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H2</text>
              <text x="100" y="62" textAnchor="middle" fill="#e2e8f0" fontSize="10">{getHousePlanetsStr(2)}</text>
            </g>

            {/* House 3 (Left Top Triangle) */}
            <g onClick={() => setSelectedHouseNumber(3)} className="cursor-pointer">
              <polygon points="4,4 4,200 100,100" fill={selectedHouseNumber === 3 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 3 ? '0.35' : '0.05'} />
              <text x="45" y="105" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H3</text>
              <text x="45" y="122" textAnchor="middle" fill="#94a3b8" fontSize="10">{getHousePlanetsStr(3)}</text>
            </g>

            {/* House 4 (Center Left Diamond) */}
            <g onClick={() => setSelectedHouseNumber(4)} className="cursor-pointer">
              <polygon points="4,200 100,100 200,200 100,300" fill={selectedHouseNumber === 4 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 4 ? '0.35' : '0.1'} />
              <text x="100" y="195" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="bold">H4</text>
              <text x="100" y="215" textAnchor="middle" fill="#e2e8f0" fontSize="11">{getHousePlanetsStr(4)}</text>
            </g>

            {/* House 5 (Left Bottom Triangle) */}
            <g onClick={() => setSelectedHouseNumber(5)} className="cursor-pointer">
              <polygon points="4,200 4,396 100,300" fill={selectedHouseNumber === 5 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 5 ? '0.35' : '0.05'} />
              <text x="45" y="295" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H5</text>
              <text x="45" y="312" textAnchor="middle" fill="#e2e8f0" fontSize="10">{getHousePlanetsStr(5)}</text>
            </g>

            {/* House 6 (Bottom Left Triangle) */}
            <g onClick={() => setSelectedHouseNumber(6)} className="cursor-pointer">
              <polygon points="4,396 200,396 100,300" fill={selectedHouseNumber === 6 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 6 ? '0.35' : '0.05'} />
              <text x="100" y="360" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H6</text>
              <text x="100" y="377" textAnchor="middle" fill="#e2e8f0" fontSize="10">{getHousePlanetsStr(6)}</text>
            </g>

            {/* House 7 (Center Bottom Diamond) */}
            <g onClick={() => setSelectedHouseNumber(7)} className="cursor-pointer">
              <polygon points="200,396 100,300 200,200 300,300" fill={selectedHouseNumber === 7 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 7 ? '0.35' : '0.1'} />
              <text x="200" y="290" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="bold">H7</text>
              <text x="200" y="310" textAnchor="middle" fill="#94a3b8" fontSize="11">{getHousePlanetsStr(7)}</text>
            </g>

            {/* House 8 (Bottom Right Triangle) */}
            <g onClick={() => setSelectedHouseNumber(8)} className="cursor-pointer">
              <polygon points="200,396 396,396 300,300" fill={selectedHouseNumber === 8 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 8 ? '0.35' : '0.05'} />
              <text x="300" y="360" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H8</text>
              <text x="300" y="377" textAnchor="middle" fill="#e2e8f0" fontSize="10">{getHousePlanetsStr(8)}</text>
            </g>

            {/* House 9 (Right Bottom Triangle) */}
            <g onClick={() => setSelectedHouseNumber(9)} className="cursor-pointer">
              <polygon points="396,200 396,396 300,300" fill={selectedHouseNumber === 9 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 9 ? '0.35' : '0.05'} />
              <text x="355" y="295" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H9</text>
              <text x="355" y="312" textAnchor="middle" fill="#94a3b8" fontSize="10">{getHousePlanetsStr(9)}</text>
            </g>

            {/* House 10 (Center Right Diamond) */}
            <g onClick={() => setSelectedHouseNumber(10)} className="cursor-pointer">
              <polygon points="396,200 300,100 200,200 300,300" fill={selectedHouseNumber === 10 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 10 ? '0.35' : '0.1'} />
              <text x="300" y="195" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="bold">H10</text>
              <text x="300" y="215" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">{getHousePlanetsStr(10)}</text>
            </g>

            {/* House 11 (Right Top Triangle) */}
            <g onClick={() => setSelectedHouseNumber(11)} className="cursor-pointer">
              <polygon points="396,4 396,200 300,100" fill={selectedHouseNumber === 11 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 11 ? '0.35' : '0.05'} />
              <text x="355" y="105" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H11</text>
              <text x="355" y="122" textAnchor="middle" fill="#94a3b8" fontSize="10">{getHousePlanetsStr(11)}</text>
            </g>

            {/* House 12 (Top Right Triangle) */}
            <g onClick={() => setSelectedHouseNumber(12)} className="cursor-pointer">
              <polygon points="200,4 396,4 300,100" fill={selectedHouseNumber === 12 ? '#d4af37' : '#16203c'} fillOpacity={selectedHouseNumber === 12 ? '0.35' : '0.05'} />
              <text x="300" y="45" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">H12</text>
              <text x="300" y="62" textAnchor="middle" fill="#e2e8f0" fontSize="10">{getHousePlanetsStr(12)}</text>
            </g>
          </svg>
        </div>

        {/* Selected House Inspector Card */}
        <div className="mt-4 p-3 rounded-xl bg-[#111a30] border border-amber-500/20">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
            <span>House {selectedHouse?.houseNumber ?? selectedHouseNumber}: {selectedHouse?.signName || 'Lagna'}</span>
            <span className="text-[10px] text-slate-400">Sign #{selectedHouse?.signNumber ?? selectedHouse?.houseNumber ?? selectedHouseNumber}</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            {selectedHouse?.significance || 'Vedic Bhava significance and life domain influence.'}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400">Planets present:</span>
            {selectedHouse?.planets && selectedHouse.planets.length > 0 ? (
              selectedHouse.planets.map((p, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-medium">
                  {p}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None (Aspects only)</span>
            )}
          </div>
        </div>
      </div>

      {/* Planetary Dignity & Degrees Table */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            {t('planetaryPositionsDignity')}
          </h3>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
            isRealEngine 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
          }`}>
            {isRealEngine ? engineBadge : 'Sample / Demo Calculation'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1e2b4f] text-slate-400">
                <th className="pb-2 font-medium">{t('graha')}</th>
                <th className="pb-2 font-medium">{t('rashi')}</th>
                <th className="pb-2 font-medium">{t('degree')}</th>
                <th className="pb-2 font-medium">{t('bhava')}</th>
                <th className="pb-2 font-medium text-right">{t('dignity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2b4f]/40">
              {planets.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#16203c]/40 transition-colors">
                  <td className="py-2 text-slate-200 font-medium flex items-center gap-1">
                    <span>{p.name || p.planet}</span>
                    {(p.retrograde || p.isRetrograde) && (
                      <span className="text-[9px] px-1 rounded bg-rose-950 text-rose-300 font-bold" title="Retrograde (Vakri)">
                        R
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-slate-300">{p.sign}</td>
                  <td className="py-2 text-slate-400 font-mono text-[10px]">{p.degree}</td>
                  <td className="py-2 text-amber-400/90 font-medium">H{p.house}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'Exalted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : p.status === 'Own Sign'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : p.status === 'Debilitated'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {p.status === 'Exalted' ? t('exalted') : p.status === 'Own Sign' ? t('ownSign') : p.status === 'Debilitated' ? t('debilitated') : t('neutral')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          * Calculated coordinates via {engineNotice}.
        </p>
      </div>

      {/* Nakshatra & Lagna Section */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-amber-400" />
            {t('birthNakshatra')}
          </h3>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
            isRealEngine 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
          }`}>
            {isRealEngine ? engineBadge : 'Sample / Demo Calculation'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#111a30] border border-amber-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-bold text-sm">
              {nakshatra.name} • Pada {nakshatra.pada}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-medium">
              {t('lord')}: {nakshatra.lord}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#1e2b4f]">
            <div>
              <span className="text-slate-400 block text-[10px]">{t('deity')}</span>
              <span className="text-slate-200 font-medium">{nakshatra.deity || 'Brahma / Prajapati'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('symbol')}</span>
              <span className="text-slate-200 font-medium">{nakshatra.symbol || 'Chariot / Temple'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('guna')}</span>
              <span className="text-slate-200 font-medium">{SAMPLE_NAKSHATRA_DETAILS.gana}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t('nature')}</span>
              <span className="text-slate-200 font-medium">{SAMPLE_NAKSHATRA_DETAILS.nature}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
            {SAMPLE_NAKSHATRA_DETAILS.significance}
          </p>
        </div>
      </div>

      {/* Vimshottari Dasha Section */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            {t('vimsottariDasha')}
          </h3>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
            isRealEngine 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
          }`}>
            {isRealEngine ? engineBadge : 'Sample / Demo Calculation'}
          </span>
        </div>

        <div className="space-y-2">
          {SAMPLE_DASHA_PERIODS.map((dasha, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all text-xs ${
                dasha.status === 'Current Active'
                  ? 'bg-[#16203c] border-amber-400/40'
                  : 'bg-[#111a30] border-[#1e2b4f]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100">{dasha.planet}</span>
                  <span className="text-[10px] text-amber-300">({dasha.level})</span>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-medium ${
                    dasha.status.includes('Active')
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-[#0c1222] text-slate-400 border border-[#1e2b4f]'
                  }`}
                >
                  {dasha.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>From: {dasha.startDate}</span>
                <span>To: {dasha.endDate}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                {dasha.influence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vedic Dosha Overview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-serif font-bold text-slate-300">
            {t('doshaAnalysis')}
          </span>
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Sample / Demo Calculation
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#0c1222] border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('manglikDosha')}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Sample status: No dosha observed in sample chart.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c1222] border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('kaalSarpDosha')}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Sample status: Balance configuration in demo profile.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c1222] border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>{t('shaniSadeSati')}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Sample status: Peaceful transit simulation.
            </p>
          </div>
        </div>
      </div>

      {/* Discover Kundli Matching from Kundli Chart */}
      {onNavigateSection && (
        <div 
          id="kundli-chart-discover-matching-card"
          onClick={() => onNavigateSection('kundli-matching')}
          className="p-3.5 rounded-xl bg-gradient-to-r from-[#141b30] to-[#0c1222] border border-amber-500/30 hover:border-amber-400/60 transition-all flex items-center justify-between cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  {t('matchKundliWithPartner')}
                </h4>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-sans border border-amber-400/30">
                  {t('kundliMatching')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t('matchKundliDesc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );
};
