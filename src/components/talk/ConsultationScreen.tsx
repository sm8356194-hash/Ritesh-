import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Compass, 
  PhoneCall, 
  X, 
  Send, 
  Sparkles, 
  Lock, 
  Clock,
  ShieldCheck,
  UserCheck,
  Globe,
  Languages,
  Loader2,
  Archive
} from 'lucide-react';
import { Astrologer, AstrologerProfile, ConsultationRecord, UserBirthDetails } from '../../types';
import { KundliView } from '../dashboard/KundliView';
import { translationService } from '../../services/translationService';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/auth/authService';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface ConsultationScreenProps {
  astrologer: Astrologer | AstrologerProfile;
  userDetails: UserBirthDetails;
  consultation?: ConsultationRecord;
  onBack: () => void;
  onEndConsultation: () => void;
  onPreviewVoiceCall?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'astrologer';
  text: string;
  time: string;
  isDemo: boolean;
  sourceLang?: 'en' | 'hi';
  translatedText?: string;
  targetLanguage?: 'en' | 'hi';
  translationStatus?: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  isAiTranslated?: boolean;
  showOriginal?: boolean;
}

export const ConsultationScreen: React.FC<ConsultationScreenProps> = ({
  astrologer,
  userDetails,
  consultation,
  onBack,
  onEndConsultation,
  onPreviewVoiceCall,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chat' | 'kundli'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userName = userDetails.fullName || userDetails.name || 'Friend';
  const isReadOnly = Boolean(
    consultation?.status === 'COMPLETED' || 
    consultation?.status === 'CANCELLED' || 
    consultation?.status === 'REJECTED'
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load existing messages or initialize session greeting
  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      setLoadingHistory(true);
      const currentUser = authService.getCurrentUser();

      if (consultation?.id && currentUser) {
        try {
          const res = await chatService.getMessagesForConsultation(currentUser, consultation.id);
          if (res.success && isMounted) {
            if (res.data && res.data.length > 0) {
              const formatted: ChatMessage[] = res.data.map((m) => ({
                id: m.id,
                sender: m.senderRole === 'ASTROLOGER' ? 'astrologer' : 'user',
                text: m.message,
                time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isDemo: true,
                sourceLang: m.sourceLanguage === 'hi' ? 'hi' : 'en',
                translatedText: m.translatedText,
                targetLanguage: m.targetLanguage,
                translationStatus: m.translationStatus,
              }));
              setMessages(formatted);
            } else if (!isReadOnly) {
              // First time opening an active consultation: seed astrologer greeting once
              const greeting = `Namaste ${userName}! Welcome to our consultation. I have loaded your registered birth details (${userDetails.birthPlace || 'New Delhi'}). You can tap the "KUNDLI" tab above at any time to inspect your D1 chart, planetary positions, and active Dasha alongside our conversation.`;
              const seedRes = await chatService.sendDemoAstrologerMessage(currentUser, {
                consultationId: consultation.id,
                message: greeting,
                sourceLanguage: 'en',
              });
              if (seedRes.success && isMounted && seedRes.data) {
                setMessages([
                  {
                    id: seedRes.data.id,
                    sender: 'astrologer',
                    text: seedRes.data.message,
                    time: new Date(seedRes.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isDemo: true,
                    sourceLang: 'en',
                  },
                ]);
              }
            } else {
              setMessages([]);
            }
          }
        } catch (err) {
          console.error('Failed to load consultation messages', err);
        }
      } else {
        // Fallback demo state when no database consultation is bound
        setMessages([
          {
            id: 'msg-1',
            sender: 'user',
            text: 'Can you explain my Kundli?',
            time: '10:00 AM',
            isDemo: true,
            sourceLang: 'en',
          },
          {
            id: 'msg-2',
            sender: 'astrologer',
            text: `Namaste ${userName}! This is a sample response for the prototype. I have loaded your registered birth details (${userDetails.birthPlace || 'New Delhi'}). You can tap the "KUNDLI" tab above at any time to inspect your D1 chart, planetary positions, and active Dasha alongside our conversation.`,
            time: '10:01 AM',
            isDemo: true,
            sourceLang: 'en',
          },
        ]);
      }
      if (isMounted) setLoadingHistory(false);
    };

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [consultation?.id, isReadOnly, userName, userDetails.birthPlace]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

  // Effect to translate messages when preferred language differs from source language
  useEffect(() => {
    messages.forEach((m) => {
      const source = m.sourceLang || translationService.detectLanguage(m.text);
      const needsTranslation =
        source !== preferredLang &&
        (!m.translatedText || m.targetLanguage !== preferredLang) &&
        m.translationStatus !== 'PENDING';

      if (needsTranslation) {
        setMessages((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, translationStatus: 'PENDING' } : item))
        );

        translationService.translateMessage(m.text, preferredLang, source).then((res) => {
          if (res.success && res.translatedText) {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === m.id
                  ? {
                      ...item,
                      translatedText: res.translatedText,
                      targetLanguage: preferredLang,
                      translationStatus: 'COMPLETED',
                      isAiTranslated: res.isAiTranslated ?? true,
                    }
                  : item
              )
            );
          } else {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === m.id ? { ...item, translationStatus: 'FAILED' } : item
              )
            );
          }
        });
      }
    });
  }, [preferredLang, messages]);

  const toggleShowOriginal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showOriginal: !m.showOriginal } : m))
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping || isSending || isReadOnly) return;

    setIsSending(true);
    const currentUser = authService.getCurrentUser();
    const sourceLang = translationService.detectLanguage(text);

    let createdId = `msg-${Date.now()}`;
    let createdTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Persist user message to chatService if consultation ID is active
    if (consultation?.id && currentUser) {
      const sendRes = await chatService.sendMessage(currentUser, {
        consultationId: consultation.id,
        message: text,
      });
      if (sendRes.success && sendRes.data) {
        createdId = sendRes.data.id;
        createdTime = new Date(sendRes.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    const userMsg: ChatMessage = {
      id: createdId,
      sender: 'user',
      text,
      time: createdTime,
      isDemo: true,
      sourceLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsSending(false);

    if (!textToSend && inputRef.current) {
      inputRef.current.focus();
    }

    // Translate user message if preferred language differs
    if (sourceLang !== preferredLang) {
      translationService.translateMessage(text, preferredLang, sourceLang).then((res) => {
        if (res.success && res.translatedText) {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === userMsg.id
                ? {
                    ...item,
                    translatedText: res.translatedText,
                    targetLanguage: preferredLang,
                    translationStatus: 'COMPLETED',
                    isAiTranslated: res.isAiTranslated ?? true,
                  }
                : item
            )
          );
        }
      });
    }

    // Simulated astrologer response
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);
      const responses = [
        `In traditional Vedic astrology interpretation, your 10th house reflects noble leadership and strategic discipline. Tap the KUNDLI tab above to inspect your planetary degrees and active transits.`,
        `According to classical Jyotish archetypes, your current Jupiter Mahadasha sample period is traditionally associated with inner expansion, knowledge cultivation, and grounded progress.`,
        `In traditional chart interpretation, having exalted placements fosters stability and calm endurance. Remember that all readings in this prototype are demonstration samples.`,
        `Traditional texts suggest cultivating patient mindfulness in your daily responsibilities. Your current planetary alignments encourage thoughtful communication and structured work.`
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const astroSource = translationService.detectLanguage(randomResponse);

      let astroMsgId = `msg-${Date.now() + 1}`;
      let astroTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Persist astrologer demo reply
      if (consultation?.id && currentUser) {
        const replyRes = await chatService.sendDemoAstrologerMessage(currentUser, {
          consultationId: consultation.id,
          message: randomResponse,
          sourceLanguage: astroSource === 'hi' ? 'hi' : 'en',
        });
        if (replyRes.success && replyRes.data) {
          astroMsgId = replyRes.data.id;
          astroTime = new Date(replyRes.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }

      const astroMsg: ChatMessage = {
        id: astroMsgId,
        sender: 'astrologer',
        text: randomResponse,
        time: astroTime,
        isDemo: true,
        sourceLang: astroSource,
      };
      setMessages((prev) => [...prev, astroMsg]);

      // Automatically translate astrologer message if client prefers Hindi
      if (preferredLang === 'hi') {
        translationService.translateMessage(randomResponse, 'hi', astroSource).then((res) => {
          if (res.success && res.translatedText) {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === astroMsg.id
                  ? {
                      ...item,
                      translatedText: res.translatedText,
                      targetLanguage: 'hi',
                      translationStatus: 'COMPLETED',
                      isAiTranslated: true,
                    }
                  : item
              )
            );
          }
        });
      }
    }, 750);
  };

  const sampleQuestions = [
    'Can you explain my Kundli?',
    'What does my 10th house indicate?',
    'Which planet is exalted?',
    'Tell me about my active Dasha',
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-[82vh] text-slate-100 overflow-x-hidden">
      {/* 1. CONSISTENT CONSULTATION HEADER */}
      <div className="sticky top-14 z-30 bg-[#0c1222]/95 backdrop-blur-md border-b border-[#1e2b4f] px-3 py-2.5 rounded-2xl shadow-lg mb-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Back button + Astrologer Avatar & Identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              id="consultation-back-btn"
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-[#16203c] transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>

            {/* Astrologer Avatar with online indicator */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20">
                <div className="w-full h-full rounded-xl bg-[#0c1222] flex items-center justify-center font-serif font-bold text-amber-300 text-sm">
                  {astrologer.name.charAt(0)}
                </div>
              </div>
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c1222] ${
                  isReadOnly ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                }`}
                title={isReadOnly ? 'Archived Session' : 'Online Demo'}
              />
            </div>

            {/* Astrologer Name & Online/Demo Status */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-xs sm:text-sm font-serif font-bold text-slate-100 truncate">
                  {astrologer.name}
                </h1>
                {consultation?.status ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                    consultation.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    consultation.status === 'ACTIVE' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                    consultation.status === 'CANCELLED' || consultation.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    {consultation.status}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    DEMO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <span className={`flex items-center gap-1 font-medium truncate ${
                  isReadOnly ? 'text-slate-400' : 'text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isReadOnly ? 'bg-slate-400' : 'bg-emerald-400'}`} />
                  {isReadOnly ? 'Archived Consultation' : 'Active Demo Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls: Global Language Selector, Voice Call (Preview) & End Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Global Language Selector accessible in active session */}
            <GlobalLanguageSelector id="consultation-global-lang-selector" />

            {!isReadOnly && onPreviewVoiceCall && (
              <button
                id="consultation-voice-btn"
                onClick={onPreviewVoiceCall}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#16203c] hover:bg-[#1f2c52] border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                title="Voice Call (Preview)"
                aria-label="Preview Voice Call"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span className="hidden xs:inline text-[11px]">{t('call')}</span>
              </button>
            )}

            <button
              id="consultation-end-btn"
              onClick={onEndConsultation}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
              title={isReadOnly ? 'Close Session Archive' : 'End Consultation'}
              aria-label="End or Close Consultation"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span className="hidden xs:inline text-[11px]">{isReadOnly ? t('close') : t('end')}</span>
            </button>
          </div>
        </div>

        {/* Subtle Privacy Notice Strip */}
        <div className="mt-2 pt-2 border-t border-[#1e2b4f]/70 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-amber-300/80 truncate">
            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              {isReadOnly ? 'Archived consultation transcript • Synchronized records' : 'Sample consultation • Synchronized with your birth chart'}
            </span>
          </span>
          <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-1">
            {consultation?.id ? `#${consultation.id.slice(-6)}` : 'Client-Only Demo'}
          </span>
        </div>
      </div>

      {/* 2. CONSULTATION TABS: [ CHAT ] [ KUNDLI ] */}
      <div className="w-full bg-[#0c1222] p-1.5 rounded-2xl border border-[#1e2b4f] shadow-md flex gap-1.5 mb-2.5 shrink-0">
        <button
          id="consultation-tab-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#16203c]/60'
          }`}
          aria-label="Chat view"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('chat').toUpperCase()}</span>
        </button>

        <button
          id="consultation-tab-kundli"
          onClick={() => setActiveTab('kundli')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'kundli'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#16203c]/60'
          }`}
          aria-label="Kundli view"
        >
          <Compass className="w-4 h-4" />
          <span>{t('kundli').toUpperCase()}</span>
        </button>
      </div>

      {/* 3. MAIN CONTENT: CHAT TAB OR KUNDLI TAB */}
      {activeTab === 'chat' ? (
        <div className="w-full flex-1 flex flex-col min-h-0 space-y-2.5">
          {/* Read-Only Banner if Completed or Cancelled */}
          {isReadOnly ? (
            <div className="px-3.5 py-2 rounded-xl bg-[#111a30] border border-[#1e2b4f] flex items-center justify-between text-xs text-slate-300 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {consultation?.status === 'COMPLETED'
                    ? 'This consultation has ended. Viewing message transcript archive.'
                    : `This consultation was ${consultation?.status?.toLowerCase()}. Viewing message archive.`}
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0 ml-1">
                Read-Only
              </span>
            </div>
          ) : (
            /* Quick Consultation Badge Info */
            <div className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-center text-[10.5px] text-amber-300 flex items-center justify-center gap-1.5 shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Interactive consultation session with {astrologer.name}</span>
            </div>
          )}

          {/* Language Preference Control Bar */}
          <div className="px-3 py-1.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] flex items-center justify-between text-[11px] shrink-0">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Translate Chat To:</span>
            </span>
            <div className="flex bg-[#16203c] p-0.5 rounded-lg border border-[#1e2b4f]">
              <button
                onClick={() => setPreferredLang('en')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  preferredLang === 'en'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setPreferredLang('hi')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  preferredLang === 'hi'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* CHAT AREA: Full-Width Message Stream */}
          <div className="w-full flex-1 min-h-[320px] rounded-2xl bg-[#090e1a] border border-[#1e2b4f] p-3 sm:p-4 space-y-3.5 overflow-y-auto shadow-inner scrollbar-thin">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Loading consultation messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2 text-center">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No messages recorded in this consultation.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender === 'user';
                const source = m.sourceLang || translationService.detectLanguage(m.text);
                const isSameLang = source === preferredLang;
                const isPending = m.translationStatus === 'PENDING';
                const isFailed = m.translationStatus === 'FAILED';
                const hasValidTranslation = !isSameLang && Boolean(m.translatedText && m.targetLanguage === preferredLang && m.translationStatus === 'COMPLETED');
                const showingTranslation = hasValidTranslation && !m.showOriginal;
                const displayText = showingTranslation ? m.translatedText : m.text;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-300">
                        {isUser ? 'You' : astrologer.name}
                      </span>
                      {!isUser && (
                        <span className="text-amber-400/90 font-mono text-[9px]">
                          (Astrologer)
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-slate-500">{m.time}</span>

                      {/* Pending Spinner */}
                      {isPending && !isSameLang && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[9px]">
                          <Sparkles className="w-2.5 h-2.5 animate-spin text-amber-400" />
                          <span>Translating...</span>
                        </span>
                      )}

                      {/* AI Translation Badge */}
                      {showingTranslation && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-medium">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          <span>AI-Translated ({m.targetLanguage === 'hi' ? 'Hindi' : 'English'})</span>
                        </span>
                      )}

                      {/* Failed Badge */}
                      {isFailed && !isSameLang && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[9px]">
                          <span>⚠️ Translation Unavailable</span>
                        </span>
                      )}
                    </div>

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] break-words relative ${
                        isUser
                          ? 'bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-medium rounded-br-xs shadow-md shadow-amber-500/15'
                          : 'bg-[#101930] text-slate-100 border border-[#1e2b4f] rounded-bl-xs shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{displayText}</p>

                      {/* Show Original / Show Translation Toggle */}
                      {hasValidTranslation && (
                        <div className="mt-1.5 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                          <span className="text-[9px] text-slate-400">
                            {showingTranslation ? `Translated from ${m.sourceLang === 'hi' ? 'Hindi' : 'English'}` : 'Showing original'}
                          </span>
                          <button
                            onClick={() => toggleShowOriginal(m.id)}
                            className="text-amber-400 hover:underline font-medium text-[9px]"
                          >
                            {showingTranslation ? 'View original' : 'View translation'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#101930] text-amber-300 text-xs w-max border border-[#1e2b4f]">
                <div className="w-5 h-5 rounded-lg bg-amber-400/20 flex items-center justify-center font-serif font-bold text-amber-400 text-xs">
                  {astrologer.name.charAt(0)}
                </div>
                <span className="text-[11px] text-slate-300">{astrologer.name} is typing...</span>
                <span className="flex gap-1 items-center ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (Available only in active session) */}
          {!isReadOnly && (
            <div className="w-full overflow-x-auto scrollbar-none shrink-0 py-0.5">
              <div className="flex items-center gap-1.5 w-max">
                <span className="text-[10px] text-slate-400 shrink-0">Sample:</span>
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isTyping || isSending}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-[#0c1222] hover:bg-[#16203c] border border-[#1e2b4f] hover:border-amber-400/40 text-amber-300/90 whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. CHAT COMPOSER OR READ-ONLY ARCHIVE NOTICE */}
          {isReadOnly ? (
            <div className="w-full p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center text-xs text-slate-400 shrink-0 shadow-md">
              <p className="font-medium text-amber-300/90 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Concluded • Message Composer Disabled</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                This consultation record is archived. To start a new consultation, select an astrologer from the directory.
              </p>
            </div>
          ) : (
            <div className="w-full p-2 bg-[#0c1222] border border-[#1e2b4f] rounded-2xl shadow-lg shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  id="consultation-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isTyping || isSending}
                  autoComplete="off"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]"
                />
                <button
                  type="submit"
                  id="consultation-send-btn"
                  disabled={!inputText.trim() || isTyping || isSending}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[9px] text-slate-500 text-center mt-1 px-2">
                Vedic consultation • Traditional interpretive guidance only
              </p>
            </div>
          )}
        </div>
      ) : (
        /* KUNDLI TAB: Full-width shared Kundli inside consultation */
        <div className="w-full space-y-3 flex-1">
          {userDetails && (userDetails.dateOfBirth || userDetails.dob) ? (
            <>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#101930] to-[#0c1222] border border-amber-400/30 text-xs text-slate-200 flex items-start gap-2.5 shadow-md">
                <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-300">Synchronized Consultation Chart</p>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Viewing registered birth chart for <strong>{userName}</strong> ({userDetails.birthPlace || 'New Delhi'}). Tap <strong>CHAT</strong> above to continue discussion with {astrologer.name}.
                  </p>
                </div>
              </div>

              {/* Render KundliView with embeddedInConsultation */}
              <div className="w-full">
                <KundliView userDetails={userDetails} embeddedInConsultation={true} />
              </div>
            </>
          ) : (
            <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center space-y-2">
              <Compass className="w-8 h-8 mx-auto text-amber-400/60" />
              <p className="text-xs font-semibold text-slate-200">Linked Birth Profile Unavailable</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                The specific birth profile associated with this session archive could not be resolved. You can still review the consultation transcript in the CHAT tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
