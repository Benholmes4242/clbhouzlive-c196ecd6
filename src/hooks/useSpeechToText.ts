 /**
  * useSpeechToText - Web Speech API hook for voice input
  * Respects browser support and gracefully degrades
  */
 import { useState, useCallback, useRef, useEffect } from 'react';
 
interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  micLevel: number;
}
 
 // Type definitions for Web Speech API (not included in standard TS lib)
 interface ISpeechRecognitionEvent extends Event {
   results: SpeechRecognitionResultList;
 }
 
 interface ISpeechRecognitionErrorEvent extends Event {
   error: string;
 }
 
 interface ISpeechRecognition extends EventTarget {
   continuous: boolean;
   interimResults: boolean;
   lang: string;
   onresult: ((event: ISpeechRecognitionEvent) => void) | null;
   onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
   onend: (() => void) | null;
   start: () => void;
   stop: () => void;
   abort: () => void;
 }
 
 interface ISpeechRecognitionConstructor {
   new (): ISpeechRecognition;
 }
 
 export function useSpeechToText(): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
 
   const isSupported = typeof window !== 'undefined' && 
     ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
 
   useEffect(() => {
     if (!isSupported) return;
 
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const SpeechRecognitionAPI: ISpeechRecognitionConstructor = 
       (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     
     const recognition = new SpeechRecognitionAPI();
     recognition.continuous = false;
     recognition.interimResults = true;
     recognition.lang = 'en-US';
 
     recognition.onresult = (event: ISpeechRecognitionEvent) => {
       const current = event.results[event.results.length - 1];
       setTranscript(current[0].transcript);
     };
 
     recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
       if (event.error === 'not-allowed') {
         setError('Microphone permission denied');
       } else if (event.error === 'no-speech') {
         setError(null); // Silently handle no speech
       } else {
         setError('Voice input failed. Please try again.');
       }
       setIsListening(false);
     };
 
     recognition.onend = () => {
       setIsListening(false);
     };
 
     recognitionRef.current = recognition;
 
     return () => {
       recognition.abort();
     };
   }, [isSupported]);
 
   const startListening = useCallback(() => {
     if (!recognitionRef.current) return;
     setError(null);
     setTranscript('');
     try {
       recognitionRef.current.start();
       setIsListening(true);
     } catch {
       setError('Could not start voice input');
     }
   }, []);
 
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  // Track mic amplitude while listening, smoothed to 0–1
  useEffect(() => {
    if (!isListening) {
      setMicLevel(0);
      return;
    }

    let rafId = 0;
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtx = new Ctx();
        const source = audioCtx.createMediaStreamSource(s);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          setMicLevel((prev) => prev * 0.7 + avg * 0.3);
          rafId = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        // Permission denied or unavailable — silently ignore amplitude tracking
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
      setMicLevel(0);
    };
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, isSupported, error, micLevel };
}