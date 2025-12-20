import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'clbhouz_videos_autoplay_upnext';

/**
 * Hook to manage autoplay preference for video Up Next
 * Persists to localStorage
 */
export function useAutoplayPreference() {
  const [autoplayEnabled, setAutoplayEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to ON if not set
    return stored !== '0';
  });

  // Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, autoplayEnabled ? '1' : '0');
  }, [autoplayEnabled]);

  const setAutoplayEnabled = useCallback((value: boolean) => {
    setAutoplayEnabledState(value);
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplayEnabledState(prev => !prev);
  }, []);

  return {
    autoplayEnabled,
    setAutoplayEnabled,
    toggleAutoplay,
  };
}
