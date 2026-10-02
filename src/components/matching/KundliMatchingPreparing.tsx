import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, HeartHandshake, Compass, Moon } from 'lucide-react';
import { BirthProfile } from '../../types';

interface KundliMatchingPreparingProps {
  person1: BirthProfile;
  person2: BirthProfile;
  onFinishPreparing: () => void;
}

export const KundliMatchingPreparing: React.FC<KundliMatchingPreparingProps> = ({
  person1,
  person2,
  onFinishPreparing,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    'Validating Person 1 & Person 2 birth profiles...',
    'Calculating sidereal Moon positions with Lahiri Ayanamsha...',
    'Analyzing Ashtakoota 8-fold dimensions (36 Gunas)...',
    'Synthesizing planetary friendship and compatibility matrix...',
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 380);

    const finishTimer = setTimeout(() => {
      onFinishPreparing();
    }, 1600);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, [onFinishPreparing, steps.length]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-8">
      {/* Animated Cosmic Circle */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-25" />
        
        {/* Rotating dash ring */}
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '6s' }} />

        {/* Counter-rotating gradient ring */}
        <div className="absolute inset-3 rounded-full border border-rose-400/40 animate-pulse" />

        {/* Center Orb */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#16203c] via-[#101930] to-[#0c1222] border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <HeartHandshake className="w-7 h-7 text-amber-300 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <div className="space-y-2 max-w-xs mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Preparing Demo Match</span>
        </div>

        <h3 className="text-lg font-serif font-bold text-slate-100">
          {person1.name} <span className="text-amber-300">&</span> {person2.name}
        </h3>

        <p className="text-xs text-amber-300/80 font-mono min-h-[20px] transition-all">
          {steps[currentStepIndex]}
        </p>

        <div className="w-48 bg-[#111a30] h-1.5 rounded-full mx-auto overflow-hidden mt-3 border border-[#1e2b4f]">
          <motion.div
            initial={{ width: '10%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-200 rounded-full"
          />
        </div>

        <p className="text-[10px] text-slate-400 pt-3 italic">
          Sample calculation only • Real ephemeris calculation engine is not connected.
        </p>
      </div>
    </div>
  );
};
