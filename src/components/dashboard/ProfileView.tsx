import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit3, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  Bell, 
  Globe, 
  ChevronRight, 
  Bookmark, 
  MessageSquare, 
  PhoneCall, 
  Lock, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Sun, 
  Hash, 
  X, 
  Check, 
  AlertCircle,
  Trash2,
  Users,
  Loader2
} from 'lucide-react';
import { UserBirthDetails, DashboardSection, ConsultationRecord, PersistentBirthProfile, BirthProfile } from '../../types';
import { consultationService } from '../../services/consultationService';
import { authService } from '../../services/auth/authService';
import { birthProfileService } from '../../services/birthProfileService';
import { languageService, useTranslation, SupportedLanguage } from '../../services/languageService';

interface ProfileViewProps {
  userDetails: UserBirthDetails;
  onEditBirthDetails: () => void;
  onResetDetails: () => void;
  onNavigateSection?: (section: DashboardSection) => void;
  onSelectBirthProfile?: (profile: BirthProfile) => void;
  onOpenConsultation?: (consultation: ConsultationRecord) => void;
}

type ActiveModal = 
  | 'none' 
  | 'saved-insights' 
  | 'saved-profiles'
  | 'consultation-history' 
  | 'recent-chats' 
  | 'notifications' 
  | 'language' 
  | 'privacy' 
  | 'terms' 
  | 'help' 
  | 'logout-confirm';

export const ProfileView: React.FC<ProfileViewProps> = ({
  userDetails,
  onEditBirthDetails,
  onResetDetails,
  onNavigateSection,
  onSelectBirthProfile,
  onOpenConsultation,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language === 'hi' ? 'हिन्दी (Hindi)' : 'English');

  useEffect(() => {
    setSelectedLanguage(language === 'hi' ? 'हिन्दी (Hindi)' : 'English');
  }, [language]);

  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [userConsultations, setUserConsultations] = useState<ConsultationRecord[]>([]);
  const [consultationLoading, setConsultationLoading] = useState<boolean>(false);

  // Saved Profiles States
  const [savedProfiles, setSavedProfiles] = useState<PersistentBirthProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState<boolean>(false);
  const [profileToDelete, setProfileToDelete] = useState<PersistentBirthProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (activeModal === 'consultation-history') {
      loadUserConsultations();
    } else if (activeModal === 'saved-profiles') {
      loadSavedProfiles();
    }
  }, [activeModal]);

  const loadSavedProfiles = async () => {
    setProfilesLoading(true);
    setDeleteError(null);
    setDeleteSuccessMsg(null);
    setProfileToDelete(null);
    const user = authService.getCurrentUser();
    if (user) {
      const res = await birthProfileService.listBirthProfilesForUser(user, user.id);
      if (res.success) {
        setSavedProfiles(res.data);
      }
    }
    setProfilesLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccessMsg(null);

    const user = authService.getCurrentUser();
    if (!user) {
      setDeleteError('Authentication required to delete birth profile.');
      setIsDeleting(false);
      return;
    }

    const res = await birthProfileService.deleteBirthProfile(user, profileToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || `Failed to delete birth profile '${profileToDelete.id}'.`);
      setIsDeleting(false);
      return;
    }

    // Success: remove deleted profile from state list
    const remaining = savedProfiles.filter((p) => p.id !== profileToDelete.id);
    setSavedProfiles(remaining);
    setDeleteSuccessMsg(`Birth profile '${profileToDelete.name}' deleted successfully.`);

    // If the deleted profile was currently active, switch to next profile or reset
    const wasActive = userDetails.fullName === profileToDelete.name && userDetails.birthPlace === profileToDelete.birthPlace;
    if (wasActive) {
      if (remaining.length > 0) {
        const nextProfile = remaining[0];
        onSelectBirthProfile?.({
          name: nextProfile.name,
          dateOfBirth: nextProfile.dateOfBirth,
          birthTime: nextProfile.timeOfBirth,
          birthTimeKnown: true,
          gender: nextProfile.gender || 'unspecified',
          birthPlace: nextProfile.birthPlace,
          latitude: nextProfile.latitude,
          longitude: nextProfile.longitude,
          timezone: nextProfile.timezone,
          isDemoData: false,
        });
      } else {
        onResetDetails();
      }
    }

    setProfileToDelete(null);
    setIsDeleting(false);
  };

  const handleSelectProfile = (profile: PersistentBirthProfile) => {
    onSelectBirthProfile?.({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      birthTime: profile.timeOfBirth,
      birthTimeKnown: true,
      gender: profile.gender || 'unspecified',
      birthPlace: profile.birthPlace,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezone: profile.timezone,
      isDemoData: false,
    });
    setDeleteSuccessMsg(`Switched active chart to '${profile.name}'.`);
  };

  const loadUserConsultations = async () => {
    setConsultationLoading(true);
    const user = authService.getCurrentUser();
    if (user) {
      const res = await consultationService.listUserConsultations(user, user.id);
      if (res.success) {
        setUserConsultations(res.data);
      }
    }
    setConsultationLoading(false);
  };

  const handleCancelUserConsultation = async (consultationId: string) => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const res = await consultationService.cancelConsultation(user, consultationId, 'Cancelled by user');
    if (res.success) {
      loadUserConsultations();
    }
  };
  
  // Settings States
  const [notificationSettings, setNotificationSettings] = useState({
    dailyPanchang: true,
    horoscopeAlerts: true,
    transitUpdates: false,
    consultationReminders: true,
  });

  // Saved Insights Demo Data
  const [savedInsights, setSavedInsights] = useState([
    {
      id: 'insight-1',
      title: 'Jupiter Mahadasha Expansion Period',
      category: 'Dasha Insight',
      date: 'Sep 20, 2026',
      content: 'Traditional Jyotish period highlighting wisdom, learning, and steady professional growth through ethical persistence.',
    },
    {
      id: 'insight-2',
      title: 'Simha (Leo) Lagna 10th House Venus Placement',
      category: 'Kundli Placement',
      date: 'Sep 18, 2026',
      content: 'Indicates creative leadership and strategic diplomatic communication in public-facing endeavors.',
    },
    {
      id: 'insight-3',
      title: 'Rohini Nakshatra Auspicious Direction',
      category: 'Muhurat & Remedy',
      date: 'Sep 15, 2026',
      content: 'East and North-East orientations are traditionally associated with harmonious creative work and tranquility.',
    },
  ]);

  const handleDeleteInsight = (id: string) => {
    setSavedInsights((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLogoutConfirm = async () => {
    setActiveModal('none');
    await authService.logout();
    onResetDetails();
  };

  const displayName = userDetails.fullName || 'Demo Profile';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 pb-24 text-slate-100 overflow-x-hidden">
      {/* 1. PROFILE HEADER CARD */}
      <div 
        id="profile-header-card"
        className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular Profile Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/25">
                <div className="w-full h-full rounded-full bg-[#0c1222] flex items-center justify-center text-xl font-bold font-serif text-amber-300">
                  {displayInitial}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c1222]" title="Active Session" />
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-serif font-bold text-slate-100 truncate">
                  {displayName}
                </h2>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  DEMO
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-medium truncate mt-0.5">
                ♌ Leo Lagna (Simha) • ♉ Taurus Moon
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{userDetails.birthPlace || 'New Delhi, India'}</span>
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            id="profile-edit-header-btn"
            onClick={onEditBirthDetails}
            className="p-2.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1 text-xs font-medium"
            title="Edit Birth Details"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden xs:inline text-[11px]">Edit</span>
          </button>
        </div>

        {/* Quick Birth Profile Summary Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#1e2b4f]/60 text-center">
          <div className="p-2 rounded-xl bg-[#070b14]/70 border border-[#1e2b4f]">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">DOB</span>
            <span className="text-xs font-semibold text-slate-200 font-mono">
              {userDetails.dob || '1998-08-15'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#070b14]/70 border border-[#1e2b4f]">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Time</span>
            <span className="text-xs font-semibold text-slate-200 font-mono">
              {userDetails.isTimeUnknown ? '12:00 PM' : userDetails.birthTime || '08:30 AM'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#070b14]/70 border border-[#1e2b4f]">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Nakshatra</span>
            <span className="text-xs font-bold text-amber-300 font-serif">
              Rohini
            </span>
          </div>
        </div>
      </div>

      {/* 2. MY ASTROLOGY SECTION */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-md">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>My Astrology</span>
          </h3>
          <span className="text-[10px] text-amber-300/80 font-medium">Vedic Records</span>
        </div>

        <div className="space-y-1.5">
          {/* My Birth Details */}
          <button
            id="profile-my-birth-details-btn"
            onClick={onEditBirthDetails}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  My Birth Details
                </p>
                <p className="text-[10px] text-slate-400">
                  {userDetails.dob || '1998-08-15'} • {userDetails.birthPlace || 'New Delhi'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Saved Birth Profiles */}
          <button
            id="profile-saved-profiles-btn"
            onClick={() => setActiveModal('saved-profiles')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Saved Birth Profiles
                </p>
                <p className="text-[10px] text-slate-400">
                  Manage family profiles & Vedic Kundli records
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* My Kundli */}
          <button
            id="profile-my-kundli-btn"
            onClick={() => onNavigateSection?.('kundli')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  My Kundli
                </p>
                <p className="text-[10px] text-slate-400">
                  Vedic Birth Chart (D1 Lagna & D9 Navamsha)
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Horoscope */}
          <button
            id="profile-horoscope-btn"
            onClick={() => onNavigateSection?.('horoscope')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Horoscope
                </p>
                <p className="text-[10px] text-slate-400">
                  Daily, Weekly & Monthly Celestial Forecasts
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Numerology */}
          <button
            id="profile-numerology-btn"
            onClick={() => onNavigateSection?.('numerology')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Numerology
                </p>
                <p className="text-[10px] text-slate-400">
                  Life Path Number, Destiny & Grid Matrix
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Saved Insights */}
          <button
            id="profile-saved-insights-btn"
            onClick={() => setActiveModal('saved-insights')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                    Saved Insights
                  </p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {savedInsights.length} Saved
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Bookmarked readings, remedies & chart notes
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 3. MY CONSULTATIONS SECTION */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-md">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>My Consultations</span>
          </h3>
          <span className="text-[10px] text-amber-300/80 font-medium">Demo Records</span>
        </div>

        <div className="space-y-1.5">
          {/* Consultation History */}
          <button
            id="profile-consultation-history-btn"
            onClick={() => setActiveModal('consultation-history')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Consultation History
                </p>
                <p className="text-[10px] text-slate-400">
                  Past audio calls and session timestamps (Demo)
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Recent Astrologer Chats */}
          <button
            id="profile-recent-chats-btn"
            onClick={() => setActiveModal('recent-chats')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Recent Astrologer Chats
                </p>
                <p className="text-[10px] text-slate-400">
                  Saved conversation transcripts & ongoing dialogs
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 4. APP SETTINGS SECTION */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-md">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>App Settings</span>
          </h3>
          <span className="text-[10px] text-slate-400">Preferences</span>
        </div>

        <div className="space-y-1.5">
          {/* Notifications */}
          <button
            id="profile-notifications-btn"
            onClick={() => setActiveModal('notifications')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Notifications
                </p>
                <p className="text-[10px] text-slate-400">
                  Daily Panchang, Muhurat & horoscope alerts
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Language */}
          <button
            id="profile-language-btn"
            onClick={() => setActiveModal('language')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Language
                </p>
                <p className="text-[10px] text-slate-400">
                  Current: <strong className="text-amber-300">{selectedLanguage}</strong>
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Privacy */}
          <button
            id="profile-privacy-btn"
            onClick={() => setActiveModal('privacy')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Privacy Policy
                </p>
                <p className="text-[10px] text-slate-400">
                  Client-side storage & chart confidentiality
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Terms & Conditions */}
          <button
            id="profile-terms-btn"
            onClick={() => setActiveModal('terms')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Terms & Conditions
                </p>
                <p className="text-[10px] text-slate-400">
                  Vedic consultation prototype guidance & terms
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Help & Support */}
          <button
            id="profile-help-btn"
            onClick={() => setActiveModal('help')}
            className="w-full p-2.5 rounded-xl bg-[#111a30] hover:bg-[#16203c] border border-[#1e2b4f]/70 hover:border-amber-400/40 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  Help & Support
                </p>
                <p className="text-[10px] text-slate-400">
                  FAQs, Jyotish terminology guide & support
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 5. ACCOUNT SECTION */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-md">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-rose-400" />
            <span>Account</span>
          </h3>
          <span className="text-[10px] text-slate-400">Session</span>
        </div>

        <button
          id="profile-logout-btn"
          onClick={() => setActiveModal('logout-confirm')}
          className="w-full p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Log Out (Demo Session)</span>
        </button>
      </div>

      {/* Footer Branding Notice */}
      <div className="text-center text-[10px] text-slate-500 pt-1 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-400/60" />
        <span>Talk With Astrologers • Modern Vedic Prototype</span>
      </div>

      {/* ============================================================ */}
      {/* INTERACTIVE DEMO MODALS / SUBVIEWS                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#0c1222] border border-[#1e2b4f] rounded-2xl p-4 shadow-2xl max-h-[85vh] flex flex-col text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2b4f] mb-3">
                <div className="flex items-center gap-2">
                  {activeModal === 'saved-insights' && <Bookmark className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'saved-profiles' && <Users className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'consultation-history' && <Clock className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'recent-chats' && <MessageSquare className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'notifications' && <Bell className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'language' && <Globe className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'privacy' && <Lock className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'terms' && <FileText className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'help' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                  {activeModal === 'logout-confirm' && <AlertCircle className="w-4 h-4 text-rose-400" />}

                  <h3 className="text-sm font-serif font-bold text-slate-100">
                    {activeModal === 'saved-insights' && 'Saved Astrological Insights'}
                    {activeModal === 'saved-profiles' && 'Saved Birth Profiles'}
                    {activeModal === 'consultation-history' && 'Consultation History'}
                    {activeModal === 'recent-chats' && 'Recent Astrologer Chats'}
                    {activeModal === 'notifications' && 'Notification Preferences'}
                    {activeModal === 'language' && 'Select App Language'}
                    {activeModal === 'privacy' && 'Privacy Policy'}
                    {activeModal === 'terms' && 'Terms & Conditions'}
                    {activeModal === 'help' && 'Help & Support'}
                    {activeModal === 'logout-confirm' && 'Confirm Log Out'}
                  </h3>
                </div>

                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16203c]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {/* 1. SAVED INSIGHTS */}
                {activeModal === 'saved-insights' && (
                  <div className="space-y-2.5">
                    {savedInsights.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Bookmark className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        <p className="text-xs">No saved insights yet.</p>
                      </div>
                    ) : (
                      savedInsights.map((insight) => (
                        <div
                          key={insight.id}
                          className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block mb-1">
                                {insight.category}
                              </span>
                              <h4 className="text-xs font-bold text-slate-200">
                                {insight.title}
                              </h4>
                              <span className="text-[9px] text-slate-400">{insight.date}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteInsight(insight.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                              title="Delete Insight"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                            {insight.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SAVED BIRTH PROFILES */}
                {activeModal === 'saved-profiles' && (
                  <div className="space-y-3">
                    {/* Confirmation Dialog Sub-view if profileToDelete is set */}
                    {profileToDelete ? (
                      <div 
                        id="delete-profile-confirm-dialog"
                        className="p-3.5 rounded-xl bg-[#16203c] border border-rose-500/40 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-rose-400">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <h4 className="text-xs font-bold font-serif uppercase tracking-wide">
                            Confirm Profile Deletion
                          </h4>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed">
                          Are you sure you want to delete the birth profile for{' '}
                          <strong className="text-amber-300 font-semibold">{profileToDelete.name}</strong>?
                          All associated Vedic Kundli charts and astrological records will be permanently removed.
                        </p>

                        {userDetails.fullName === profileToDelete.name && userDetails.birthPlace === profileToDelete.birthPlace && (
                          <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>This is your currently active profile. Deleting it will switch your active chart to another remaining profile or reset to default.</span>
                          </div>
                        )}

                        {deleteError && (
                          <div 
                            id="delete-profile-error-msg"
                            className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-[11px] text-rose-300 flex items-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            <span>{deleteError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1e2b4f]">
                          <button
                            id="cancel-delete-profile-btn"
                            type="button"
                            disabled={isDeleting}
                            onClick={() => {
                              setProfileToDelete(null);
                              setDeleteError(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0c1222] border border-[#1e2b4f] text-slate-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            id="confirm-delete-profile-btn"
                            type="button"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Profile</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {deleteSuccessMsg && (
                          <div 
                            id="delete-profile-success-msg"
                            className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>{deleteSuccessMsg}</span>
                          </div>
                        )}

                        {deleteError && (
                          <div 
                            id="delete-profile-error-msg"
                            className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            <span>{deleteError}</span>
                          </div>
                        )}

                        {profilesLoading ? (
                          <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            <span>Loading saved profiles...</span>
                          </div>
                        ) : savedProfiles.length === 0 ? (
                          <div id="no-saved-profiles-state" className="text-center py-8 text-slate-400 space-y-2">
                            <Users className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-xs font-semibold">No saved birth profiles.</p>
                            <p className="text-[11px] text-slate-500">
                              Profiles you save for yourself or family will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {savedProfiles.map((p) => {
                              const isActive = userDetails.fullName === p.name && userDetails.birthPlace === p.birthPlace;
                              return (
                                <div
                                  key={p.id}
                                  id={`saved-profile-card-${p.id}`}
                                  className={`p-3 rounded-xl border transition-all ${
                                    isActive 
                                      ? 'bg-[#16203c] border-amber-400/40 shadow-sm' 
                                      : 'bg-[#111a30] border-[#1e2b4f] hover:border-[#2a3b6a]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="text-xs font-bold text-slate-100 truncate">
                                          {p.name}
                                        </h4>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                                          {p.relationship || 'SELF'}
                                        </span>
                                        {isActive && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span>{p.dateOfBirth} • {p.timeOfBirth}</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span className="truncate">{p.birthPlace}</span>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {!isActive && (
                                        <button
                                          type="button"
                                          onClick={() => handleSelectProfile(p)}
                                          className="text-[10px] px-2 py-1 rounded bg-[#16203c] border border-amber-500/30 text-amber-300 hover:bg-amber-400/10 font-medium transition-colors"
                                        >
                                          Select
                                        </button>
                                      )}
                                      <button
                                        id={`delete-profile-btn-${p.id}`}
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => {
                                          setProfileToDelete(p);
                                          setDeleteError(null);
                                          setDeleteSuccessMsg(null);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                                        title={`Delete ${p.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 2. CONSULTATION HISTORY */}
                {activeModal === 'consultation-history' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Consultation lifecycle: REQUESTED → CONFIRMED → ACTIVE → COMPLETED.</span>
                    </div>

                    {consultationLoading ? (
                      <div className="text-center py-6 text-slate-400 text-xs">Loading your consultations...</div>
                    ) : userConsultations.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs font-semibold">No consultations yet.</p>
                        <p className="text-[11px] text-slate-500">Book a session with an approved astrologer from the Talk tab.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {userConsultations.map((item) => (
                          <div key={item.id} className="p-3.5 rounded-xl bg-[#111a30] border border-[#1e2b4f] space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-200">{item.astrologerName}</h4>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  item.paymentStatus === 'PAID'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : item.paymentStatus === 'REFUNDED' || item.paymentStatus === 'PARTIALLY_REFUNDED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {item.paymentStatus || 'UNPAID'}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  item.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                                  item.status === 'ACTIVE' ? 'bg-amber-400/20 text-amber-300 animate-pulse' :
                                  item.status === 'CONFIRMED' || item.status === 'Accepted' ? 'bg-sky-500/20 text-sky-300' :
                                  item.status === 'REQUESTED' || item.status === 'Requested' ? 'bg-amber-500/20 text-amber-200' :
                                  'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400">{item.type} • {item.scheduledDate} ({item.durationMinutes} mins)</p>
                            
                            {/* Payment Receipt Summary Card */}
                            <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#1e2b4f] flex items-center justify-between text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Consultation Fee</span>
                                <span className="text-amber-300 font-bold">₹{item.fee || 225} {item.currency || 'INR'}</span>
                              </div>
                              {item.paymentId && (
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-500 block font-sans">Transaction Ref</span>
                                  <span className="text-[10px] text-slate-300">{item.paymentId.substring(0, 16)}...</span>
                                </div>
                              )}
                            </div>

                            {item.topic && (
                              <p className="text-[11px] text-amber-300/90 font-medium">Topic: {item.topic}</p>
                            )}

                            {/* Action Row: Open / View Chat Session & Cancel Request */}
                            <div className="pt-2 flex items-center justify-between border-t border-[#1e2b4f]/60 gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setActiveModal('none');
                                  if (onOpenConsultation) {
                                    onOpenConsultation(item);
                                  } else {
                                    onNavigateSection?.('talk');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                <span>
                                  {item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'REJECTED'
                                    ? 'View Session Archive'
                                    : 'Open Chat'}
                                </span>
                              </button>

                              {(item.status === 'REQUESTED' || item.status === 'Requested' || item.status === 'CONFIRMED' || item.status === 'Accepted') && (
                                <button
                                  onClick={() => handleCancelUserConsultation(item.id)}
                                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-semibold transition-all"
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. RECENT CHATS */}
                {activeModal === 'recent-chats' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-serif font-bold text-sm">
                          P
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Pandit Rajesh Sharma</h4>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            "In traditional Vedic astrology interpretation..."
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveModal('none');
                          onNavigateSection?.('talk');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px]"
                      >
                        Open
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-serif font-bold text-sm">
                          A
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Acharya Priya Anand</h4>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            "Your Ashtakoota Milan score indicates..."
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveModal('none');
                          onNavigateSection?.('talk');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px]"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. NOTIFICATIONS */}
                {activeModal === 'notifications' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#111a30] flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Daily Panchang & Muhurat</p>
                        <p className="text-[10px] text-slate-400">Receive morning sunrise and auspicious timings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.dailyPanchang}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailyPanchang: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 bg-[#16203c]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#111a30] flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Horoscope Insights</p>
                        <p className="text-[10px] text-slate-400">Daily zodiac guidance based on your Moon sign</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.horoscopeAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, horoscopeAlerts: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 bg-[#16203c]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#111a30] flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Planetary Transits (Gochar)</p>
                        <p className="text-[10px] text-slate-400">Notifications when major planets change signs</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.transitUpdates}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, transitUpdates: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 bg-[#16203c]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#111a30] flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Consultation Alerts</p>
                        <p className="text-[10px] text-slate-400">Reminders for scheduled astrologer consultations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.consultationReminders}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, consultationReminders: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 bg-[#16203c]"
                      />
                    </div>
                  </div>
                )}

                {/* 5. LANGUAGE */}
                {activeModal === 'language' && (
                  <div className="space-y-1.5">
                    {['English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 'ગુજરાતી (Gujarati)', 'বাংলা (Bengali)', 'தமிழ் (Tamil)'].map((lang) => {
                      const baseLang = lang.split(' ')[0];
                      const isSelected = selectedLanguage === baseLang || selectedLanguage === lang;
                      return (
                        <button
                          key={lang}
                          onClick={() => {
                            const nextLang: SupportedLanguage = lang.includes('Hindi') || lang.includes('हिन्दी') ? 'hi' : 'en';
                            languageService.setLanguage(nextLang);
                            setSelectedLanguage(lang);
                          }}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                              : 'bg-[#111a30] border-[#1e2b4f] text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{lang}</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 6. PRIVACY POLICY */}
                {activeModal === 'privacy' && (
                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">Local Session Storage</h4>
                      <p className="text-[11px]">
                        All birth coordinates, dates of birth, and custom profiles are held temporarily inside your local browser memory for this demonstration interface.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">No Tracking or Third-Party Sharing</h4>
                      <p className="text-[11px]">
                        We do not transmit your astrological queries, chart calculations, or mock consultation logs to external advertising or analytics networks.
                      </p>
                    </div>
                  </div>
                )}

                {/* 7. TERMS & CONDITIONS */}
                {activeModal === 'terms' && (
                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">Demonstration & Prototype Purpose</h4>
                      <p className="text-[11px]">
                        This application is a user interface prototype demonstrating Vedic astrology algorithms and astrologer workflows. It does not provide medical, legal, or financial guarantees.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">Traditional Jyotish Interpretations</h4>
                      <p className="text-[11px]">
                        All charts, dashas, and guna scores are based on classical Parashari and Ashtakoota principles for educational and introspective exploration.
                      </p>
                    </div>
                  </div>
                )}

                {/* 8. HELP & SUPPORT */}
                {activeModal === 'help' && (
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">What is Lagna (Ascendant)?</h4>
                      <p className="text-[11px] text-slate-300">
                        The rising sign on the eastern horizon at the precise time of your birth, representing your primary disposition and path.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">How does Kundli Matching work?</h4>
                      <p className="text-[11px] text-slate-300">
                        Ashtakoota Milan compares 8 distinct psychological and energetic attributes for a maximum total of 36 Gunas.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111a30] border border-[#1e2b4f]">
                      <h4 className="font-bold text-amber-300 mb-1">Demo Support Contact</h4>
                      <p className="text-[11px] text-slate-300">
                        For questions regarding this prototype, use the interactive feedback channels or re-test with sample profiles.
                      </p>
                    </div>
                  </div>
                )}

                {/* 9. LOGOUT CONFIRMATION */}
                {activeModal === 'logout-confirm' && (
                  <div className="space-y-3 text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Log out of Demo Profile?</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Logging out will reset the active session and return to the initial birth details setup screen.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setActiveModal('none')}
                        className="flex-1 py-2.5 rounded-xl bg-[#16203c] text-slate-300 text-xs font-semibold hover:bg-[#1e2b4f]"
                      >
                        Cancel
                      </button>
                      <button
                        id="confirm-logout-btn"
                        onClick={handleLogoutConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Close button */}
              {activeModal !== 'logout-confirm' && (
                <div className="pt-3 border-t border-[#1e2b4f] mt-3">
                  <button
                    onClick={() => setActiveModal('none')}
                    className="w-full py-2 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] text-amber-300 text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
