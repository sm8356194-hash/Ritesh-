import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SupportedLanguage, languageService } from '../../services/languageService';

interface GlobalLanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'expanded';
  id?: string;
}

export const GlobalLanguageSelector: React.FC<GlobalLanguageSelectorProps> = ({
  className = '',
  variant = 'compact',
  id = 'global-language-selector',
}) => {
  const { language } = useTranslation();

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (language !== lang) {
      languageService.setLanguage(lang);
      try {
        localStorage.setItem('app_language_selected', 'true');
      } catch (e) {
        // ignore
      }
    }
  };

  if (variant === 'expanded') {
    return (
      <div 
        id={id}
        className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0e1628]/95 border border-amber-500/30 backdrop-blur-md shadow-md ${className}`}
      >
        <div className="flex items-center gap-1 pl-1 pr-1.5 text-amber-400">
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 hidden xs:inline">Lang:</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              language === 'en'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-amber-200 hover:bg-[#16203c]'
            }`}
            title="Switch to English"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSelectLanguage('hi')}
            className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              language === 'hi'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-amber-200 hover:bg-[#16203c]'
            }`}
            title="Switch to हिन्दी (Hindi)"
          >
            हिन्दी
          </button>
        </div>
      </div>
    );
  }

  // Compact segmented pill variant (ideal for headers and mobile navigation bars)
  return (
    <div
      id={id}
      className={`inline-flex items-center p-0.5 rounded-lg bg-[#0e1628]/90 border border-amber-500/30 shadow-xs shrink-0 select-none ${className}`}
      aria-label="Language selector"
    >
      <button
        type="button"
        id={`${id}-en-btn`}
        onClick={() => handleSelectLanguage('en')}
        className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
          language === 'en'
            ? 'bg-amber-400 text-slate-950 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        id={`${id}-hi-btn`}
        onClick={() => handleSelectLanguage('hi')}
        className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
          language === 'hi'
            ? 'bg-amber-400 text-slate-950 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="हिन्दी"
      >
        हिन्दी
      </button>
    </div>
  );
};
