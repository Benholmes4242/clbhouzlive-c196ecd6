import { useState, useCallback, useEffect } from 'react';

const MUTE_STATE_KEY = 'globalAudioMuted';

export const useGlobalAudio = () => {
  // Initialize from localStorage
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MUTE_STATE_KEY);
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  // Persist to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(MUTE_STATE_KEY, JSON.stringify(isGloballyMuted));
  }, [isGloballyMuted]);
  
  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);
  
  const setGlobalMute = useCallback((muted: boolean) => {
    setIsGloballyMuted(muted);
  }, []);

  return {
    isGloballyMuted,
    toggleGlobalMute,
    setGlobalMute
  };
};