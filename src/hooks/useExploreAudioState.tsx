import { useState, useEffect, useCallback } from 'react';

const EXPLORE_AUDIO_PREFERENCE_KEY = 'explore-audio-preference';

/**
 * Hook to manage audio state for the Explore page full-screen modal
 * Persists mute/unmute preference for the session duration
 */
export const useExploreAudioState = () => {
  // Initialize from sessionStorage or default to muted
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const stored = sessionStorage.getItem(EXPLORE_AUDIO_PREFERENCE_KEY);
      return stored ? JSON.parse(stored) : true; // Default to muted
    } catch {
      return true; // Default to muted on error
    }
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(EXPLORE_AUDIO_PREFERENCE_KEY, JSON.stringify(isMuted));
    } catch (error) {
      console.warn('Could not save audio preference to sessionStorage:', error);
    }
  }, [isMuted]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Force set mute state (for external control)
  const setMute = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  // Reset to default muted state (for cleanup)
  const resetToDefault = useCallback(() => {
    setIsMuted(true);
    try {
      sessionStorage.removeItem(EXPLORE_AUDIO_PREFERENCE_KEY);
    } catch (error) {
      console.warn('Could not clear audio preference from sessionStorage:', error);
    }
  }, []);

  return {
    isMuted,
    toggleMute,
    setMute,
    resetToDefault
  };
};