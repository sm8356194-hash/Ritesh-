import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowLeft, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Sun, 
  Moon, 
  Clock, 
  HelpCircle,
  ShieldCheck,
  Star
} from 'lucide-react';
import { UserBirthDetails, DashboardSection } from '../../types';
import { calculateBirthChart } from '../../services/astrologyEngine';
import { 
  generateAstrologyResponse, 
  SUGGESTED_QUESTIONS, 
  DEFAULT_CHART_CONTEXT,
  BirthChartContext 
} from '../../services/aiAstrologerService';

interface AiAstrologerViewProps {
  userDetails: UserBirthDetails;
  onBack: () => void;
  onNavigateSection?: (section: DashboardSection) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAstrologerView: React.FC<AiAstrologerViewProps> = ({ 
  userDetails, 
  onBack, 
  onNavigateSection 
}) => {
  // Obtain standard chart data from centralized astrologyEngine
  const birthChartData = calculateBirthChart(userDetails);

  // Chart context for the user profile header display
  const chartContext: BirthChartContext = {
    sunSign: birthChartData.planets.find(p => p.name === 'Sun')?.sign || 'Leo (Simha)',
    moonSign: birthChartData.moonSign?.sign || 'Taurus (Vrishabha) - Exalted',
    ascendant: `${birthChartData.lagna?.sign || 'Leo (Simha)'} ${birthChartData.lagna?.degree || "28° 14'"}`,
    nakshatra: `${birthChartData.nakshatra?.name || 'Rohini'} (Pada ${birthChartData.nakshatra?.pada || 2})`,
    currentDasha: `${birthChartData.dasha?.mahadasha || 'Jupiter'} - ${birthChartData.dasha?.antardasha || 'Saturn'} (Active)`,
    userName: userDetails.fullName || userDetails.name || 'Demo Profile',
  };

  const [isChartContextOpen, setIsChartContextOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Namaste ${chartContext.userName}! I am your AI Astrologer demo guide. In traditional Vedic astrology, your birth chart serves as a contemplative mirror to explore life's archetypal themes.\n\nHow may I assist your reflection today? You can select any suggested question below or type your own topic.`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) {
      setInputQuery('');
    }
    setIsTyping(true);

    // Simulated response delay (600ms - 900ms) for realistic natural conversation flow
    setTimeout(() => {
      const aiReply = generateAstrologyResponse(query, birthChartData);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 750);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Chat cleared. Welcome back, ${chartContext.userName}! Explore traditional Vedic astrology interpretations using your birth profile. Tap any suggested question below to begin.`,
        timestamp: 'Just now',
      },
    ]);
    setInputQuery('');
  };

  return (
    <div className="flex flex-col min-h-[82vh] max-w-md mx-auto pb-24 text-slate-100">
      {/* 1. Header */}
      <div className="sticky top-14 z-30 bg-[#0c1222]/95 backdrop-blur-md border-b border-[#1e2b4f] px-3 py-2.5 rounded-2xl shadow-lg mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              id="ai-astrologer-back-btn"
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-[#16203c] transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-serif font-bold text-slate-100">
                  AI Astrologer
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  DEMO AI
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 tracking-wide font-sans">
                Personalized guidance based on your birth chart
              </p>
            </div>
          </div>

          {/* Clear Chat Option */}
          <button
            id="clear-chat-btn"
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-[#1e2b4f] hover:border-rose-500/30 transition-all"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* 5. Birth Chart Context (Expandable) */}
      <div className="mb-3 rounded-2xl bg-[#0c1222] border border-[#1e2b4f] overflow-hidden shadow-md">
        <button
          id="toggle-chart-context-btn"
          onClick={() => setIsChartContextOpen(!isChartContextOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[#101930] hover:bg-[#16203c] transition-colors text-left"
          aria-expanded={isChartContextOpen}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-400/20 text-amber-300">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">My Chart Context</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300/90 border border-amber-400/25 font-medium">
              DEMO / SAMPLE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400/80">
            <span>{isChartContextOpen ? 'Hide' : 'View'}</span>
            {isChartContextOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isChartContextOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#1e2b4f]/60 bg-[#090e1a] p-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="p-2 rounded-xl bg-[#101930] border border-[#1e2b4f]/60">
                  <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Sun Sign</span>
                  </div>
                  <p className="font-semibold text-slate-100">{chartContext.sunSign}</p>
                </div>

                <div className="p-2 rounded-xl bg-[#101930] border border-[#1e2b4f]/60">
                  <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
                    <Moon className="w-3 h-3 text-amber-400" />
                    <span>Moon Sign</span>
                  </div>
                  <p className="font-semibold text-slate-100">{chartContext.moonSign}</p>
                </div>

                <div className="p-2 rounded-xl bg-[#101930] border border-[#1e2b4f]/60">
                  <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Ascendant (Lagna)</span>
                  </div>
                  <p className="font-semibold text-slate-100">{chartContext.ascendant}</p>
                </div>

                <div className="p-2 rounded-xl bg-[#101930] border border-[#1e2b4f]/60">
                  <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span>Nakshatra</span>
                  </div>
                  <p className="font-semibold text-slate-100">{chartContext.nakshatra}</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#101930] border border-[#1e2b4f]/60 mb-2">
                <div className="flex items-center gap-1 text-[10px] text-amber-300/80 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Current Dasha</span>
                </div>
                <p className="font-semibold text-slate-100">{chartContext.currentDasha}</p>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic">
                Sample profile values for demonstration • Live ephemeris engine not connected
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Welcome Section */}
      <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#101930] via-[#0d1426] to-[#070b14] border border-amber-500/20 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#b48c26] to-[#fde047] p-0.5 shrink-0 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1.5">
              <span>Ask the Stars</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Explore traditional Vedic astrology interpretations using your birth profile.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Suggested Questions */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            Suggested Questions:
          </span>
          <span className="text-[10px] text-slate-400">Tap to ask</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((question, idx) => (
            <button
              key={idx}
              id={`suggested-q-${idx}`}
              onClick={() => handleSend(question)}
              disabled={isTyping}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#101930] hover:bg-[#16203c] active:scale-95 text-slate-200 hover:text-amber-300 border border-[#1e2b4f] hover:border-amber-400/40 text-[11px] font-medium transition-all shadow-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Interface: Message Stream */}
      <div className="flex-1 rounded-2xl bg-[#080d19] border border-[#1e2b4f]/70 p-3.5 space-y-3.5 overflow-y-auto min-h-[300px] max-h-[50vh] shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[90%]">
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-medium rounded-br-sm shadow-md'
                    : 'bg-[#101930] text-slate-200 border border-[#1e2b4f] rounded-bl-sm shadow-sm'
                }`}
              >
                {/* Format paragraphs */}
                <div className="space-y-2 whitespace-pre-line">
                  {msg.text}
                </div>

                {msg.sender === 'ai' && (
                  <div className="mt-2 pt-1.5 border-t border-[#1e2b4f]/70 flex items-center justify-between text-[10px] text-amber-300/70">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400/80" />
                      Traditional Guidance
                    </span>
                    <span>Sample Demo</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[9px] text-slate-500 px-8 mt-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Typing / Loading indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-amber-300/90 p-2.5 bg-[#101930] rounded-xl w-max border border-[#1e2b4f]">
            <Bot className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px]">Consulting traditional Vedic interpretations...</span>
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Interface: Input Bar */}
      <div className="mt-3 p-2 bg-[#0c1222] border border-[#1e2b4f] rounded-2xl shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            id="ai-astrologer-input"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about your birth chart, themes, or dasha..."
            disabled={isTyping}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1e2b4f] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            id="ai-astrologer-send-btn"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-amber-500/20"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[9.5px] text-slate-500 text-center mt-1.5 px-2">
          Interpretive traditional Vedic guidance only • Not predictive, medical, or financial advice
        </p>
      </div>
    </div>
  );
};
