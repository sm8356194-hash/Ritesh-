import React, { useState } from 'react';
import { UserBirthDetails, DashboardSection, BirthProfile, KundliMatchingResult } from '../../types';
import { calculateKundliMatch, SAMPLE_PERSON1_PROFILE, SAMPLE_PERSON2_PROFILE } from '../../services/kundliMatchingService';
import { KundliMatchingIntro } from './KundliMatchingIntro';
import { KundliMatchingForm } from './KundliMatchingForm';
import { KundliMatchingPreparing } from './KundliMatchingPreparing';
import { KundliMatchingResultView } from './KundliMatchingResultView';

interface KundliMatchingViewProps {
  userDetails: UserBirthDetails;
  onNavigateSection?: (section: DashboardSection) => void;
}

export type MatchingStep = 'intro' | 'form' | 'preparing' | 'result';

export const KundliMatchingView: React.FC<KundliMatchingViewProps> = ({
  userDetails,
  onNavigateSection,
}) => {
  const [step, setStep] = useState<MatchingStep>('intro');

  // Convert userDetails into BirthProfile for Person 1
  const defaultPerson1: BirthProfile = {
    name: userDetails.name || userDetails.fullName || 'Arya Sharma',
    dateOfBirth: userDetails.dateOfBirth || userDetails.dob || '1998-08-15',
    birthTime: userDetails.birthTime || '08:30',
    birthTimeKnown: userDetails.birthTimeKnown ?? (!userDetails.isTimeUnknown),
    gender: userDetails.gender || 'female',
    birthPlace: userDetails.birthPlace || 'New Delhi, Delhi, India',
    city: userDetails.city || 'New Delhi',
    state: userDetails.state || 'Delhi',
    country: userDetails.country || 'India',
    latitude: userDetails.latitude ?? 28.6139,
    longitude: userDetails.longitude ?? 77.2090,
    timezone: userDetails.timezone || 'Asia/Kolkata',
    isDemoData: true,
  };

  const [person1Profile, setPerson1Profile] = useState<BirthProfile>(defaultPerson1);
  const [person2Profile, setPerson2Profile] = useState<BirthProfile>(SAMPLE_PERSON2_PROFILE);
  const [matchResult, setMatchResult] = useState<KundliMatchingResult>(() => 
    calculateKundliMatch(defaultPerson1, SAMPLE_PERSON2_PROFILE)
  );

  // Quick instant sample demo trigger from Intro
  const handleQuickDemoMatch = () => {
    setPerson1Profile(SAMPLE_PERSON1_PROFILE);
    setPerson2Profile(SAMPLE_PERSON2_PROFILE);
    const result = calculateKundliMatch(SAMPLE_PERSON1_PROFILE, SAMPLE_PERSON2_PROFILE);
    setMatchResult(result);
    setStep('preparing');
  };

  // Form submission handler
  const handleSubmitMatch = (p1: BirthProfile, p2: BirthProfile) => {
    setPerson1Profile(p1);
    setPerson2Profile(p2);
    const result = calculateKundliMatch(p1, p2);
    setMatchResult(result);
    setStep('preparing');
  };

  return (
    <div className="space-y-4">
      {/* 1. KUNDLI MATCHING HOME / INTRO SCREEN */}
      {step === 'intro' && (
        <KundliMatchingIntro
          onStartMatching={() => setStep('form')}
          onQuickDemoMatch={handleQuickDemoMatch}
        />
      )}

      {/* 2 & 3. PERSON 1 & PERSON 2 FORM */}
      {step === 'form' && (
        <KundliMatchingForm
          initialPerson1={person1Profile}
          initialPerson2={person2Profile}
          onSubmitMatch={handleSubmitMatch}
          onBackToIntro={() => setStep('intro')}
        />
      )}

      {/* 4. PREPARING DEMO MATCH STATE */}
      {step === 'preparing' && (
        <KundliMatchingPreparing
          person1={person1Profile}
          person2={person2Profile}
          onFinishPreparing={() => setStep('result')}
        />
      )}

      {/* 5, 6, 7, 8, 9. MATCH RESULT SCREEN */}
      {step === 'result' && (
        <KundliMatchingResultView
          result={matchResult}
          onModifyProfiles={() => setStep('form')}
          onTalkToAstrologer={() => {
            if (onNavigateSection) {
              onNavigateSection('talk');
            }
          }}
        />
      )}
    </div>
  );
};
