import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Compass, 
  ChevronRight, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { DemoClient } from '../../types';

interface AstrologerClientsTabProps {
  clients: DemoClient[];
  onOpenClientKundli: (client: DemoClient) => void;
  onOpenClientProfile: (client: DemoClient) => void;
  onStartActiveConsultation: (client: DemoClient) => void;
}

export const AstrologerClientsTab: React.FC<AstrologerClientsTabProps> = ({
  clients,
  onOpenClientKundli,
  onOpenClientProfile,
  onStartActiveConsultation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.birthPlace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3.5 pb-24 text-slate-100">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Demo Clients Directory</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All client profiles are synthetic test records for prototype evaluation.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
            {clients.length} Demo Records
          </span>
        </div>

        {/* Search input */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search demo client name or birth place..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-2.5">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-500/40 transition-all shadow-md"
          >
            {/* Clickable Header for Profile */}
            <div 
              onClick={() => onOpenClientProfile(client)}
              className="cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
                    <div className="w-full h-full bg-[#111a30] rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-300 text-xs">
                      {client.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {client.name}
                      </h3>
                      {client.isCurrentAppUser && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          Active Client
                        </span>
                      )}
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#16203c] text-slate-400 font-mono">
                        Demo
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-300/80 font-medium">
                      Last Session: {client.lastConsultation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClientProfile(client);
                  }}
                  className="p-1 text-slate-400 group-hover:text-amber-300 transition-colors"
                  aria-label="View Client Profile"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Exact required fields: Birth date, Birth time, Birth place */}
              <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-[#1e2b4f]/60 text-[10px]">
                <div className="p-1.5 rounded-lg bg-[#070b14] border border-[#1e2b4f]/40">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Birth Date</span>
                  </span>
                  <span className="font-semibold text-slate-200 block mt-0.5 font-mono truncate">
                    {client.dateOfBirth}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-[#070b14] border border-[#1e2b4f]/40">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Birth Time</span>
                  </span>
                  <span className="font-semibold text-slate-200 block mt-0.5 font-mono truncate">
                    {client.birthTimeKnown ? client.birthTime : 'Unknown'}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-[#070b14] border border-[#1e2b4f]/40">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>Birth Place</span>
                  </span>
                  <span className="font-semibold text-slate-200 block mt-0.5 truncate" title={client.birthPlace}>
                    {client.city || client.birthPlace.split(',')[0]}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 mt-2 leading-snug line-clamp-2">
                {client.summary}
              </p>
            </div>

            {/* Action Bar: "Open Kundli" & Profile & Session */}
            <div className="mt-3 pt-2.5 border-t border-[#1e2b4f]/60 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                Total Sessions: <strong className="text-slate-200">{client.totalConsultations}</strong> (Demo)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenClientKundli(client)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Kundli</span>
                </button>

                <button
                  onClick={() => onOpenClientProfile(client)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] border border-[#1e2b4f] text-slate-200 text-xs font-medium transition-all"
                >
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => onStartActiveConsultation(client)}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Session</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Demo data only. This prototype does not store or transmit real client information.</span>
      </div>
    </div>
  );
};
