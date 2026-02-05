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
 
   return { isListening, transcript, startListening, stopListening, isSupported, error };
 }