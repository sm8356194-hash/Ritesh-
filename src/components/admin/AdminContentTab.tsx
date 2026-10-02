import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Calendar, 
  HelpCircle, 
  Image as ImageIcon, 
  AlertTriangle, 
  Check, 
  Save, 
  ShieldCheck,
  Edit3,
  Moon,
  Sun
} from 'lucide-react';
import { AdminBannerItem, AdminFaqItem } from '../../types';
import { INITIAL_ADMIN_BANNERS, INITIAL_ADMIN_FAQS } from '../../data/adminMockData';
import { ZODIAC_SIGNS, PANCHANG_TODAY } from '../../data/astrologyMockData';

export const AdminContentTab: React.FC = () => {
  const [contentSection, setContentSection] = useState<'daily' | 'weekly' | 'monthly' | 'panchang' | 'banners' | 'faq'>('daily');
  const [selectedZodiacId, setSelectedZodiacId] = useState('aries');
  
  // Local state for interactive editing in memory
  const [banners, setBanners] = useState<AdminBannerItem[]>(INITIAL_ADMIN_BANNERS);
  const [faqs, setFaqs] = useState<AdminFaqItem[]>(INITIAL_ADMIN_FAQS);
  
  // Horoscope state
  const [horoscopeText, setHoroscopeText] = useState(
    'Mars infuses high vitality today. Excellent time for leadership decisions and initiating bold ventures with clear focus.'
  );
  const [weeklyText, setWeeklyText] = useState(
    'A week of steady professional momentum. Mid-week lunar transit encourages collaborative agreements.'
  );
  const [monthlyText, setMonthlyText] = useState(
    'October brings enhanced focus to personal development, family harmony, and disciplined long-term planning.'
  );

  // Panchang state
  const [panchangTithi, setPanchangTithi] = useState(PANCHANG_TODAY.tithi.name);
  const [panchangNakshatra, setPanchangNakshatra] = useState(PANCHANG_TODAY.nakshatra.name);
  const [panchangAuspicious, setPanchangAuspicious] = useState(`${PANCHANG_TODAY.abhijitMuhurat.start} - ${PANCHANG_TODAY.abhijitMuhurat.end}`);

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const triggerSaveNotification = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3500);
  };

  const handleToggleBanner = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    triggerSaveNotification('Banner visibility updated in prototype state.');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Mandatory Disclaimers */}
      <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Content & Editorial Management (Demo)</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono border border-[#233562]">
                PROTOTYPE CMS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Curate daily predictions, weekly/monthly forecasts, Vedic Panchang ephemeris texts, and promotional announcements.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Content changes are not saved to a backend in this prototype.</span>
          </div>
        </div>

        {/* Essential Astrological Content Mandate Notice */}
        <div className="p-3 rounded-xl bg-[#111a30] border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>IMPORTANT:</strong> Astrological content is provided for cultural, contemplative, and educational reflection only. Do not generate medical, legal, or financial advice as astrology facts.
          </span>
        </div>
      </div>

      {/* Content Navigation Sub-tabs */}
      <div className="flex bg-[#0c1222] p-1 rounded-2xl border border-[#1e2b4f] text-xs overflow-x-auto scrollbar-none">
        {[
          { id: 'daily', label: 'Daily Horoscope', icon: Sun },
          { id: 'weekly', label: 'Weekly Horoscope', icon: Calendar },
          { id: 'monthly', label: 'Monthly Horoscope', icon: Moon },
          { id: 'panchang', label: 'Panchang Content', icon: Sparkles },
          { id: 'banners', label: 'App Banners', icon: ImageIcon },
          { id: 'faq', label: 'FAQ Manager', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = contentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setContentSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111a30]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Save Feedback Toast */}
      {saveFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveFeedback}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">(Memory state updated)</span>
        </div>
      )}

      {/* 1. Daily Horoscope Section */}
      {contentSection === 'daily' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2b4f]">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-sm">Daily Planetary Horoscope</h3>
              <p className="text-xs text-slate-400">Configure daily transit reflections for each zodiac rashi.</p>
            </div>

            {/* Zodiac Selector */}
            <select
              value={selectedZodiacId}
              onChange={(e) => setSelectedZodiacId(e.target.value)}
              className="bg-[#111a30] text-slate-200 border border-[#1e2b4f] rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
            >
              {ZODIAC_SIGNS.map(z => (
                <option key={z.id} value={z.id}>{z.symbol} {z.name} ({z.sanskritName})</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Daily General Forecast ({ZODIAC_SIGNS.find(z => z.id === selectedZodiacId)?.name}):
              </label>
              <textarea
                rows={3}
                value={horoscopeText}
                onChange={(e) => setHoroscopeText(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl p-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none leading-relaxed"
                placeholder="Enter daily astrological reflection..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                <span className="text-[10px] text-slate-400 block font-bold">Lucky Color (Demo)</span>
                <input
                  type="text"
                  defaultValue="Coral Red & Gold"
                  className="mt-1 w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg px-2 py-1 text-slate-200 text-xs"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                <span className="text-[10px] text-slate-400 block font-bold">Lucky Number</span>
                <input
                  type="text"
                  defaultValue="9"
                  className="mt-1 w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                <span className="text-[10px] text-slate-400 block font-bold">Favorable Muhurat Window</span>
                <input
                  type="text"
                  defaultValue="09:30 AM - 11:15 AM"
                  className="mt-1 w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg px-2 py-1 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1e2b4f]">
            <button
              onClick={() => triggerSaveNotification('Daily horoscope preview updated.')}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes (Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Weekly Horoscope Section */}
      {contentSection === 'weekly' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="pb-3 border-b border-[#1e2b4f]">
            <h3 className="font-serif font-bold text-slate-100 text-sm">Weekly Astrological Summary</h3>
            <p className="text-xs text-slate-400">Overview of planetary movements for the ongoing 7-day period.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Weekly Forecast Overview:
              </label>
              <textarea
                rows={4}
                value={weeklyText}
                onChange={(e) => setWeeklyText(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl p-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1e2b4f]">
            <button
              onClick={() => triggerSaveNotification('Weekly forecast preview updated.')}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Weekly Forecast (Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Monthly Horoscope Section */}
      {contentSection === 'monthly' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="pb-3 border-b border-[#1e2b4f]">
            <h3 className="font-serif font-bold text-slate-100 text-sm">Monthly Planetary Transits</h3>
            <p className="text-xs text-slate-400">In-depth monthly outlook, major planet ingress, and retrograde notices.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Monthly Transit Highlights (October 2026):
              </label>
              <textarea
                rows={4}
                value={monthlyText}
                onChange={(e) => setMonthlyText(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-xl p-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1e2b4f]">
            <button
              onClick={() => triggerSaveNotification('Monthly outlook preview updated.')}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Monthly Forecast (Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Panchang Content Section */}
      {contentSection === 'panchang' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="pb-3 border-b border-[#1e2b4f]">
            <h3 className="font-serif font-bold text-slate-100 text-sm">Vedic Panchang Ephemeris Editorial</h3>
            <p className="text-xs text-slate-400">Maintain daily Tithi, Nakshatra, and Abhijit Muhurat display texts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Current Tithi</span>
              <input
                type="text"
                value={panchangTithi}
                onChange={(e) => setPanchangTithi(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg p-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Nakshatra</span>
              <input
                type="text"
                value={panchangNakshatra}
                onChange={(e) => setPanchangNakshatra(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg p-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-1 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold block">Abhijit Auspicious Muhurat</span>
              <input
                type="text"
                value={panchangAuspicious}
                onChange={(e) => setPanchangAuspicious(e.target.value)}
                className="w-full bg-[#0c1222] border border-[#1e2b4f] rounded-lg p-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1e2b4f]">
            <button
              onClick={() => triggerSaveNotification('Panchang editorial values saved to demo state.')}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Panchang Text (Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. App Banners */}
      {contentSection === 'banners' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e2b4f]">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-sm">Client App Promotional Banners</h3>
              <p className="text-xs text-slate-400">Manage interactive banners displayed at the top of the client dashboard.</p>
            </div>
          </div>

          <div className="space-y-3">
            {banners.map((banner) => (
              <div 
                key={banner.id}
                className="p-4 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                      {banner.badge}
                    </span>
                    <span className="font-bold text-slate-100 text-sm">{banner.title}</span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">{banner.subtitle}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">CTA: {banner.ctaText}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    banner.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {banner.active ? 'Active' : 'Hidden'}
                  </span>
                  <button
                    onClick={() => handleToggleBanner(banner.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-xs font-bold border border-[#233562] transition-all"
                  >
                    {banner.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. FAQ Manager */}
      {contentSection === 'faq' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-[#1e2b4f] space-y-4">
          <div className="pb-3 border-b border-[#1e2b4f]">
            <h3 className="font-serif font-bold text-slate-100 text-sm">Frequently Asked Questions (FAQ)</h3>
            <p className="text-xs text-slate-400">Review guidance explanations regarding astrology basics and consultation mechanics.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-4 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{faq.question}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#16203c] text-amber-300 font-mono">
                    {faq.category}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] bg-[#0c1222] p-2.5 rounded-lg border border-[#1e2b4f]/60">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
