import { useState, useEffect } from 'react';

const SOUND_PREFERENCE_KEY = 'video_sound_preference';

export interface SoundPreference {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

export const useSoundPreference = (): SoundPreference => {
  const [isMuted, setIsMuted] = useState(true); // Default to muted

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOUND_PREFERENCE_KEY);
      if (stored !== null) {
        setIsMuted(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load sound preference from localStorage:', error);
      // Fall back to default (muted)
      setIsMuted(true);
    }
  }, []);

  // Save preference to localStorage whenever it changes
  const setMuted = (muted: boolean) => {
    setIsMuted(muted);
    try {
      localStorage.setItem(SOUND_PREFERENCE_KEY, JSON.stringify(muted));
    } catch (error) {
      console.warn('Failed to save sound preference to localStorage:', error);
    }
  };

  const toggleMute = () => {
    setMuted(!isMuted);
  };

  return {
    isMuted,
    setMuted,
    toggleMute
  };
};