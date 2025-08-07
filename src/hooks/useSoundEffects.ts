import { useState, useCallback, useRef, useEffect } from 'react';

export const useSoundEffects = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Get from localStorage or default to true
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API context
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('soundEffectsEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const createTone = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    if (!audioContextRef.current || !isSoundEnabled) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [isSoundEnabled]);

  const playUnlockSound = useCallback(() => {
    if (!isSoundEnabled) return;

    // Play a celebratory chord progression
    setTimeout(() => createTone(523.25, 0.2, 0.1), 0);    // C5
    setTimeout(() => createTone(659.25, 0.2, 0.08), 100); // E5
    setTimeout(() => createTone(783.99, 0.3, 0.1), 200);  // G5
    setTimeout(() => createTone(1046.5, 0.4, 0.12), 300); // C6
  }, [createTone, isSoundEnabled]);

  const playClickSound = useCallback(() => {
    if (!isSoundEnabled) return;
    createTone(800, 0.1, 0.05);
  }, [createTone, isSoundEnabled]);

  const playErrorSound = useCallback(() => {
    if (!isSoundEnabled) return;
    createTone(200, 0.3, 0.08);
  }, [createTone, isSoundEnabled]);

  const playSuccessSound = useCallback(() => {
    if (!isSoundEnabled) return;
    setTimeout(() => createTone(659.25, 0.15, 0.08), 0);   // E5
    setTimeout(() => createTone(783.99, 0.2, 0.1), 150);   // G5
  }, [createTone, isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return {
    isSoundEnabled,
    toggleSound,
    playUnlockSound,
    playClickSound,
    playErrorSound,
    playSuccessSound
  };
};