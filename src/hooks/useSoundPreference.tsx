import { useState, useCallback, useEffect } from 'react';

export const useSoundPreference = () => {
  const [isMuted, setIsMuted] = useState(true); // Default to muted

  // Persist mute state across the session
  useEffect(() => {
    const saved = sessionStorage.getItem('audio-muted');
    if (saved !== null) {
      setIsMuted(JSON.parse(saved));
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    sessionStorage.setItem('audio-muted', JSON.stringify(muted));
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setMuted(newMuted);
  }, [isMuted, setMuted]);

  return {
    isMuted,
    setMuted,
    toggleMute
  };
};