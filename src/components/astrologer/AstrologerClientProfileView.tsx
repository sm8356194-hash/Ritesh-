import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Compass, 
  FileText, 
  History, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Save, 
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { DemoClient, DemoConsultationItem, UserBirthDetails } from '../../types';
import { KundliView } from '../dashboard/KundliView';
import { getClientChart } from '../../services/astrologyEngine';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AstrologerClientProfileViewProps {
  client: DemoClient;
  consultations: DemoConsultationItem[];
  onBack: () => void;
  onStartConsultation: (client: DemoClient) => void;
}

export const AstrologerClientProfileView: React.FC<AstrologerClientProfileViewProps> = ({
  client,
  consultations,
  onBack,
  onStartConsultation,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'kundli' | 'history' | 'notes'>('overview');
  const [privateNotes, setPrivateNotes] = useState<string>(client.notes);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Derive client userDetails for shared KundliView
  const clientUserDetails: UserBirthDetails = {
    name: client.name,
    fullName: client.name,
    dateOfBirth: client.dateOfBirth,
    dob: client.dateOfBirth,
    birthTime: client.birthTime,
    birthTimeKnown: client.birthTimeKnown,
    birthPlace: client.birthPlace,
    city: client.city,
    state: client.state,
    country: client.country,
    latitude: client.latitude,
    longitude: client.longitude,
    timezone: client.timezone,
    gender: client.gender,
    isDemoData: true,
  };

  // Shared Data Architecture: Confirm getClientChart stub executes with same pipeline
  const sharedChartResult = getClientChart(client.id, clientUserDetails);

  const clientConsultationHistory = consultations.filter(
    c => c.clientId === client.id || c.clientName === client.name
  );

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  return (
    <div className="space-y-3.5 pb-24 text-slate-100">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] transition-all flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToClients')}</span>
        </button>

        <div className="flex items-center gap-2">
          <GlobalLanguageSelector id="astro-client-profile-lang-selector" />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{t('clientFile')}</span>
          </div>
        </div>
      </div>

      {/* Client Quick Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
              <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-300 text-lg">
                {client.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-serif font-bold text-slate-100">
                  {client.name}
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
                  ID: {client.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {client.birthPlace}
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartConsultation(client)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultation</span>
          </button>
        </div>
      </div>

      {/* Required Tabs: [ OVERVIEW ] [ KUNDLI ] [ HISTORY ] [ NOTES ] */}
      <div className="flex bg-[#0c1222] p-1 rounded-xl border border-[#1e2b4f] text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab('kundli')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'kundli'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          KUNDLI
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          HISTORY
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'notes'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          NOTES
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Birth Details */}
          <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
            <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Registered Birth Parameters</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
                <span className="text-[10px] text-slate-400 block">Date of Birth</span>
                <span className="font-bold text-slate-100 font-mono mt-0.5 block">
                  {client.dateOfBirth}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60">
                <span className="text-[10px] text-slate-400 block">Time of Birth</span>
                <span className="font-bold text-slate-100 font-mono mt-0.5 block">
                  {client.birthTimeKnown ? client.birthTime : 'Unknown (Solar 12:00)'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#111a30] border border-[#1e2b4f]/60 col-span-2">
                <span className="text-[10px] text-slate-400 block">Location & Coordinates</span>
                <span className="font-bold text-slate-100 mt-0.5 block">
                  {client.birthPlace}
                </span>
                <span className="text-[10px] font-mono text-amber-300/80 mt-0.5 block">
                  {client.latitude.toFixed(4)}°N, {client.longitude.toFixed(4)}°E ({client.timezone})
                </span>
              </div>
            </div>
          </div>

          {/* Consultation Summary */}
          <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2.5 text-xs">
            <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Consultation Summary</span>
            </h3>

            <div className="p-3 rounded-xl bg-[#111a30] border border-amber-500/20 text-slate-300 leading-relaxed text-[11px]">
              {client.summary}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Total Consultations:</span>
              <span className="font-bold text-amber-300 font-mono">{client.totalConsultations} Sessions (Demo)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Last Session Date:</span>
              <span className="font-medium text-slate-200">{client.lastConsultation}</span>
            </div>
          </div>

          {/* Shared Pipeline Info */}
          <div className="p-3 rounded-xl bg-[#111a30] border border-amber-400/20 text-[11px] text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Shared chart pipeline active: Both client and astrologer view identical astronomical coordinates.
            </span>
          </div>
        </div>
      )}

      {/* 2. KUNDLI TAB: Show the SAME shared demo Kundli data already used by the Client App */}
      {activeTab === 'kundli' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Synchronized Kundli View: Displaying D1/Rashi, D9/Navamsa, Nakshatra, Dasha, and Planetary degrees for <strong>{client.name}</strong>.
            </span>
          </div>

          {/* Renders the EXACT same KundliView component used by the client! */}
          <KundliView userDetails={clientUserDetails} embeddedInConsultation={true} />
        </div>
      )}

      {/* 3. HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Consultation History (Demo Entries)</span>
            </h3>
            <span className="text-[10px] text-amber-300 font-mono">
              {clientConsultationHistory.length || 1} Record(s)
            </span>
          </div>

          {clientConsultationHistory.length > 0 ? (
            clientConsultationHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.type}</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-semibold">
                    {item.status} (Demo)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{item.date} • {item.time}</span>
                  <span>Duration: {item.durationMinutes} mins</span>
                </div>

                <p className="text-[11px] text-slate-300 pt-1 border-t border-[#1e2b4f]/60">
                  Topic: <strong>{item.topic}</strong>
                </p>
                {item.notes && (
                  <p className="text-[10px] text-slate-400 italic">
                    Log note: "{item.notes}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center text-xs text-slate-400 space-y-1">
              <p>Sample consultation history entry for {client.name}:</p>
              <p className="text-slate-200 font-semibold">Chat Consultation • {client.lastConsultation}</p>
              <p className="text-[11px] text-amber-300/80">Completed • {client.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* 4. NOTES TAB: Private notes area for the astrologer */}
      {activeTab === 'notes' && (
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
          {/* Mandatory Label: “Demo Private Notes — Prototype Only” */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Private Notes — Prototype Only</span>
            </h3>
            <span className="text-[9px] font-mono text-slate-400">
              Astrologer Confidential
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Record private Jyotish observations, remedial recommendations, and Dasha timing reflections for {client.name}.
          </p>

          <form onSubmit={handleSaveNotes} className="space-y-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              rows={6}
              placeholder="Enter private Jyotish notes for this client..."
              className="w-full p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors leading-relaxed"
            />

            <div className="flex items-center justify-between">
              {saveSuccessNotice ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Notes saved locally (Prototype)!</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">
                  Client cannot view these private notes.
                </span>
              )}

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Demo Note</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Privacy Notice */}
      <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Demo data only. This prototype does not store or transmit real client information.</span>
      </div>
    </div>
  );
};
