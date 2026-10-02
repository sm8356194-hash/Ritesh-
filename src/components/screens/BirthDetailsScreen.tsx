import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { BirthProfile } from '../../types';
import { LocationPicker } from '../birth/LocationPicker';
import { DemoLocation, DEFAULT_DEMO_LOCATION, SAMPLE_LOCATIONS } from '../../data/demoLocations';
import { useTranslation } from '../../services/languageService';

interface BirthDetailsScreenProps {
  initialDetails: BirthProfile;
  onSaveAndCreateChart: (profile: BirthProfile) => Promise<void> | void;
  onBack: () => void;
}

export const BirthDetailsScreen: React.FC<BirthDetailsScreenProps> = ({
  initialDetails,
  onSaveAndCreateChart,
  onBack,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialDetails.name || initialDetails.birthPlace ? initialDetails.name : '');
  const [dateOfBirth, setDateOfBirth] = useState(initialDetails.dateOfBirth || '1998-08-15');
  const [birthTime, setBirthTime] = useState(initialDetails.birthTime || '08:30');
  const [birthTimeKnown, setBirthTimeKnown] = useState(initialDetails.birthTimeKnown ?? true);
  const [gender, setGender] = useState<string>(initialDetails.gender || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-seed location from initialDetails or default
  const initialLoc: DemoLocation = {
    id: 'initial-loc',
    city: initialDetails.city || 'New Delhi',
    state: initialDetails.state || 'Delhi',
    country: initialDetails.country || 'India',
    displayName: initialDetails.birthPlace || 'New Delhi, Delhi, India',
    latitude: initialDetails.latitude ?? 28.6139,
    longitude: initialDetails.longitude ?? 77.2090,
    timezone: initialDetails.timezone || 'Asia/Kolkata',
  };

  const [selectedLocation, setSelectedLocation] = useState<DemoLocation | null>(
    initialDetails.birthPlace ? initialLoc : DEFAULT_DEMO_LOCATION
  );

  const [errors, setErrors] = useState<{
    name?: string;
    dateOfBirth?: string;
    birthTime?: string;
    birthPlace?: string;
  }>({});

  const handleFillSample = () => {
    setName('Demo Profile');
    setDateOfBirth('1998-08-15');
    setBirthTime('08:30');
    setBirthTimeKnown(true);
    setGender('female');
    setSelectedLocation(DEFAULT_DEMO_LOCATION);
    setErrors({});
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    // 1. Name validation
    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    // 2. Date of birth validation
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Please select your date of birth.';
    } else {
      const year = parseInt(dateOfBirth.split('-')[0], 10);
      if (isNaN(year) || year < 1900 || year > 2026) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth between 1900 and 2026.';
      }
    }

    // 3. Birth time validation when enabled
    if (birthTimeKnown && !birthTime) {
      newErrors.birthTime = 'Please provide your birth time (or select "I don’t know my birth time").';
    }

    // 4. Birth place validation
    if (!selectedLocation) {
      newErrors.birthPlace = 'Please select a sample birth place from the list.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Build structured birthProfile
    const profile: BirthProfile = {
      name: name.trim(),
      dateOfBirth,
      birthTime: birthTimeKnown ? birthTime : '12:00',
      birthTimeKnown,
      gender: gender || 'unspecified',
      birthPlace: selectedLocation!.displayName,
      city: selectedLocation!.city,
      state: selectedLocation!.state,
      country: selectedLocation!.country,
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
      timezone: selectedLocation!.timezone,
      isDemoData: false,
    };

    setIsSubmitting(true);
    try {
      await onSaveAndCreateChart(profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between p-5 max-w-md mx-auto">
      <div>
        {/* Header navigation & title */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full text-slate-400 hover:text-amber-300 hover:bg-[#16203c] transition-colors"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Birth Profile Setup (Prototype)</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-serif font-bold text-slate-100 tracking-tight">
              {t('enterBirthDetails')}
            </h2>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#16203c] border border-amber-500/30 text-amber-300 hover:bg-amber-400/10 transition-colors"
            >
              Fill Sample Demo
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Provide birth parameters for traditional astrology interpretation. Data is maintained solely in your client session for this prototype.
          </p>
        </motion.div>

        {/* Form Container */}
        <form onSubmit={validateAndSubmit} className="space-y-4">
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('fullName')}</span>
            </label>
            <div className="relative">
              <input
                id="birth-fullname-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="e.g. Arya Sharma"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0c1222] border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
                  errors.name ? 'border-rose-500' : 'border-[#1e2b4f] focus:border-amber-400'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* 2. Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('dateOfBirth')}</span>
            </label>
            <input
              id="birth-dob-input"
              type="date"
              value={dateOfBirth}
              max="2026-12-31"
              min="1920-01-01"
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0c1222] border text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
                errors.dateOfBirth ? 'border-rose-500' : 'border-[#1e2b4f] focus:border-amber-400'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dateOfBirth}</span>
              </p>
            )}
          </div>

          {/* 3. Birth Time & "I don’t know my birth time" */}
          <div className="p-3.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('timeOfBirth')}</span>
              </label>

              {/* Checkbox: "I don’t know my birth time" */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="birth-unknown-time-checkbox"
                  type="checkbox"
                  checked={!birthTimeKnown}
                  onChange={(e) => {
                    const isUnknown = e.target.checked;
                    setBirthTimeKnown(!isUnknown);
                    if (isUnknown && errors.birthTime) {
                      setErrors({ ...errors, birthTime: undefined });
                    }
                  }}
                  className="w-4 h-4 rounded bg-[#16203c] border-amber-500/40 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
                />
                <span className="text-[11px] text-amber-300 font-medium">
                  I don’t know my birth time
                </span>
              </label>
            </div>

            {/* Time Input Field - Disabled when birth time is unknown */}
            <div>
              <input
                id="birth-time-input"
                type="time"
                value={birthTimeKnown ? birthTime : ''}
                disabled={!birthTimeKnown}
                onChange={(e) => {
                  setBirthTime(e.target.value);
                  if (errors.birthTime) setErrors({ ...errors, birthTime: undefined });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-100 transition-all ${
                  !birthTimeKnown
                    ? 'bg-[#080d19] border-[#1e2b4f]/40 text-slate-500 cursor-not-allowed opacity-60'
                    : errors.birthTime
                    ? 'bg-[#111a30] border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'bg-[#111a30] border-[#1e2b4f] focus:outline-none focus:ring-1 focus:ring-amber-400'
                }`}
              />
              {birthTimeKnown && errors.birthTime && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.birthTime}</span>
                </p>
              )}
            </div>

            {/* Clear Message when birth time unknown */}
            {!birthTimeKnown && (
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">
                    Birth-time-based calculations may be limited.
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    You can still generate your demo profile. Traditional astrology uses a noon solar chart (Surya Kundli) when precise birth time is unavailable.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Birth Place (Location Search with structured coordinates) */}
          <LocationPicker
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              if (errors.birthPlace) setErrors({ ...errors, birthPlace: undefined });
            }}
            error={errors.birthPlace}
          />

          {/* 5. Gender (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                {t('gender')} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Traditional Archetypes</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'female', label: 'Female' },
                { id: 'male', label: 'Male' },
                { id: 'other', label: 'Other' },
                { id: 'unspecified', label: 'Skip' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(gender === g.id ? '' : g.id)}
                  className={`py-2 px-2 rounded-lg text-xs capitalize font-medium border transition-all text-center ${
                    gender === g.id
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-[#0c1222] border-[#1e2b4f] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Data Notice Banner */}
          <div className="pt-1 flex items-start gap-2 text-[11px] text-amber-300/80 bg-amber-400/5 p-2.5 rounded-xl border border-amber-400/20">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              PROTOTYPE NOTICE: Birth parameters are stored in temporary browser state. No remote accounts or external calculation APIs are connected.
            </span>
          </div>

          {/* 6. Create My Chart Button */}
          <div className="pt-2">
            <button
              id="create-chart-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b48c26] via-[#d4af37] to-[#fde047] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Saving Profile...' : t('saveAndCreateChart')}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="text-center pt-4 text-[10px] text-slate-500">
        Talk With Astrologers • Frontend Prototype Preview
      </div>
    </div>
  );
};
