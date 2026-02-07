import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

interface GlobalAudioContextType {
  isGloballyMuted: boolean;
  setGlobalMute: (muted: boolean) => void;
  toggleGlobalMute: () => void;
  activeVideoId: string | null;
  setActiveVideo: (videoId: string | null) => void;
  isVideoActive: (videoId: string) => boolean;
}

// Provide stable default context to prevent hook order issues
const defaultContext: GlobalAudioContextType = {
  isGloballyMuted: true,
  setGlobalMute: () => {},
  toggleGlobalMute: () => {},
  activeVideoId: null,
  setActiveVideo: () => {},
  isVideoActive: () => false,
  // Flag to detect when default context is being used
  __isDefault: true
} as GlobalAudioContextType & { __isDefault?: boolean };

const GlobalAudioContext = createContext<GlobalAudioContextType>(defaultContext);

const AUDIO_STATE_KEY = 'globalAudioState';

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from sessionStorage or default to muted
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    try {
      const savedState = sessionStorage.getItem(AUDIO_STATE_KEY);
      if (savedState !== null) {
        return JSON.parse(savedState);
      }
    } catch {
      // Ignore parse errors
    }
    return true; // Default to muted
  });

  // Track which video is currently playing audio
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(AUDIO_STATE_KEY, JSON.stringify(isGloballyMuted));
    } catch {
      // Ignore storage errors
    }
  }, [isGloballyMuted]);

  // Clean up legacy storage key from deleted useGlobalAudio hook
  useEffect(() => {
    try { sessionStorage.removeItem('globalAudioMuted'); } catch {}
  }, []);

  const setGlobalMute = useCallback((muted: boolean) => {
    setIsGloballyMuted(muted);
  }, []);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  const setActiveVideo = useCallback((videoId: string | null) => {
    setActiveVideoId(videoId);
  }, []);

  const isVideoActive = useCallback((videoId: string) => {
    return activeVideoId === videoId;
  }, [activeVideoId]);

  const value = useMemo(
    () => ({
      isGloballyMuted,
      setGlobalMute,
      toggleGlobalMute,
      activeVideoId,
      setActiveVideo,
      isVideoActive
    }),
    [isGloballyMuted, setGlobalMute, toggleGlobalMute, activeVideoId, setActiveVideo, isVideoActive]
  );

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  
  // Return context directly - it has safe defaults even outside provider
  return context;
};