import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export function useNovaVoice({ onActionComplete, token } = {}) {
  // States: 'idle' | 'wake_word_active' | 'listening' | 'thinking' | 'confirming' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Check browser support
  const isSpeechSupported = typeof window !== 'undefined' && 
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Speak response using Web Speech Synthesis
  const speak = useCallback((text) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Pick best English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Execute command to Nova AI Backend
  const sendCommandToAgent = useCallback(async (commandText) => {
    if (!commandText || commandText.trim() === '' || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setStatus('thinking');
    setErrorMessage('');

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/ai/nova-agent', {
        message: commandText,
        conversationHistory: conversationHistory.slice(-4),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        currency: 'INR'
      }, { headers });

      const data = res.data;
      setLastResponse(data);

      // Update Conversation Context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: commandText },
        { role: 'assistant', content: data.textResponse || data.spokenResponse }
      ]);

      // Speak feedback
      if (data.spokenResponse) {
        speak(data.spokenResponse);
      }

      if (data.action === 'require_confirmation') {
        setStatus('confirming');
        setPendingConfirmation(data.confirmationToken || 'confirm');
      } else if (data.success) {
        setStatus('success');
        if (onActionComplete) onActionComplete(data);
      } else {
        setStatus(data.requiresClarification ? 'idle' : 'error');
      }

    } catch (err) {
      console.error('Nova Agent API Error:', err);
      const errTxt = err.response?.data?.message || "I couldn't process that command right now. Please try again.";
      setErrorMessage(errTxt);
      setStatus('error');
      speak(errTxt);
    } finally {
      isProcessingRef.current = false;
    }
  }, [conversationHistory, token, speak, onActionComplete]);

  // Initialize and start direct command listening
  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your command.');
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Stop wake-word listener if active
    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.stop(); } catch {}
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // Indian English handles Hindi & Hinglish smoothly

    rec.onstart = () => {
      setStatus('listening');
      setTranscript('');
      setInterimTranscript('');
      setErrorMessage('');
    };

    rec.onresult = (event) => {
      let finalTxt = '';
      let interimTxt = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTxt += event.results[i][0].transcript;
        } else {
          interimTxt += event.results[i][0].transcript;
        }
      }

      if (finalTxt) {
        setTranscript(finalTxt);
        // Strip wake phrase if user said "Hey Nova ..."
        const cleanCommand = finalTxt.replace(/^(hey|hi|hello|ok|okay)?\s*nova\s*,?\s*/i, '').trim();
        sendCommandToAgent(cleanCommand || finalTxt);
      } else {
        setInterimTranscript(interimTxt);
      }
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setErrorMessage(`Microphone error: ${event.error}`);
        setStatus('error');
      } else {
        setStatus('idle');
      }
    };

    rec.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
      if (isWakeWordEnabled) {
        startWakeWordListener();
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [isSpeechSupported, isWakeWordEnabled, status, sendCommandToAgent]);

  // Stop manual listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setStatus('idle');
  }, []);

  // Continuous Wake-Word Background Listener for "Hey Nova" / "Nova"
  const startWakeWordListener = useCallback(() => {
    if (!isSpeechSupported || !isWakeWordEnabled) return;

    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const wakeRec = new SpeechRec();
      wakeRec.continuous = true;
      wakeRec.interimResults = true;
      wakeRec.lang = 'en-IN';

      wakeRec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const phrase = event.results[i][0].transcript.toLowerCase();
          
          if (/hey\s*nova|hai\s*nova|ok\s*nova|okay\s*nova|\bnova\b/i.test(phrase)) {
            console.log('🎙️ Wake word "Hey Nova" detected!');
            try { wakeRec.stop(); } catch {}
            
            const match = phrase.match(/(?:hey|hai|ok|okay)?\s*nova\s*,?\s*(.*)/i);
            const remainder = match ? match[1].trim() : '';

            if (remainder.length > 3) {
              setTranscript(remainder);
              sendCommandToAgent(remainder);
            } else {
              startListening();
            }
            return;
          }
        }
      };

      wakeRec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          setIsWakeWordEnabled(false);
          setErrorMessage('Microphone access denied for wake word listening.');
        }
      };

      wakeRec.onend = () => {
        if (isWakeWordEnabled && status === 'idle') {
          try { wakeRec.start(); } catch {}
        }
      };

      wakeWordRecognitionRef.current = wakeRec;
      wakeRec.start();
      setStatus('wake_word_active');
    } catch (err) {
      console.warn('Wake word init error:', err);
    }
  }, [isSpeechSupported, isWakeWordEnabled, status, sendCommandToAgent, startListening]);

  // Toggle Wake-Word detection
  const toggleWakeWord = useCallback(() => {
    if (!isWakeWordEnabled) {
      setIsWakeWordEnabled(true);
      setStatus('wake_word_active');
    } else {
      setIsWakeWordEnabled(false);
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.stop(); } catch {}
      }
      setStatus('idle');
    }
  }, [isWakeWordEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
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
    resetState: () => {
      setStatus('idle');
      setTranscript('');
      setInterimTranscript('');
      setLastResponse(null);
      setErrorMessage('');
    }
  };
}
