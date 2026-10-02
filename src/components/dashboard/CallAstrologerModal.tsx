import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Sparkles, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { Astrologer } from '../../types';

interface CallModalProps {
  astrologer: Astrologer;
  onEndCall: () => void;
}

export const CallAstrologerModal: React.FC<CallModalProps> = ({ astrologer, onEndCall }) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected'>('connecting');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Call connection simulation
  useEffect(() => {
    const t1 = setTimeout(() => setCallStatus('ringing'), 1000);
    const t2 = setTimeout(() => setCallStatus('connected'), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Timer while connected
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#0c1222] border border-amber-500/40 p-6 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden min-h-[500px]"
      >
        {/* Decorative background pulsing rings */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />

        {/* Top Header info */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            <span className="text-[10px] font-medium">Simulated Audio Call Demo</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16203c] text-amber-300 border border-amber-500/20">
            Est. ₹{astrologer.perMinuteCharge}/min (Demo)
          </span>
        </div>

        {/* Center Astrologer Avatar & Pulse */}
        <div className="flex flex-col items-center my-auto">
          <div className="relative mb-5">
            {/* Animated Sound Wave Rings */}
            {callStatus === 'connected' && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping opacity-60" />
                <div className="absolute -inset-3 rounded-full border border-amber-400/20 animate-pulse" />
              </>
            )}

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-1 shadow-xl shadow-amber-500/20">
              <div className="w-full h-full rounded-full bg-[#111a30] flex items-center justify-center text-3xl font-serif font-bold text-amber-300">
                {astrologer.name.charAt(0)}
              </div>
            </div>
          </div>

          <h3 className="text-base font-serif font-bold text-slate-100 text-center">
            {astrologer.name}
          </h3>
          <p className="text-xs text-amber-300/80 text-center mt-0.5">
            {astrologer.title}
          </p>

          {/* Call Status / Timer */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16203c] border border-amber-500/20 text-xs">
            {callStatus === 'connecting' && (
              <span className="text-slate-300 animate-pulse">Connecting call preview...</span>
            )}
            {callStatus === 'ringing' && (
              <span className="text-amber-300 animate-bounce">Simulating connection...</span>
            )}
            {callStatus === 'connected' && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {callStatus === 'connected' && (
            <p className="text-[11px] text-slate-400 text-center mt-3 max-w-[240px] leading-relaxed">
              Interactive audio call preview. Live consultations with astrologers are coming soon.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full pt-4 space-y-4">
          <div className="flex items-center justify-center gap-6">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                  : 'bg-[#16203c] border border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
              title="End Consultation"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSpeakerOn
                  ? 'bg-amber-400/20 border border-amber-400 text-amber-300'
                  : 'bg-[#16203c] border border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-500">
            Tap the red phone button to exit this call simulation demo.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
