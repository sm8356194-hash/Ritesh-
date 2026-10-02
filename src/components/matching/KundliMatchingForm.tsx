import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  HeartHandshake, 
  CheckCircle2, 
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { BirthProfile } from '../../types';
import { LocationPicker } from '../birth/LocationPicker';
import { DemoLocation, DEFAULT_DEMO_LOCATION, SAMPLE_LOCATIONS } from '../../data/demoLocations';
import { SAMPLE_PERSON1_PROFILE, SAMPLE_PERSON2_PROFILE } from '../../services/kundliMatchingService';

interface KundliMatchingFormProps {
  initialPerson1: BirthProfile;
  initialPerson2: BirthProfile;
  onSubmitMatch: (person1: BirthProfile, person2: BirthProfile) => void;
  onBackToIntro: () => void;
}

export const KundliMatchingForm: React.FC<KundliMatchingFormProps> = ({
  initialPerson1,
  initialPerson2,
  onSubmitMatch,
  onBackToIntro,
}) => {
  const [activeTab, setActiveTab] = useState<'person1' | 'person2'>('person1');

  // ==========================================
  // PERSON 1 STATE (Uses BirthProfile schema)
  // ==========================================
  const [p1Name, setP1Name] = useState(initialPerson1.name || '');
  const [p1Dob, setP1Dob] = useState(initialPerson1.dateOfBirth || '1998-08-15');
  const [p1Time, setP1Time] = useState(initialPerson1.birthTime || '08:30');
  const [p1TimeKnown, setP1TimeKnown] = useState(initialPerson1.birthTimeKnown ?? true);
  const [p1Gender, setP1Gender] = useState(initialPerson1.gender || 'female');
  
  const [p1Location, setP1Location] = useState<DemoLocation | null>(() => {
    if (initialPerson1.birthPlace) {
      return {
        id: 'p1-loc',
        city: initialPerson1.city || 'New Delhi',
        state: initialPerson1.state || 'Delhi',
        country: initialPerson1.country || 'India',
        displayName: initialPerson1.birthPlace,
        latitude: initialPerson1.latitude ?? 28.6139,
        longitude: initialPerson1.longitude ?? 77.2090,
        timezone: initialPerson1.timezone || 'Asia/Kolkata',
      };
    }
    return DEFAULT_DEMO_LOCATION;
  });

  // ==========================================
  // PERSON 2 STATE (Separate BirthProfile)
  // ==========================================
  const [p2Name, setP2Name] = useState(initialPerson2.name || '');
  const [p2Dob, setP2Dob] = useState(initialPerson2.dateOfBirth || '1996-11-20');
  const [p2Time, setP2Time] = useState(initialPerson2.birthTime || '14:15');
  const [p2TimeKnown, setP2TimeKnown] = useState(initialPerson2.birthTimeKnown ?? true);
  const [p2Gender, setP2Gender] = useState(initialPerson2.gender || 'male');

  const [p2Location, setP2Location] = useState<DemoLocation | null>(() => {
    if (initialPerson2.birthPlace) {
      return {
        id: 'p2-loc',
        city: initialPerson2.city || 'Jaipur',
        state: initialPerson2.state || 'Rajasthan',
        country: initialPerson2.country || 'India',
        displayName: initialPerson2.birthPlace,
        latitude: initialPerson2.latitude ?? 26.9124,
        longitude: initialPerson2.longitude ?? 75.7873,
        timezone: initialPerson2.timezone || 'Asia/Kolkata',
      };
    }
    const jaipur = SAMPLE_LOCATIONS.find(l => l.city === 'Jaipur');
    return jaipur || DEFAULT_DEMO_LOCATION;
  });

  // Validation Errors
  const [errors, setErrors] = useState<{
    p1Name?: string;
    p1Dob?: string;
    p1Place?: string;
    p2Name?: string;
    p2Dob?: string;
    p2Place?: string;
  }>({});

  // Helper buttons to prefill
  const handleLoadSampleP1 = () => {
    setP1Name(SAMPLE_PERSON1_PROFILE.name);
    setP1Dob(SAMPLE_PERSON1_PROFILE.dateOfBirth);
    setP1Time(SAMPLE_PERSON1_PROFILE.birthTime);
    setP1TimeKnown(SAMPLE_PERSON1_PROFILE.birthTimeKnown);
    setP1Gender(SAMPLE_PERSON1_PROFILE.gender || 'female');
    setP1Location({
      id: 'p1-sample',
      city: SAMPLE_PERSON1_PROFILE.city || 'New Delhi',
      state: SAMPLE_PERSON1_PROFILE.state || 'Delhi',
      country: SAMPLE_PERSON1_PROFILE.country || 'India',
      displayName: SAMPLE_PERSON1_PROFILE.birthPlace,
      latitude: SAMPLE_PERSON1_PROFILE.latitude,
      longitude: SAMPLE_PERSON1_PROFILE.longitude,
      timezone: SAMPLE_PERSON1_PROFILE.timezone,
    });
    setErrors(prev => ({ ...prev, p1Name: undefined, p1Dob: undefined, p1Place: undefined }));
  };

  const handleLoadSampleP2 = () => {
    setP2Name(SAMPLE_PERSON2_PROFILE.name);
    setP2Dob(SAMPLE_PERSON2_PROFILE.dateOfBirth);
    setP2Time(SAMPLE_PERSON2_PROFILE.birthTime);
    setP2TimeKnown(SAMPLE_PERSON2_PROFILE.birthTimeKnown);
    setP2Gender(SAMPLE_PERSON2_PROFILE.gender || 'male');
    setP2Location({
      id: 'p2-sample',
      city: SAMPLE_PERSON2_PROFILE.city || 'Jaipur',
      state: SAMPLE_PERSON2_PROFILE.state || 'Rajasthan',
      country: SAMPLE_PERSON2_PROFILE.country || 'India',
      displayName: SAMPLE_PERSON2_PROFILE.birthPlace,
      latitude: SAMPLE_PERSON2_PROFILE.latitude,
      longitude: SAMPLE_PERSON2_PROFILE.longitude,
      timezone: SAMPLE_PERSON2_PROFILE.timezone,
    });
    setErrors(prev => ({ ...prev, p2Name: undefined, p2Dob: undefined, p2Place: undefined }));
  };

  const handleFillBothSamples = () => {
    handleLoadSampleP1();
    handleLoadSampleP2();
  };

  // Submission handler
  const handleCheckDemoMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    // Validate Person 1
    if (!p1Name.trim()) newErrors.p1Name = 'Please enter name for Person 1';
    if (!p1Dob) newErrors.p1Dob = 'Please enter birth date for Person 1';
    if (!p1Location) newErrors.p1Place = 'Please select birth location for Person 1';

    // Validate Person 2
    if (!p2Name.trim()) newErrors.p2Name = 'Please enter name for Person 2';
    if (!p2Dob) newErrors.p2Dob = 'Please enter birth date for Person 2';
    if (!p2Location) newErrors.p2Place = 'Please select birth location for Person 2';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-switch to tab with error
      if (newErrors.p1Name || newErrors.p1Dob || newErrors.p1Place) {
        setActiveTab('person1');
      } else {
        setActiveTab('person2');
      }
      return;
    }

    // Construct Person 1 profile (SAME BirthProfile structure)
    const person1Profile: BirthProfile = {
      name: p1Name.trim(),
      dateOfBirth: p1Dob,
      birthTime: p1TimeKnown ? p1Time : '12:00',
      birthTimeKnown: p1TimeKnown,
      gender: p1Gender,
      birthPlace: p1Location ? p1Location.displayName : 'New Delhi, Delhi, India',
      city: p1Location?.city,
      state: p1Location?.state,
      country: p1Location?.country,
      latitude: p1Location?.latitude ?? 28.6139,
      longitude: p1Location?.longitude ?? 77.2090,
      timezone: p1Location?.timezone || 'Asia/Kolkata',
      isDemoData: true,
    };

    // Construct Person 2 profile (SEPARATE BirthProfile structure)
    const person2Profile: BirthProfile = {
      name: p2Name.trim(),
      dateOfBirth: p2Dob,
      birthTime: p2TimeKnown ? p2Time : '12:00',
      birthTimeKnown: p2TimeKnown,
      gender: p2Gender,
      birthPlace: p2Location ? p2Location.displayName : 'Jaipur, Rajasthan, India',
      city: p2Location?.city,
      state: p2Location?.state,
      country: p2Location?.country,
      latitude: p2Location?.latitude ?? 26.9124,
      longitude: p2Location?.longitude ?? 75.7873,
      timezone: p2Location?.timezone || 'Asia/Kolkata',
      isDemoData: true,
    };

    onSubmitMatch(person1Profile, person2Profile);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] flex items-center justify-between">
        <button
          onClick={onBackToIntro}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-serif font-bold text-slate-100">
            Birth Profiles Comparison
          </h2>
          <span className="text-[10px] text-amber-300/80 font-mono">
            Person 1 & Person 2
          </span>
        </div>

        <button
          type="button"
          onClick={handleFillBothSamples}
          className="text-[10px] font-semibold px-2 py-1 rounded bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1"
          title="Auto-fill both forms with sample data"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Sample Pair</span>
        </button>
      </div>

      {/* Profile Tab Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0c1222] border border-[#1e2b4f] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('person1')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'person1'
              ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Person 1</span>
          {p1Name && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('person2')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'person2'
              ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>2. Person 2</span>
          {p2Name && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
          )}
        </button>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleCheckDemoMatch} className="space-y-4">
        {/* PERSON 1 FORM */}
        {activeTab === 'person1' && (
          <motion.div
            key="person1-form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-[#0c1222] border border-amber-500/30 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#1e2b4f]/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-bold font-serif">
                  1
                </div>
                <h3 className="text-xs font-serif font-bold text-slate-100">
                  Person 1 Details
                </h3>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleP1}
                className="text-[10px] text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Sample Data</span>
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Name *</span>
              </label>
              <input
                id="person1-name-input"
                type="text"
                value={p1Name}
                onChange={(e) => {
                  setP1Name(e.target.value);
                  if (errors.p1Name) setErrors(prev => ({ ...prev, p1Name: undefined }));
                }}
                placeholder="e.g. Arya Sharma"
                className={`w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border text-xs focus:outline-none transition-colors ${
                  errors.p1Name
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#1e2b4f] focus:border-amber-400'
                }`}
              />
              {errors.p1Name && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.p1Name}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date of Birth *</span>
              </label>
              <input
                id="person1-dob-input"
                type="date"
                value={p1Dob}
                onChange={(e) => {
                  setP1Dob(e.target.value);
                  if (errors.p1Dob) setErrors(prev => ({ ...prev, p1Dob: undefined }));
                }}
                className={`w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border text-xs focus:outline-none transition-colors ${
                  errors.p1Dob
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#1e2b4f] focus:border-amber-400'
                }`}
              />
              {errors.p1Dob && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.p1Dob}</span>
                </p>
              )}
            </div>

            {/* Birth Time & Unknown toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Birth Time</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-amber-300/90 cursor-pointer select-none">
                  <input
                    id="person1-time-unknown-checkbox"
                    type="checkbox"
                    checked={!p1TimeKnown}
                    onChange={(e) => setP1TimeKnown(!e.target.checked)}
                    className="rounded border-[#1e2b4f] text-amber-400 focus:ring-0 w-3.5 h-3.5 bg-[#111a30]"
                  />
                  <span>I don’t know my birth time</span>
                </label>
              </div>

              {p1TimeKnown ? (
                <input
                  id="person1-time-input"
                  type="time"
                  value={p1Time}
                  onChange={(e) => setP1Time(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border border-[#1e2b4f] text-xs focus:outline-none focus:border-amber-400"
                />
              ) : (
                <div className="p-2 rounded-xl bg-[#16203c]/60 border border-[#1e2b4f] text-[11px] text-slate-400 italic">
                  Birth time marked unknown • Traditional Solar Noon (12:00) will be used for demo matching.
                </div>
              )}
            </div>

            {/* Birth Place using LocationPicker */}
            <div>
              <LocationPicker
                selectedLocation={p1Location}
                onSelectLocation={(loc) => {
                  setP1Location(loc);
                  if (errors.p1Place) setErrors(prev => ({ ...prev, p1Place: undefined }));
                }}
                error={errors.p1Place}
              />
            </div>

            {/* Quick button to go to Person 2 */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('person2')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#1e2b4f]"
              >
                <span>Proceed to Person 2 Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* PERSON 2 FORM */}
        {activeTab === 'person2' && (
          <motion.div
            key="person2-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-[#0c1222] border border-amber-500/30 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#1e2b4f]/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-bold font-serif">
                  2
                </div>
                <h3 className="text-xs font-serif font-bold text-slate-100">
                  Person 2 (Partner) Details
                </h3>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleP2}
                className="text-[10px] text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Sample Data</span>
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Name *</span>
              </label>
              <input
                id="person2-name-input"
                type="text"
                value={p2Name}
                onChange={(e) => {
                  setP2Name(e.target.value);
                  if (errors.p2Name) setErrors(prev => ({ ...prev, p2Name: undefined }));
                }}
                placeholder="e.g. Rohan Mehra"
                className={`w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border text-xs focus:outline-none transition-colors ${
                  errors.p2Name
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#1e2b4f] focus:border-amber-400'
                }`}
              />
              {errors.p2Name && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.p2Name}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date of Birth *</span>
              </label>
              <input
                id="person2-dob-input"
                type="date"
                value={p2Dob}
                onChange={(e) => {
                  setP2Dob(e.target.value);
                  if (errors.p2Dob) setErrors(prev => ({ ...prev, p2Dob: undefined }));
                }}
                className={`w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border text-xs focus:outline-none transition-colors ${
                  errors.p2Dob
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#1e2b4f] focus:border-amber-400'
                }`}
              />
              {errors.p2Dob && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.p2Dob}</span>
                </p>
              )}
            </div>

            {/* Birth Time & Unknown toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Birth Time</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-amber-300/90 cursor-pointer select-none">
                  <input
                    id="person2-time-unknown-checkbox"
                    type="checkbox"
                    checked={!p2TimeKnown}
                    onChange={(e) => setP2TimeKnown(!e.target.checked)}
                    className="rounded border-[#1e2b4f] text-amber-400 focus:ring-0 w-3.5 h-3.5 bg-[#111a30]"
                  />
                  <span>I don’t know my birth time</span>
                </label>
              </div>

              {p2TimeKnown ? (
                <input
                  id="person2-time-input"
                  type="time"
                  value={p2Time}
                  onChange={(e) => setP2Time(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#111a30] text-slate-100 border border-[#1e2b4f] text-xs focus:outline-none focus:border-amber-400"
                />
              ) : (
                <div className="p-2 rounded-xl bg-[#16203c]/60 border border-[#1e2b4f] text-[11px] text-slate-400 italic">
                  Birth time marked unknown • Traditional Solar Noon (12:00) will be used for demo matching.
                </div>
              )}
            </div>

            {/* Birth Place using LocationPicker */}
            <div>
              <LocationPicker
                selectedLocation={p2Location}
                onSelectLocation={(loc) => {
                  setP2Location(loc);
                  if (errors.p2Place) setErrors(prev => ({ ...prev, p2Place: undefined }));
                }}
                error={errors.p2Place}
              />
            </div>

            {/* Quick button to return to Person 1 */}
            <div className="pt-1">
              <button
                type="button"
                id="back-to-person-1-btn"
                onClick={() => setActiveTab('person1')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#1e2b4f]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Review / Edit Person 1 Details</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick summary of both profiles before matching */}
        <div className="p-3 rounded-xl bg-[#0c1222] border border-[#1e2b4f] flex items-center justify-between text-xs">
          <div className="truncate max-w-[45%]">
            <span className="text-[10px] text-slate-400 block">Person 1:</span>
            <span className="font-semibold text-slate-200 truncate block">
              {p1Name || '(Enter Name)'}
            </span>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 text-[10px] font-bold border border-amber-500/20 font-serif">
            VS
          </div>

          <div className="truncate max-w-[45%] text-right">
            <span className="text-[10px] text-slate-400 block">Person 2:</span>
            <span className="font-semibold text-slate-200 truncate block">
              {p2Name || '(Enter Name)'}
            </span>
          </div>
        </div>

        {/* MAIN MATCH BUTTON */}
        <div className="space-y-2 pt-1">
          <button
            id="check-demo-match-btn"
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Check Demo Match</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            * This action will load demo matching results based on traditional Vedic Ashtakoota principles. Real astronomical calculation engine is not connected.
          </p>
        </div>
      </form>
    </div>
  );
};
