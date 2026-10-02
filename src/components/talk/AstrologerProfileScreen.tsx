/**
 * Astrologer Profile Screen
 * 
 * Displays detailed information about a selected approved Firestore astrologer
 * and provides the action to start a consultation request.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MessageSquare, 
  PhoneCall, 
  Languages, 
  GraduationCap, 
  Sparkles, 
  Award,
  ShieldCheck,
  Star,
  Clock,
  RotateCcw
} from 'lucide-react';
import { AstrologerProfile, ConsultationRecord } from '../../types';
import { ConsultationRequestModal } from './ConsultationRequestModal';
import { authService } from '../../services/auth/authService';
import { consultationService } from '../../services/consultationService';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AstrologerProfileScreenProps {
  astrologer: AstrologerProfile;
  onBack: () => void;
  onStartChat: (consultation?: ConsultationRecord) => void;
  onPreviewCall: () => void;
}

export const AstrologerProfileScreen: React.FC<AstrologerProfileScreenProps> = ({
  astrologer,
  onBack,
  onStartChat,
  onPreviewCall,
}) => {
  const { t } = useTranslation();
  const [showConsultationModal, setShowConsultationModal] = useState<boolean>(false);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkActiveSession = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const res = await consultationService.listUserConsultations(currentUser, currentUser.id);
          if (res.success && isMounted && Array.isArray(res.data)) {
            const active = res.data.find(c => 
              c.astrologerId === astrologer.id &&
              (c.status === 'REQUESTED' || c.status === 'CONFIRMED' || c.status === 'ACTIVE' || c.status === 'Requested' || c.status === 'Accepted')
            );
            if (active) {
              setActiveConsultation(active);
            }
          }
        }
      } catch (err) {
        console.error('Error checking active consultation for profile', err);
      }
    };
    checkActiveSession();
    return () => {
      isMounted = false;
    };
  }, [astrologer.id]);

  return (
    <div className="space-y-4 pb-24 text-slate-100">
      {/* Top Bar with Back Button & Global Language Selector */}
      <div className="flex items-center justify-between pb-1 gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-[#111a30] hover:bg-[#16203c] text-slate-300 hover:text-amber-300 border border-[#1e2b4f] transition-all flex items-center gap-1 text-xs shrink-0"
          aria-label="Back to Astrologers List"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('astrologers')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Always-visible Global Language Selector */}
          <GlobalLanguageSelector id="astro-profile-global-lang-selector" />

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Verified</span>
          </div>
        </div>
      </div>

      {/* Main Astrologer Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full rounded-2xl bg-[#0c1222] flex items-center justify-center text-2xl font-serif font-bold text-amber-300">
                {astrologer.avatarUrl ? (
                  <img src={astrologer.avatarUrl} alt={astrologer.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  astrologer.name.charAt(0)
                )}
              </div>
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0c1222] ${astrologer.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} title={astrologer.isOnline ? 'Online' : 'Offline'} />
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-serif font-bold text-slate-100">
                {astrologer.name}
              </h2>
              {astrologer.rating && (
                <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{astrologer.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-amber-300/90 font-medium mt-0.5">
              {astrologer.title}
            </p>

            {/* Rate & Experience strip */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#16203c] border border-amber-400/30 text-amber-300 text-[11px] font-bold font-mono">
                ₹{astrologer.perMinuteCharge}/min
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#16203c] border border-slate-700 text-slate-300 text-[10px]">
                Experience: {astrologer.experienceYears} Years
              </span>
            </div>
          </div>
        </div>

        {/* Active Session Notice Banner if an active session exists */}
        {activeConsultation && (
          <div className="mt-4 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Active consultation session ({activeConsultation.status})</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300 shrink-0 ml-1">
              #{activeConsultation.id.slice(-6)}
            </span>
          </div>
        )}

        {/* Action Buttons: Start / Resume Consultation & Preview Call */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-[#1e2b4f]/70">
          {activeConsultation ? (
            <button
              onClick={() => onStartChat(activeConsultation)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-slate-950" />
              <span>Resume Active Chat</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConsultationModal(true)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-slate-950" />
              <span>Start Consultation</span>
            </button>
          )}

          <button
            onClick={onPreviewCall}
            className="py-3 px-4 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] border border-amber-500/30 text-amber-300 font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>Voice Call (Preview)</span>
          </button>
        </div>
      </motion.div>

      {/* Specialization & Skills */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-2">
        <h3 className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Astrology Specialization</span>
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {astrologer.skills.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#111a30] text-amber-300/90 border border-amber-400/20 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Languages & Background */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3 text-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>Consultation Languages</span>
            </span>
            <p className="font-semibold text-slate-200 mt-1">
              {astrologer.languages.join(' • ')}
            </p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Vedic Education</span>
            </span>
            <p className="font-semibold text-slate-200 mt-1">
              {astrologer.education}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1e2b4f]/60">
          <span className="text-slate-400 block text-[11px] mb-1">
            Consultant Overview
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {astrologer.bio}
          </p>
        </div>
      </div>

      {/* Firestore Consultation Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-xs text-amber-300/90 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Real Firestore Consultation Foundation</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Clicking "Start Consultation" saves a verified consultation request record directly into Cloud Firestore linked to your authenticated user account.
        </p>
      </div>

      {/* Consultation Request Modal */}
      <ConsultationRequestModal
        astrologer={astrologer}
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={(consultation: ConsultationRecord) => {
          setShowConsultationModal(false);
          onStartChat(consultation);
        }}
      />
    </div>
  );
};
