import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Compass, 
  FileText, 
  Send, 
  X, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  PhoneCall,
  Clock,
  Globe,
  Languages,
  Loader2,
  Archive
} from 'lucide-react';
import { DemoClient, UserBirthDetails, ConsultationRecord, PersistentBirthProfile } from '../../types';
import { KundliView } from '../dashboard/KundliView';
import { translationService } from '../../services/translationService';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/auth/authService';
import { birthProfileService } from '../../services/birthProfileService';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface AstrologerConsultationScreenProps {
  client?: DemoClient;
  consultation?: ConsultationRecord;
  onBack: () => void;
  onEndConsultation: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'astrologer' | 'client';
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

export const AstrologerConsultationScreen: React.FC<AstrologerConsultationScreenProps> = ({
  client,
  consultation,
  onBack,
  onEndConsultation,
}) => {
  const { t } = useTranslation();
  // Required 3-tab in-consultation switcher: CHAT -> KUNDLI -> NOTES
  const [consultationTab, setConsultationTab] = useState<'chat' | 'kundli' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [privateNotes, setPrivateNotes] = useState(client?.notes || '');
  const [savedNotesNotice, setSavedNotesNotice] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi'>('hi');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [resolvedBirthDetails, setResolvedBirthDetails] = useState<UserBirthDetails | null>(null);
  const [birthLoading, setBirthLoading] = useState<boolean>(false);

  const clientName = consultation?.userName || client?.name || 'Client';
  const isReadOnly = Boolean(
    consultation?.status === 'COMPLETED' || 
    consultation?.status === 'CANCELLED' || 
    consultation?.status === 'REJECTED'
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 1. Load Messages via chatService if real consultation is bound
  useEffect(() => {
    let isMounted = true;
    const loadSessionMessages = async () => {
      const currentUser = authService.getCurrentUser();
      if (consultation?.id && currentUser) {
        setLoadingMessages(true);
        try {
          const res = await chatService.getMessagesForConsultation(currentUser, consultation.id);
          if (res.success && isMounted) {
            const formatted: ChatMessage[] = res.data.map((m) => ({
              id: m.id,
              sender: m.senderRole === 'ASTROLOGER' ? 'astrologer' : 'client',
              text: m.message,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isDemo: true,
              sourceLang: m.sourceLanguage === 'hi' ? 'hi' : 'en',
              translatedText: m.translatedText,
              targetLanguage: m.targetLanguage,
              translationStatus: m.translationStatus,
            }));
            setMessages(formatted);
          }
        } catch (err) {
          console.error('Failed to load consultation messages in astrologer workspace', err);
        } finally {
          if (isMounted) setLoadingMessages(false);
        }
      } else if (client) {
        // Fallback demo client messages
        setMessages([
          {
            id: 'm-1',
            sender: 'client',
            text: 'Namaste Acharya ji! Can you review my 10th house career prospects and active Dasha period?',
            time: '10:30 AM',
            isDemo: true,
            sourceLang: 'en',
          },
          {
            id: 'm-2',
            sender: 'astrologer',
            text: `Pranam ${client.name}! I have your birth chart loaded (${client.dateOfBirth}, ${client.birthPlace}). I am inspecting your D1 Rashi and Jupiter Dasha now.`,
            time: '10:31 AM',
            isDemo: true,
            sourceLang: 'en',
          },
        ]);
      }
    };

    loadSessionMessages();
    return () => {
      isMounted = false;
    };
  }, [consultation?.id, client]);

  // 2. Resolve Linked Birth Profile for Kundli tab
  useEffect(() => {
    let isMounted = true;
    const loadBirthChart = async () => {
      const currentUser = authService.getCurrentUser();
      if (consultation?.birthProfileId && currentUser) {
        setBirthLoading(true);
        try {
          const bRes = await birthProfileService.getBirthProfileById(currentUser, consultation.birthProfileId);
          if (bRes.success && bRes.data && isMounted) {
            const p: PersistentBirthProfile = bRes.data;
            setResolvedBirthDetails({
              name: p.name,
              fullName: p.name,
              dateOfBirth: p.dateOfBirth,
              dob: p.dateOfBirth,
              birthTime: p.timeOfBirth || '12:00',
              birthTimeKnown: Boolean(p.timeOfBirth),
              timeOfBirth: p.timeOfBirth,
              birthPlace: p.birthPlace,
              latitude: p.latitude,
              longitude: p.longitude,
              timezone: p.timezone,
              gender: p.gender || 'unspecified',
              isDemoData: true,
            });
          }
        } catch (err) {
          console.error('Failed loading birth profile for astrologer workspace', err);
        } finally {
          if (isMounted) setBirthLoading(false);
        }
      } else if (client) {
        setResolvedBirthDetails({
          name: client.name,
          fullName: client.name,
          dateOfBirth: client.dateOfBirth,
          dob: client.dateOfBirth,
          birthTime: client.birthTime,
          birthTimeKnown: client.birthTimeKnown,
          birthPlace: client.birthPlace,
          city: client.city,
          state: client.state,
          country: client.country,
          latitude: client.latitude,
          longitude: client.longitude,
          timezone: client.timezone,
          gender: client.gender,
          isDemoData: true,
        });
      }
    };

    loadBirthChart();
    return () => {
      isMounted = false;
    };
  }, [consultation?.birthProfileId, client]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (consultationTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isClientTyping, consultationTab]);

  // Effect to automatically translate messages to Astrologer's preferred language
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
    if (!text || isSending || isReadOnly) return;

    setIsSending(true);
    const currentUser = authService.getCurrentUser();
    const sourceLang = translationService.detectLanguage(text);

    let createdId = `m-${Date.now()}`;
    let createdTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

    const astroMsg: ChatMessage = {
      id: createdId,
      sender: 'astrologer',
      text,
      time: createdTime,
      isDemo: true,
      sourceLang,
    };

    setMessages((prev) => [...prev, astroMsg]);
    if (!textToSend) setInputText('');
    setIsSending(false);

    if (!textToSend && inputRef.current) {
      inputRef.current.focus();
    }

    // Translate astrologer's response if preferred language differs
    if (sourceLang !== preferredLang) {
      translationService.translateMessage(text, preferredLang, sourceLang).then((res) => {
        if (res.success && res.translatedText) {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === astroMsg.id
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
  };

  const astrologerQuickPrompts = [
    'Your 10th house lord is auspiciously placed.',
    'Jupiter Mahadasha brings growth and mentorship.',
    'Saturn Antardasha encourages discipline and patience.',
    'Checking your D9 Navamsa chart alignments now.',
  ];

  const handleSavePrivateNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotesNotice(true);
    setTimeout(() => setSavedNotesNotice(false), 2000);
  };

  return (
    <div className="space-y-3 pb-24 text-slate-100">
      {/* 1. TOP HEADER: Active consultation, Client name, Status, End button */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-full bg-[#16203c] hover:bg-[#1f2c52] text-slate-300 hover:text-amber-300 transition-colors shrink-0"
              aria-label="Back to astrologer view"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-serif font-bold text-slate-100 truncate">
                  Consultation: <span className="text-amber-300">{clientName}</span>
                </h2>
                {consultation?.status ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                    consultation.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    consultation.status === 'ACTIVE' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse' :
                    consultation.status === 'CANCELLED' || consultation.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    {consultation.status}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    Demo Session
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                <span className={`flex items-center gap-1 font-medium ${isReadOnly ? 'text-slate-400' : 'text-emerald-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isReadOnly ? 'bg-slate-400' : 'bg-emerald-400 animate-pulse'}`} />
                  {isReadOnly ? 'Session Archived' : 'Live Workstation'}
                </span>
                {consultation?.topic && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{consultation.topic}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Always-visible Global Language Selector */}
            <GlobalLanguageSelector id="astrologer-workspace-lang-selector" />

            <button
              onClick={onEndConsultation}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0"
            >
              <X className="w-3 h-3 text-rose-400" />
              <span>{isReadOnly ? t('close') : t('end')}</span>
            </button>
          </div>
        </div>

        {/* Client quick details strip */}
        <div className="mt-2.5 pt-2 border-t border-[#1e2b4f]/60 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
          {resolvedBirthDetails ? (
            <span>
              DOB: <strong className="text-slate-200">{resolvedBirthDetails.dateOfBirth}</strong> ({resolvedBirthDetails.timeOfBirth || resolvedBirthDetails.birthTime})
            </span>
          ) : (
            <span>Client: <strong className="text-slate-200">{clientName}</strong></span>
          )}
          {resolvedBirthDetails?.latitude && (
            <span className="font-mono text-amber-300/80">
              {resolvedBirthDetails.latitude.toFixed(2)}°N, {resolvedBirthDetails.longitude.toFixed(2)}°E
            </span>
          )}
          <span className="text-emerald-400 font-medium">Shared Kundli Sync Active</span>
        </div>
      </div>

      {/* 2. THREE-WAY CONSULTATION TAB SWITCHER: [ CHAT ] [ KUNDLI ] [ NOTES ] */}
      <div className="flex bg-[#0c1222] p-1 rounded-xl border border-[#1e2b4f]">
        <button
          onClick={() => setConsultationTab('chat')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            consultationTab === 'chat'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t('chat').toUpperCase()}</span>
        </button>

        <button
          onClick={() => setConsultationTab('kundli')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            consultationTab === 'kundli'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{t('kundli').toUpperCase()}</span>
        </button>

        <button
          onClick={() => setConsultationTab('notes')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            consultationTab === 'notes'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>NOTES</span>
        </button>
      </div>

      {/* 3. ACTIVE VIEW AREA */}

      {/* A. CHAT VIEW */}
      {consultationTab === 'chat' && (
        <div className="flex flex-col h-[520px] rounded-2xl bg-[#0c1222] border border-[#1e2b4f] overflow-hidden shadow-xl">
          {/* Read-Only Banner or Chat Notice */}
          {isReadOnly ? (
            <div className="p-2 bg-[#111a30] border-b border-[#1e2b4f] text-center text-[10px] text-amber-300 flex items-center justify-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Session Concluded ({consultation?.status}) • Viewing Archived Message Transcript</span>
            </div>
          ) : (
            <div className="p-2 bg-amber-400/10 border-b border-amber-400/20 text-center text-[10px] text-amber-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Astrologer Console Chat • Synchronized Session</span>
            </div>
          )}

          {/* Astrologer Language Preference Control Bar */}
          <div className="px-3 py-1.5 bg-[#070b14] border-b border-[#1e2b4f] flex items-center justify-between text-[11px] shrink-0">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Astrologer Reading Language:</span>
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

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto text-xs">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span className="text-xs">Loading consultation messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-1.5 text-center">
                <MessageSquare className="w-7 h-7 text-slate-600" />
                <p className="text-xs">No messages recorded in this consultation.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isAstro = m.sender === 'astrologer';
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
                    className={`flex flex-col ${isAstro ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {isAstro ? 'You (Astrologer)' : clientName}
                      </span>
                      <span>•</span>
                      <span>{m.time}</span>

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
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[85%] break-words relative ${
                        isAstro
                          ? 'bg-amber-400 text-slate-950 font-medium rounded-br-xs shadow-md shadow-amber-500/15'
                          : 'bg-[#101930] text-slate-100 border border-[#1e2b4f] rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{displayText}</p>

                      {/* Toggle translation view */}
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

            {isClientTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
                <span>{clientName} is typing...</span>
                <span className="flex gap-1 items-center">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (Astrologer replies) */}
          {!isReadOnly && (
            <div className="p-2 bg-[#070b14] border-t border-[#1e2b4f] overflow-x-auto scrollbar-none flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">Vedic Notes:</span>
              {astrologerQuickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="text-[10.5px] px-2.5 py-1 rounded-lg bg-[#16203c] hover:bg-[#1f2c52] border border-[#1e2b4f] hover:border-amber-400/40 text-amber-300/90 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area or Read-Only Notice */}
          {isReadOnly ? (
            <div className="p-3 bg-[#070b14] border-t border-[#1e2b4f] text-center text-xs text-slate-400">
              <p className="font-semibold text-amber-300 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Concluded • Message Composer Disabled</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                This consultation record is archived. All conversation transcripts are preserved in read-only mode.
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-[#070b14] border-t border-[#1e2b4f] flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                placeholder={`Type astrological guidance for ${clientName}...`}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0c1222] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* B. KUNDLI VIEW */}
      {consultationTab === 'kundli' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#101930] to-[#0c1222] border border-amber-400/30 text-xs text-slate-200 flex items-start gap-2.5 shadow-md">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">Synchronized Client Vedic Chart</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Inspecting birth chart for <strong>{clientName}</strong>. Tap <strong>CHAT</strong> above to continue guidance.
              </p>
            </div>
          </div>

          {birthLoading ? (
            <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300">Loading client birth chart...</p>
            </div>
          ) : resolvedBirthDetails && (resolvedBirthDetails.dateOfBirth || resolvedBirthDetails.dob) ? (
            <div className="w-full">
              <KundliView userDetails={resolvedBirthDetails} embeddedInConsultation={true} />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Linked Birth Profile Unavailable</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                The specific birth profile associated with this session archive could not be resolved.
              </p>
            </div>
          )}
        </div>
      )}

      {/* C. PRIVATE NOTES VIEW */}
      {consultationTab === 'notes' && (
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-100">Astrologer Confidential Notes</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Private to Astrologer</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Record planetary observations, suggested remedies (Upayas), or follow-up timelines for {clientName}.
          </p>

          <form onSubmit={handleSavePrivateNotes} className="space-y-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              rows={6}
              placeholder="E.g. Exalted Jupiter in 9th house indicates strong natural inclinations toward leadership. Advised Ruby/Yellow Sapphire gemstone consult..."
              className="w-full p-3 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
            />

            <div className="flex items-center justify-between">
              {savedNotesNotice ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Notes saved locally for demo session</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Auto-saved to consultation draft</span>
              )}

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
