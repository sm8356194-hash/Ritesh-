import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Compass, 
  Sun, 
  Bot, 
  PhoneCall, 
  HeartHandshake, 
  Hash, 
  Calendar, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Star, 
  ShieldCheck,
  ChevronRight,
  Flame,
  MessageSquare,
  Wallet,
  Plus
} from 'lucide-react';
import { UserBirthDetails, DashboardSection, BirthProfile, ConsultationRecord } from '../../types';
import { PANCHANG_TODAY, ZODIAC_SIGNS, MOCK_ASTROLOGERS } from '../../data/astrologyMockData';
import { useTranslation } from '../../services/languageService';
import { walletService } from '../../services/walletService';
import { AddMoneyModal } from '../common/AddMoneyModal';
import { WalletHistoryModal } from '../common/WalletHistoryModal';
import { KundliView } from '../dashboard/KundliView';
import { HoroscopeView } from '../dashboard/HoroscopeView';
import { AiAstrologerView } from '../dashboard/AiAstrologerView';
import { TalkAstrologersView } from '../dashboard/TalkAstrologersView';
import { CompatibilityView } from '../dashboard/CompatibilityView';
import { KundliMatchingView } from '../matching/KundliMatchingView';
import { NumerologyView } from '../dashboard/NumerologyView';
import { PanchangView } from '../dashboard/PanchangView';
import { ProfileView } from '../dashboard/ProfileView';

interface HomeDashboardProps {
  userDetails: UserBirthDetails;
  activeSection: DashboardSection;
  onNavigateSection: (section: DashboardSection) => void;
  onEditBirthDetails: () => void;
  onResetDetails: () => void;
  onSelectBirthProfile?: (profile: BirthProfile) => void;
  onSwitchToAstrologerPanel?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userDetails,
  activeSection,
  onNavigateSection,
  onEditBirthDetails,
  onResetDetails,
  onSelectBirthProfile,
  onSwitchToAstrologerPanel,
}) => {
  const { t, language } = useTranslation();
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedConsultationForTalk, setSelectedConsultationForTalk] = useState<ConsultationRecord | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(walletService.getBalance());
  const [showAddMoneyModal, setShowAddMoneyModal] = useState<boolean>(false);
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = walletService.subscribe(bal => {
      setWalletBalance(bal);
    });
    return unsubscribe;
  }, []);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'hi') {
      if (hour < 12) return 'सुप्रभात';
      if (hour < 17) return 'शुभ दोपहर';
      return 'शुभ संध्या';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Feature menu items for the main grid
  const featureCards = [
    {
      id: 'kundli' as DashboardSection,
      title: 'Kundli',
      subtitle: 'Vedic Birth Chart & Lagna',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/20 to-amber-400/5',
      badge: 'D1 & D9',
    },
    {
      id: 'horoscope' as DashboardSection,
      title: 'Horoscope',
      subtitle: 'Daily, Weekly & Monthly',
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/20 to-yellow-400/5',
      badge: 'Daily Focus',
    },
    {
      id: 'ai-astrologer' as DashboardSection,
      title: 'AI Astrologer',
      subtitle: 'Personalized guidance based on your birth chart',
      icon: <Bot className="w-5 h-5 text-sky-400" />,
      color: 'from-sky-500/20 to-indigo-500/5',
      badge: 'DEMO AI',
    },
    {
      id: 'talk' as DashboardSection,
      title: 'Talk With Astrologers',
      subtitle: 'Preview Audio & Chat Consult',
      icon: <PhoneCall className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/5',
      badge: 'Coming Soon',
    },
    {
      id: 'kundli-matching' as DashboardSection,
      title: 'Kundli Matching',
      subtitle: 'Compare two profiles with Vedic Milan',
      icon: <HeartHandshake className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-500/5',
      badge: 'New Feature',
    },
    {
      id: 'numerology' as DashboardSection,
      title: 'Numerology',
      subtitle: 'Life Path, Destiny & Archetypes',
      icon: <Hash className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/20 to-violet-500/5',
      badge: 'Demo Matrix',
    },
    {
      id: 'panchang' as DashboardSection,
      title: 'Panchang',
      subtitle: 'Tithi, Nakshatra & Muhurat',
      icon: <Calendar className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/5',
      badge: 'Today',
    },
    {
      id: 'profile' as DashboardSection,
      title: 'Profile',
      subtitle: 'Birth Details & Settings',
      icon: <User className="w-5 h-5 text-slate-300" />,
      color: 'from-slate-500/20 to-slate-400/5',
      badge: 'View / Edit',
    },
  ];

  return (
    <div className="relative min-h-[90vh] max-w-md mx-auto px-4 pt-3 pb-24">
      {/* SECTION ROUTING */}
      {activeSection === 'kundli' && (
        <KundliView userDetails={userDetails} onNavigateSection={onNavigateSection} />
      )}

      {activeSection === 'horoscope' && (
        <HoroscopeView 
          userDetails={userDetails} 
          initialSignId="taurus"
          onBack={() => onNavigateSection('overview')}
          onNavigateSection={onNavigateSection}
        />
      )}

      {activeSection === 'ai-astrologer' && (
        <AiAstrologerView
          userDetails={userDetails}
          onBack={() => onNavigateSection('overview')}
          onNavigateSection={onNavigateSection}
        />
      )}

      {activeSection === 'talk' && (
        <TalkAstrologersView 
          userDetails={userDetails} 
          onSwitchToAstrologerPanel={onSwitchToAstrologerPanel}
          initialConsultation={selectedConsultationForTalk}
          onClearInitialConsultation={() => setSelectedConsultationForTalk(null)}
        />
      )}

      {(activeSection === 'compatibility' || activeSection === 'kundli-matching') && (
        <KundliMatchingView 
          userDetails={userDetails} 
          onNavigateSection={onNavigateSection}
        />
      )}

      {activeSection === 'numerology' && (
        <NumerologyView 
          userDetails={userDetails} 
          onNavigateSection={onNavigateSection}
        />
      )}

      {activeSection === 'panchang' && (
        <PanchangView 
          userDetails={userDetails} 
          onNavigateSection={onNavigateSection}
        />
      )}

      {activeSection === 'profile' && (
        <ProfileView
          userDetails={userDetails}
          onEditBirthDetails={onEditBirthDetails}
          onResetDetails={onResetDetails}
          onNavigateSection={onNavigateSection}
          onSelectBirthProfile={onSelectBirthProfile}
          onOpenConsultation={(consultation) => {
            setSelectedConsultationForTalk(consultation);
            onNavigateSection('talk');
          }}
        />
      )}

      {/* OVERVIEW / HOME VIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Personalized Greeting Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                    {getGreeting()}
                  </span>
                  {(userDetails.fullName === 'Demo Profile' || userDetails.isDemoData) && (
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      DEMO DATA
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>Namaste, {userDetails.fullName || 'Demo Profile'}</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                  <span className="text-[10px] text-slate-400 font-medium">Sample Archetype:</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-amber-500/20 font-medium">
                    ♌ Leo Lagna (Demo)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-amber-500/20 font-medium">
                    ♉ Taurus Moon
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#16203c] text-slate-300 border border-slate-700 font-medium">
                    Rohini Nakshatra
                  </span>
                </div>
              </div>

              {/* Profile Avatar */}
              <button
                onClick={() => onNavigateSection('profile')}
                className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-md shadow-amber-500/20"
                title="View Profile"
              >
                <div className="w-full h-full bg-[#0c1222] rounded-xl flex items-center justify-center text-sm font-bold font-serif text-amber-300">
                  {(userDetails.fullName || 'D').charAt(0).toUpperCase()}
                </div>
              </button>
            </div>

            {/* Daily Auspicious Highlights Bar */}
            <div className="mt-3.5 pt-3 border-t border-[#1e2b4f]/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Abhijit Muhurat: <strong className="text-amber-300">11:51 AM - 12:40 PM</strong></span>
              </div>
              <button
                onClick={() => onNavigateSection('panchang')}
                className="text-[10px] text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>{t('panchang')}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>

          {/* Client Wallet & Add Money Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#101930] via-[#16203c] to-[#0c1222] border border-amber-500/30 shadow-md relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-sm shadow-amber-500/20 shrink-0">
                <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center text-amber-300">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('walletBalance')}
                </div>
                <div className="text-lg font-bold font-serif text-slate-100 flex items-center gap-1.5">
                  <span className="text-amber-300">₹{walletBalance.toFixed(2)}</span>
                  <span className="text-[10px] font-normal text-slate-400 bg-[#0c1222] px-1.5 py-0.5 rounded border border-slate-700/60">
                    Demo
                  </span>
                </div>
                {/* Wallet History Trigger */}
                <button
                  onClick={() => setShowWalletHistoryModal(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-0.5 mt-1 transition-all"
                  title="View Transaction History"
                >
                  <span>{t('walletHistory')} →</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addMoney')}</span>
            </button>
          </motion.div>

          {/* Hero Consultation Banner: "Talk With Astrologers" */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#16203c] via-[#101930] to-[#16203c] border border-amber-400/40 shadow-lg relative overflow-hidden group cursor-pointer"
            onClick={() => onNavigateSection('talk')}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {t('comingSoon')}
                  </span>
                </div>
                <h3 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1">
                  <span>{t('connectWithAstrologers')}</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {t('consultationPreviewDesc')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1e2b4f]/60 flex items-center justify-between text-[11px]">
              <span className="text-amber-300/90 font-medium">
                Direct Astrologer consultations in development
              </span>
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                {t('previewFlow')} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Quick AI Astrologer Banner */}
          <div
            onClick={() => onNavigateSection('ai-astrologer')}
            className="p-3.5 rounded-xl bg-[#0c1222] border border-sky-500/30 hover:border-sky-400/60 transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{t('askAiAstrologer')}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-400/20 text-sky-300 font-sans">
                    {t('simulatedAiDemo')}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {t('interactivePrototype')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400" />
          </div>

          {/* Spotlight Kundli Matching Feature Banner */}
          <div
            id="overview-kundli-matching-banner"
            onClick={() => onNavigateSection('compatibility')}
            className="p-3.5 rounded-xl bg-gradient-to-r from-[#141b30] to-[#0c1222] border border-rose-500/30 hover:border-amber-400/50 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{t('kundliMatching')}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-sans border border-amber-400/30">
                    {t('newFeature')}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {t('kundliMatchingDesc')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Home Dashboard Feature Section */}
          <div id="home-feature-section">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-xs font-serif font-bold text-slate-200 tracking-wide uppercase">
                {t('celestialServices')}
              </h3>
              <span className="text-[10px] text-amber-400 font-medium">8 Modules</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {featureCards.map((card, idx) => (
                <motion.button
                  key={card.id}
                  id={`feature-card-${card.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * idx }}
                  onClick={() => onNavigateSection(card.id)}
                  className="p-3 rounded-xl bg-[#0c1222] border border-[#1e2b4f] hover:border-amber-500/40 text-left transition-all active:scale-[0.98] group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#16203c] border border-slate-700/50 group-hover:border-amber-400/30 transition-colors">
                      {card.icon}
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-amber-500/20">
                      {card.badge}
                    </span>
                  </div>

                  <h4 className="text-xs font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    {card.subtitle}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Discover / More Features Area */}
          <div id="home-discover-features" className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-serif font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Discover / More Features</span>
              </h3>
              <span className="text-[10px] text-amber-300 font-medium">Explore</span>
            </div>

            {/* Discover Kundli Matching Highlight Card */}
            <div
              id="discover-kundli-matching-card"
              onClick={() => onNavigateSection('kundli-matching')}
              className="p-3.5 rounded-xl bg-gradient-to-br from-[#121c35] via-[#0e162b] to-[#070b14] border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer group shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-400/30 text-rose-300 group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        Kundli Matching
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Ashtakoota Milan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Compare two birth profiles using traditional Ashtakoota 36-Guna Milan matchmaking.
                    </p>
                  </div>
                </div>
                <div className="p-1 rounded-lg bg-[#16203c] text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#1e2b4f]/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-amber-300/90 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Person 1 + Person 2 Vedic Compatibility
                </span>
                <span className="text-amber-400 font-semibold group-hover:underline">
                  Start Matching →
                </span>
              </div>
            </div>
          </div>

          {/* Today's Planetary Transit Teaser */}
          <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-serif font-bold text-slate-200">
                  Sample Planetary Highlights
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  DEMO DATA
                </span>
              </div>
              <button
                onClick={() => onNavigateSection('horoscope')}
                className="text-[10px] text-amber-400 font-semibold hover:underline"
              >
                View Full
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Illustrative template: Moon resides in Rohini Nakshatra in Taurus, forming a sample Dhana Yoga. Not a personalized calculation.
            </p>
          </div>
        </div>
      )}

      {/* Add Money Top-Up Modal */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
      />

      {/* Wallet History Ledger Modal */}
      <WalletHistoryModal
        isOpen={showWalletHistoryModal}
        onClose={() => setShowWalletHistoryModal(false)}
      />
    </div>
  );
};
