/**
 * Talk With Astrologers View
 * 
 * Displays approved Firestore astrologers in a professional directory
 * with search, category filtering, and navigation to astrologer profiles.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  Search, 
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { AstrologerProfile, UserBirthDetails, ConsultationRecord, PersistentBirthProfile } from '../../types';
import { astrologerService } from '../../services/astrologerService';
import { birthProfileService } from '../../services/birthProfileService';
import { authService } from '../../services/auth/authService';
import { CallAstrologerModal } from './CallAstrologerModal';
import { AstrologerProfileScreen } from '../talk/AstrologerProfileScreen';
import { ConsultationScreen } from '../talk/ConsultationScreen';

interface TalkAstrologersViewProps {
  userDetails: UserBirthDetails;
  onSwitchToAstrologerPanel?: () => void;
  initialConsultation?: ConsultationRecord | null;
  onClearInitialConsultation?: () => void;
}

export const TalkAstrologersView: React.FC<TalkAstrologersViewProps> = ({ 
  userDetails,
  onSwitchToAstrologerPanel,
  initialConsultation,
  onClearInitialConsultation,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'profile' | 'consultation'>('list');
  const [astrologers, setAstrologers] = useState<AstrologerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState<AstrologerProfile | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationRecord | null>(null);
  const [consultationUserDetails, setConsultationUserDetails] = useState<UserBirthDetails>(userDetails);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCallAstrologer, setActiveCallAstrologer] = useState<AstrologerProfile | null>(null);

  const filters = ['All', 'Vedic Astrology', 'KP System', 'Tarot Reading', 'Vastu Shastra', 'Love & Marriage'];

  useEffect(() => {
    fetchAstrologers();
  }, []);

  // Effect to handle initialConsultation passed from history
  useEffect(() => {
    if (initialConsultation) {
      const resolveSession = async () => {
        let astro: AstrologerProfile | null = null;
        try {
          const res = await astrologerService.getAstrologerProfileById(initialConsultation.astrologerId);
          if (res.success && res.data) {
            astro = res.data;
          }
        } catch (e) {
          console.error('Failed to fetch astrologer profile for consultation', e);
        }

        // Safe fallback demo astrologer if not found
        if (!astro) {
          astro = {
            id: initialConsultation.astrologerId,
            userId: initialConsultation.astrologerUserId || 'demo_astro_user',
            name: initialConsultation.astrologerName || 'Astrologer',
            title: 'Vedic Astrologer (Session Archive)',
            bio: 'Astrologer profile for archived consultation session.',
            education: 'Traditional Jyotish Shastra',
            skills: ['Vedic Astrology', 'Kundli Analysis'],
            languages: ['English', 'Hindi'],
            experienceYears: 10,
            perMinuteCharge: initialConsultation.fee ? Math.round(initialConsultation.fee / (initialConsultation.durationMinutes || 15)) : 25,
            isOnline: false,
            rating: 5.0,
            totalOrders: 0,
            isApproved: true,
            createdAt: initialConsultation.createdAt,
            updatedAt: initialConsultation.updatedAt,
          };
        }

        // Resolve linked birth profile if available
        if (initialConsultation.birthProfileId) {
          try {
            const currentUser = authService.getCurrentUser();
            const bRes = await birthProfileService.getBirthProfileById(currentUser, initialConsultation.birthProfileId);
            if (bRes.success && bRes.data) {
              const p: PersistentBirthProfile = bRes.data;
              setConsultationUserDetails({
                name: p.name,
                fullName: p.name,
                dateOfBirth: p.dateOfBirth,
                dob: p.dateOfBirth,
                birthTime: p.timeOfBirth || '12:00',
                birthTimeKnown: Boolean(p.timeOfBirth),
                timeOfBirth: p.timeOfBirth,
                birthPlace: p.birthPlace,
                latitude: p.latitude,
                longitude: p.longitude,
                timezone: p.timezone,
                gender: p.gender || 'unspecified',
              });
            } else {
              setConsultationUserDetails(userDetails);
            }
          } catch (err) {
            setConsultationUserDetails(userDetails);
          }
        } else {
          setConsultationUserDetails(userDetails);
        }

        setSelectedAstrologer(astro);
        setActiveConsultation(initialConsultation);
        setViewMode('consultation');
        if (onClearInitialConsultation) {
          onClearInitialConsultation();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      resolveSession();
    }
  }, [initialConsultation, userDetails, onClearInitialConsultation]);

  const fetchAstrologers = async () => {
    setLoading(true);
    setError(null);
    const res = await astrologerService.listApprovedAstrologers();
    setLoading(false);
    if (res.success) {
      setAstrologers(res.data);
    } else {
      setError(res.error || 'Failed to load astrologers.');
    }
  };

  const filteredAstrologers = astrologers.filter((astro) => {
    const matchesFilter =
      selectedFilter === 'All' ||
      astro.skills.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase())) ||
      (selectedFilter === 'Love & Marriage' && astro.skills.some(s => s.includes('Kundli Milan') || s.includes('Compatibility')));

    const matchesSearch =
      astro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      astro.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      astro.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleOpenProfile = (astro: AstrologerProfile) => {
    setSelectedAstrologer(astro);
    setViewMode('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChat = (astro?: AstrologerProfile, consultation?: ConsultationRecord) => {
    if (astro) setSelectedAstrologer(astro);
    if (consultation) setActiveConsultation(consultation);
    setViewMode('consultation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. If in Consultation view
  if (viewMode === 'consultation' && selectedAstrologer) {
    return (
      <>
        <ConsultationScreen
          astrologer={selectedAstrologer}
          userDetails={consultationUserDetails || userDetails}
          consultation={activeConsultation || undefined}
          onBack={() => {
            setActiveConsultation(null);
            setViewMode('list');
          }}
          onEndConsultation={() => {
            setActiveConsultation(null);
            setViewMode('list');
          }}
          onPreviewVoiceCall={() => setActiveCallAstrologer(selectedAstrologer)}
        />
        {activeCallAstrologer && (
          <CallAstrologerModal
            astrologer={activeCallAstrologer as any}
            onEndCall={() => setActiveCallAstrologer(null)}
          />
        )}
      </>
    );
  }

  // 2. If in Astrologer Profile view
  if (viewMode === 'profile' && selectedAstrologer) {
    return (
      <>
        <AstrologerProfileScreen
          astrologer={selectedAstrologer}
          onBack={() => setViewMode('list')}
          onStartChat={(consultation) => handleStartChat(selectedAstrologer, consultation)}
          onPreviewCall={() => setActiveCallAstrologer(selectedAstrologer)}
        />
        {activeCallAstrologer && (
          <CallAstrologerModal
            astrologer={activeCallAstrologer as any}
            onEndCall={() => setActiveCallAstrologer(null)}
          />
        )}
      </>
    );
  }

  // 3. Default: Astrologer List View
  return (
    <div className="space-y-4 pb-24 text-slate-100">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-amber-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-semibold border border-amber-400/30 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Firestore Approved Directory</span>
            </div>
            <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-1.5">
              <span>Talk With Astrologers</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Connect with verified Vedic experts, KP specialists, and Tarot consultants for personalized guidance.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400 shrink-0 ml-3">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3.5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search astrologer, specialization, or language..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === filter
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-[#0c1222] text-slate-300 hover:text-slate-100 hover:bg-[#16203c] border border-[#1e2b4f]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Astrologers List Content */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading approved astrologers from Firestore...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={fetchAstrologers}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredAstrologers.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-[#0c1222] border border-[#1e2b4f] rounded-2xl p-6">
          <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No astrologers available right now.</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            There are currently no approved astrologers matching your search criteria in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredAstrologers.map((astro) => (
            <motion.div
              key={astro.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-[#1e2b4f] hover:border-amber-500/40 transition-all shadow-md group"
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md">
                    <div className="w-full h-full rounded-2xl bg-[#0c1222] flex items-center justify-center text-xl font-serif font-bold text-amber-300">
                      {astro.avatarUrl ? (
                        <img src={astro.avatarUrl} alt={astro.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        astro.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0c1222] ${astro.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {astro.name}
                      </h3>
                      <p className="text-[11px] text-amber-300/80 font-medium line-clamp-1">
                        {astro.title}
                      </p>
                    </div>

                    {astro.rating && (
                      <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 text-amber-300 text-xs font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{astro.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills / Specializations */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {astro.skills.slice(0, 3).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#16203c] text-slate-300 border border-[#1e2b4f]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Experience & Languages */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1e2b4f]/60 text-[11px]">
                    <div className="text-slate-400 flex items-center gap-2">
                      <span>Exp: {astro.experienceYears} Yrs</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{astro.languages.join(', ')}</span>
                    </div>

                    <div className="text-amber-300 font-bold font-mono">
                      ₹{astro.perMinuteCharge}/min
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => handleOpenProfile(astro)}
                      className="py-2 px-3 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 text-xs font-semibold border border-[#1e2b4f] transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Profile</span>
                    </button>

                    <button
                      onClick={() => handleOpenProfile(astro)}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 text-xs font-bold shadow-sm hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                      <span>Consult</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
