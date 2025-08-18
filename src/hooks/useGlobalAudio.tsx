import { useState, useCallback, useEffect } from 'react';

const MUTE_STATE_KEY = 'globalAudioMuted';

export const useGlobalAudio = () => {
  // Initialize from sessionStorage for session-wide persistence
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(MUTE_STATE_KEY);
      return saved ? JSON.parse(saved) : true; // Default to muted
    }
    return true;
  });
  
  // Persist to sessionStorage when state changes
  useEffect(() => {
    sessionStorage.setItem(MUTE_STATE_KEY, JSON.stringify(isGloballyMuted));
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