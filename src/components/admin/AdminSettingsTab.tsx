import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Percent, 
  DollarSign, 
  Power, 
  Compass, 
  Save, 
  Check, 
  AlertTriangle,
  Globe,
  Sliders,
  Server
} from 'lucide-react';
import { AdminPlatformSettings } from '../../types';

interface AdminSettingsTabProps {
  settings: AdminPlatformSettings;
  onUpdateSettings: (newSettings: Partial<AdminPlatformSettings>) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [commission, setCommission] = useState(settings.platformCommissionPercent);
  const [minPrice, setMinPrice] = useState(settings.minConsultationPrice);
  const [currency, setCurrency] = useState(settings.currency);
  const [maintenance, setMaintenance] = useState(settings.maintenanceMode);
  const [ayanamsa, setAyanamsa] = useState(settings.astrologyCalculationEngine);
  const [allowRegistration, setAllowRegistration] = useState(settings.allowNewAstrologerRegistrations);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      platformCommissionPercent: commission,
      minConsultationPrice: minPrice,
      currency,
      maintenanceMode: maintenance,
      astrologyCalculationEngine: ayanamsa,
      allowNewAstrologerRegistrations: allowRegistration,
    });
    setSaveMessage('Platform settings successfully updated for this browser session!');
    setTimeout(() => {
      setSaveMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Global Platform Settings (Demo Prototype)</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono border border-[#233562]">
                PROTOTYPE ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure platform commission thresholds, ephemeris ayanamsa engine preferences, and operational flags.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Prototype state only. No persistent backend configuration.</span>
          </div>
        </div>
      </div>

      {/* Save Feedback */}
      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80">(Live State Synchronized)</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commission Percentage */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Platform Commission Percentage</span>
              </label>
              <span className="font-mono text-amber-300 font-bold text-xs">{commission}%</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The platform deduction percentage applied to gross consultation bookings.
            </p>
            <div className="pt-2">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0% (Free)</span>
                <span>20% (Default)</span>
                <span>50% (Max)</span>
              </div>
            </div>
          </div>

          {/* Minimum Consultation Price */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Minimum Consultation Floor (₹ / min)</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Astrologers cannot set their per-minute rate below this threshold.
            </p>
            <div className="pt-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Currency (INR - Demo) */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Platform Currency</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Default billing currency shown across client wallet and astrologer payouts.
            </p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl p-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="INR (₹) — Demo">INR (₹) — Demo</option>
              <option value="USD ($) — Demo">USD ($) — Demo</option>
              <option value="EUR (€) — Demo">EUR (€) — Demo</option>
            </select>
          </div>

          {/* Astrology Calculation Engine (Ayanamsa) */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Astrology Calculation Engine (Ayanamsa)</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Mathematical ephemeris model for sidereal zodiac longitude correction.
            </p>
            <select
              value={ayanamsa}
              onChange={(e) => setAyanamsa(e.target.value as any)}
              className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl p-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none font-bold"
            >
              <option value="Lahiri (Chitrapaksha) — Default">Lahiri (Chitrapaksha) — Indian Standard</option>
              <option value="KP (Krishnamurti Padhdhati)">KP (Krishnamurti Padhdhati)</option>
              <option value="Raman (B.V. Raman)">Raman (B.V. Raman)</option>
            </select>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Platform Maintenance Mode</span>
                <p className="text-[11px] text-slate-400">
                  When enabled, shows maintenance screen to public client visitors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenance(!maintenance)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  maintenance ? 'bg-amber-500' : 'bg-[#16203c]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    maintenance ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <span className={`text-[10px] font-bold block ${
              maintenance ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {maintenance ? 'Status: Maintenance Enabled (Simulated)' : 'Status: Live & Operational'}
            </span>
          </div>

          {/* Astrologer Registrations Toggle */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Allow New Astrologer Signups</span>
                <p className="text-[11px] text-slate-400">
                  Accept onboarding applications into the pending queue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowRegistration(!allowRegistration)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  allowRegistration ? 'bg-amber-500' : 'bg-[#16203c]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    allowRegistration ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <span className={`text-[10px] font-bold block ${
              allowRegistration ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {allowRegistration ? 'Status: Applications Accepted' : 'Status: Onboarding Paused'}
            </span>
          </div>
        </div>

        {/* Submit / Save Bar */}
        <div className="flex justify-end pt-3 border-t border-[#1e2b4f]">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration (Demo Prototype)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
