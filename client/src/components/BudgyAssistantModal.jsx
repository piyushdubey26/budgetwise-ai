import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  PieChart,
  Wallet,
  Zap,
  Radio,
  RotateCcw,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useBudgyVoice } from '../hooks/useBudgyVoice.js';

export default function BudgyAssistantModal({ onRefreshData }) {
  const { token, user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const chatEndRef = useRef(null);

  const {
    status,
    transcript,
    interimTranscript,
    lastResponse,
    errorMessage,
    isWakeWordEnabled,
    isMuted,
    isSpeechSupported,
    conversationHistory,
    pendingConfirmation,
    startListening,
    stopListening,
    toggleWakeWord,
    setIsMuted,
    sendCommandToAgent,
    resetState
  } = useBudgyVoice({
    token,
    onActionComplete: (data) => {
      if (onRefreshData) onRefreshData();
    }
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, transcript, interimTranscript, lastResponse]);

  // Handle manual text submission (shared unified pipeline)
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput.trim();
    setTextInput('');
    sendCommandToAgent(msg);
  };

  const handleQuickPrompt = (prompt) => {
    sendCommandToAgent(prompt);
  };

  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

  return (
    <>
      {/* =========================================================================
          1. FLOATING BUDGY TRIGGER BUTTON (ALWAYS VISIBLE)
          ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5">
        
        {/* Active Wake-Word Pill Status */}
        {isWakeWordEnabled && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 shadow-lg text-[11px] text-emerald-300 font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>"Hey Budgy" Listening</span>
          </motion.div>
        )}

        {/* Floating Orb Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(true);
            if (status === 'idle') startListening();
          }}
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] border border-white/25 cursor-pointer flex items-center justify-center transition-all overflow-hidden"
          title="Budgy Voice Assistant"
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 group-hover:opacity-40 animate-pulse" />
          
          <div className="relative z-10 flex items-center gap-2">
            <Mic className="h-5 w-5 text-white animate-bounce" />
            <span className="hidden md:inline font-display font-bold text-xs tracking-wide">
              Budgy Voice
            </span>
          </div>
        </motion.button>
      </div>

      {/* =========================================================================
          2. BUDGY FULL VOICE ASSISTANT MODAL (FROSTED GLASS)
          ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
            
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg h-[90vh] sm:h-[650px] max-h-[700px] flex flex-col rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative"
              style={{
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(32px) saturate(190%)',
                WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)'
              }}
            >
              
              {/* TOP HEADER */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/25 border border-white/20">
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-extrabold text-base text-white tracking-tight">
                        Budgy AI
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/20">
                        Voice Agent
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300/80">
                      Say <strong className="text-white">"Hey Budgy"</strong> or speak a financial command
                    </p>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-2">
                  
                  {/* Wake Word Toggle */}
                  <button
                    onClick={toggleWakeWord}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isWakeWordEnabled
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title={isWakeWordEnabled ? "Wake word active ('Hey Budgy')" : "Enable wake word listener"}
                  >
                    <Radio className={`h-4 w-4 ${isWakeWordEnabled ? 'animate-pulse text-emerald-400' : ''}`} />
                    <span className="hidden sm:inline text-[10px]">
                      {isWakeWordEnabled ? 'Wake: ON' : 'Wake: OFF'}
                    </span>
                  </button>

                  {/* Audio Mute Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title={isMuted ? "Unmute Spoken Responses" : "Mute Spoken Responses"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-blue-400" />}
                  </button>

                  {/* Close Modal */}
                  <button
                    onClick={() => {
                      stopListening();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* CENTER CONVERSATION & VISUALIZER BODY */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-none">
                
                {/* 1. Dynamic Interactive Soundwave Orb */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative flex items-center justify-center">
                    
                    {/* Pulsing waves */}
                    {isListening && (
                      <>
                        <motion.span 
                          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }} 
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                          className="absolute w-28 h-28 rounded-full bg-blue-500/25 filter blur-sm" 
                        />
                        <motion.span 
                          animate={{ scale: [1, 2.3, 1], opacity: [0.4, 0, 0.4] }} 
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          className="absolute w-28 h-28 rounded-full bg-indigo-500/20 filter blur-md" 
                        />
                      </>
                    )}

                    {isThinking && (
                      <motion.span 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute w-24 h-24 rounded-full border-2 border-dashed border-amber-400/50" 
                      />
                    )}

                    {/* Core Orb */}
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all border-2 ${
                        isListening
                          ? 'bg-gradient-to-tr from-rose-500 to-pink-600 border-white/40 shadow-rose-500/30 scale-105'
                          : isThinking
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-600 border-white/40 shadow-amber-500/30'
                          : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 border-white/30 shadow-blue-500/30 hover:scale-105'
                      }`}
                    >
                      {isListening ? (
                        <Mic className="h-8 w-8 text-white animate-pulse" />
                      ) : isThinking ? (
                        <Sparkles className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Mic className="h-8 w-8 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Status Caption */}
                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-white tracking-wide">
                      {isListening
                        ? '🎙️ Listening... Speak your command'
                        : isThinking
                        ? '⚡ Budgy is understanding & executing...'
                        : status === 'confirming'
                        ? '⚠️ Confirmation Required'
                        : status === 'success'
                        ? '✓ Action Completed Successfully'
                        : 'Tap the Mic or say "Hey Budgy"'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      English • Hindi • Hinglish supported
                    </p>
                  </div>
                </div>

                {/* 2. Real-time Live Speech Transcript Bubble */}
                {(transcript || interimTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-blue-600/15 border border-blue-400/30 text-xs text-blue-200 backdrop-blur-md flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4 text-blue-400 shrink-0 animate-pulse" />
                    <span>"{transcript || interimTranscript}"</span>
                  </motion.div>
                )}

                {/* 3. Error Alert */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 backdrop-blur-md flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* 4. Structured UI Response Card */}
                {lastResponse?.uiCard && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-white/15 backdrop-blur-xl shadow-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {lastResponse.uiCard.type.includes('expense') ? (
                          <TrendingDown className="h-4 w-4 text-rose-400" />
                        ) : lastResponse.uiCard.type.includes('income') ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Wallet className="h-4 w-4 text-blue-400" />
                        )}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {lastResponse.uiCard.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Synchronized
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
                      <span className="text-sm font-semibold text-slate-200">
                        {lastResponse.uiCard.title || lastResponse.uiCard.category || 'Transaction'}
                      </span>
                      {lastResponse.uiCard.amount && (
                        <span className="text-base font-extrabold text-white">
                          ₹{lastResponse.uiCard.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{lastResponse.spokenResponse}"
                    </p>
                  </motion.div>
                )}

                {/* 5. Destructive Action Confirmation Prompt */}
                {status === 'confirming' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 backdrop-blur-md space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                      <span className="font-bold">Dangerous Action Confirmation</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {lastResponse?.textResponse || "Are you sure you want to proceed with this deletion?"}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => sendCommandToAgent('yes')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Yes, Confirm
                      </button>
                      <button
                        onClick={() => {
                          resetState();
                          sendCommandToAgent('no');
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 6. Quick Financial Suggestion Chips */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Quick Commands
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "I spent 100 on samosas",
                      "Add 500 for dinner yesterday",
                      "How much did I spend on food?",
                      "What is my remaining budget?",
                      "What is my balance?",
                      "Delete my last expense"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-[11px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-left"
                      >
                        <span>{prompt}</span>
                        <ArrowRight className="h-3 w-3 text-blue-400 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                <div ref={chatEndRef} />
              </div>

              {/* BOTTOM UNIFIED INPUT BAR (TEXT + VOICE) */}
              <div className="p-4 border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
                <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type or speak a command (e.g. Spent 200 on fuel)..."
                    className="flex-1 bg-slate-900/70 border border-white/15 focus:border-blue-400 focus:bg-slate-900/90 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-400/70 focus:outline-none transition-all shadow-inner"
                  />
                  
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
                      isListening
                        ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                        : 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200'
                    }`}
                    title={isListening ? "Stop listening" : "Click to Speak"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer border border-white/20"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
