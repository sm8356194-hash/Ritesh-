/**
 * Astrologer Profile Tab (Astrologer Workstation)
 * 
 * Allows an authenticated astrologer to register their Firestore astrologer profile,
 * view their approval status, edit their profile details, and toggle online/offline presence.
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save
} from 'lucide-react';
import { AstrologerProfile } from '../../types';
import { astrologerService } from '../../services/astrologerService';
import { authService } from '../../services/auth/authService';

interface AstrologerProfileTabProps {
  onSwitchToClientApp: () => void;
}

export const AstrologerProfileTab: React.FC<AstrologerProfileTabProps> = ({
  onSwitchToClientApp,
}) => {
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for creation or editing
  const [name, setName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [education, setEducation] = useState<string>('');
  const [skillsStr, setSkillsStr] = useState<string>('Vedic Astrology, Kundli Milan');
  const [languagesStr, setLanguagesStr] = useState<string>('English, Hindi');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [perMinuteCharge, setPerMinuteCharge] = useState<number>(30);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    const user = authService.getCurrentUser();
    if (!user) {
      setError('Please sign in to access your astrologer profile.');
      setLoading(false);
      return;
    }

    const res = await astrologerService.getAstrologerByUserId(user.id);
    setLoading(false);
    if (res.success && res.data) {
      setProfile(res.data);
      setName(res.data.name);
      setTitle(res.data.title);
      setBio(res.data.bio);
      setEducation(res.data.education);
      setSkillsStr(res.data.skills.join(', '));
      setLanguagesStr(res.data.languages.join(', '));
      setExperienceYears(res.data.experienceYears);
      setPerMinuteCharge(res.data.perMinuteCharge);
      setIsOnline(res.data.isOnline);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    const user = authService.getCurrentUser();
    if (!user) {
      setError('Authentication required.');
      setSaving(false);
      return;
    }

    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const languages = languagesStr.split(',').map(l => l.trim()).filter(Boolean);

    const res = await astrologerService.registerAstrologerProfile(user, {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
      education: education.trim(),
      skills,
      languages,
      experienceYears: Number(experienceYears),
      perMinuteCharge: Number(perMinuteCharge),
    });

    setSaving(false);
    if (!res.success) {
      setError(res.error);
    } else {
      setProfile(res.data);
      setSuccessMsg('Astrologer profile registered successfully! Pending admin approval.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    const user = authService.getCurrentUser();
    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const languages = languagesStr.split(',').map(l => l.trim()).filter(Boolean);

    const res = await astrologerService.updateAstrologerProfile(user, profile.id, {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
      education: education.trim(),
      skills,
      languages,
      experienceYears: Number(experienceYears),
      perMinuteCharge: Number(perMinuteCharge),
      isOnline,
    });

    setSaving(false);
    if (!res.success) {
      setError(res.error);
    } else {
      setProfile(res.data);
      setSuccessMsg('Astrologer profile updated successfully!');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading astrologer profile from Firestore...</p>
      </div>
    );
  }

  // If no profile exists yet, show Onboarding registration form
  if (!profile) {
    return (
      <div className="space-y-4 pb-24 text-slate-100 max-w-lg mx-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] to-[#0c1222] border border-amber-500/30 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>ASTROLOGER ONBOARDING</span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100">
            Create Your Firestore Astrologer Profile
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Register your professional astrologer profile. Once created, your profile will undergo admin review before appearing in the public directory.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acharya Dev Sharma"
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Professional Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vedic Astrologer & Kundli Specialist"
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹ / min)</label>
              <input
                type="number"
                min={0}
                required
                value={perMinuteCharge}
                onChange={(e) => setPerMinuteCharge(Number(e.target.value))}
                className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Specializations (comma separated)</label>
            <input
              type="text"
              required
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="Vedic Astrology, KP System, Tarot"
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Languages (comma separated)</label>
            <input
              type="text"
              required
              value={languagesStr}
              onChange={(e) => setLanguagesStr(e.target.value)}
              placeholder="English, Hindi, Sanskrit"
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Education / Credentials</label>
            <input
              type="text"
              required
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Jyotish Acharya from Vedic University"
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Consultant Overview / Bio</label>
            <textarea
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a professional overview of your astrological expertise..."
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <span>Registering Profile...</span> : <span>Submit Astrologer Profile for Review</span>}
          </button>
        </form>
      </div>
    );
  }

  // Profile exists: Show profile management and edit form
  return (
    <div className="space-y-4 pb-24 text-slate-100">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0c1222] to-[#070b14] border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0c1222] rounded-[14px] flex items-center justify-center font-serif font-bold text-amber-300 text-xl">
                {profile.name.charAt(0)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-serif font-bold text-slate-100">
                  {profile.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                  profile.isApproved 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  {profile.isApproved ? 'APPROVED & ACTIVE' : 'PENDING ADMIN APPROVAL'}
                </span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">
                {profile.title}
              </p>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="flex items-center gap-2 bg-[#070b14] px-3 py-2 rounded-xl border border-[#1e2b4f]">
            <span className="text-xs text-slate-300">Online Status:</span>
            <button
              type="button"
              onClick={async () => {
                const updated = !isOnline;
                setIsOnline(updated);
                const user = authService.getCurrentUser();
                await astrologerService.updateAstrologerProfile(user, profile.id, { isOnline: updated });
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleUpdate} className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] space-y-3.5 text-xs">
        <h3 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-1.5 pb-2 border-b border-[#1e2b4f]">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Edit Astrologer Profile Details</span>
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Title</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Professional Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Experience (Years)</label>
            <input
              type="number"
              min={0}
              required
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹ / min)</label>
            <input
              type="number"
              min={0}
              required
              value={perMinuteCharge}
              onChange={(e) => setPerMinuteCharge(Number(e.target.value))}
              className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Specializations (comma separated)</label>
          <input
            type="text"
            required
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Languages (comma separated)</label>
          <input
            type="text"
            required
            value={languagesStr}
            onChange={(e) => setLanguagesStr(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Education / Credentials</label>
          <input
            type="text"
            required
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Consultant Overview / Bio</label>
          <textarea
            rows={3}
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2b4f] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 text-slate-950" />
          {saving ? <span>Saving Changes...</span> : <span>Save Astrologer Profile Changes</span>}
        </button>
      </form>
    </div>
  );
};
