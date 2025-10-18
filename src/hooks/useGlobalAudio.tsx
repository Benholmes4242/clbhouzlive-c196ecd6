import { useState, useCallback, useEffect } from 'react';

const MUTE_STATE_KEY = 'globalAudioMuted'; // Using sessionStorage for session-only persistence

export const useGlobalAudio = () => {
  // Initialize from sessionStorage - default to muted for each new session
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(MUTE_STATE_KEY);
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  
  // Persist to sessionStorage when state changes (only for current session)
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