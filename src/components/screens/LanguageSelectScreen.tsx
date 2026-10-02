import React from 'react';
import { Languages, Check, Sparkles } from 'lucide-react';
import { useTranslation, SupportedLanguage, languageService } from '../../services/languageService';

interface LanguageSelectScreenProps {
  onContinue: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ onContinue }) => {
  const { t, language } = useTranslation();

  const handleSelect = (lang: SupportedLanguage) => {
    languageService.setLanguage(lang);
  };

  const handleProceed = () => {
    try {
      localStorage.setItem('app_language_selected', 'true');
    } catch (e) {
      // ignore
    }
    onContinue();
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#070b14] via-[#0c1222] to-[#05080f] text-slate-100 min-h-screen">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Vedic decorative emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Languages className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold font-serif text-amber-200">
            {language === 'hi' ? 'अपनी पसंदीदा भाषा चुनें' : 'Choose Your Preferred Language'}
          </h1>
          <p className="text-xs text-slate-400">
            {language === 'hi'
              ? 'आप ज्योतिषीय परामर्श और दैनिक राशिफल के लिए अपनी भाषा चुन सकते हैं।'
              : 'Select your language for astrological consultations, horoscopes, and Vedic insights.'}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {/* English Option */}
          <button
            onClick={() => handleSelect('en')}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
              language === 'en'
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                : 'bg-[#10172a] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base font-bold">English</span>
              <span className="text-xs text-slate-400 font-sans">Default (English UI)</span>
            </div>
            {language === 'en' && (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Hindi Option */}
          <button
            onClick={() => handleSelect('hi')}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
              language === 'hi'
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                : 'bg-[#10172a] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div>
                <div className="text-base font-bold font-serif">हिन्दी</div>
                <div className="text-xs text-slate-400">हिंदी इंटरफ़ेस और वैदिक ज्योतिष</div>
              </div>
            </div>
            {language === 'hi' && (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleProceed}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Sparkles className="w-4 h-4" />
          <span>{language === 'hi' ? 'जारी रखें' : 'Continue'}</span>
        </button>
      </div>
    </div>
  );
};
