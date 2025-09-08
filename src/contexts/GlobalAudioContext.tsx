import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  isVideoActive: () => false
};

const GlobalAudioContext = createContext<GlobalAudioContextType>(defaultContext);

const AUDIO_STATE_KEY = 'globalAudioState';

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from sessionStorage or default to muted
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    try {
      const savedState = sessionStorage.getItem(AUDIO_STATE_KEY);
      if (savedState !== null) {
        const parsed = JSON.parse(savedState);
        console.log('🔊 Restored audio state from session:', parsed ? 'MUTED' : 'UNMUTED');
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse saved audio state:', error);
    }
    // Default to muted for fresh visits
    console.log('🔊 Fresh visit - defaulting to MUTED');
    return true;
  });

  // Track which video is currently playing audio
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(AUDIO_STATE_KEY, JSON.stringify(isGloballyMuted));
      console.log('💾 Saved audio state to session:', isGloballyMuted ? 'MUTED' : 'UNMUTED');
    } catch (error) {
      console.warn('Failed to save audio state:', error);
    }
  }, [isGloballyMuted]);

  const setGlobalMute = useCallback((muted: boolean) => {
    console.log('🔊 Global mute state changed to:', muted ? 'MUTED' : 'UNMUTED');
    setIsGloballyMuted(muted);
  }, []);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => {
      const newState = !prev;
      console.log('🔄 Toggling global mute from', prev ? 'MUTED' : 'UNMUTED', 'to', newState ? 'MUTED' : 'UNMUTED');
      return newState;
    });
  }, []);

  const setActiveVideo = useCallback((videoId: string | null) => {
    console.log('🎥 Setting active video:', videoId);
    setActiveVideoId(videoId);
  }, []);

  const isVideoActive = useCallback((videoId: string) => {
    return activeVideoId === videoId;
  }, [activeVideoId]);

  return (
    <GlobalAudioContext.Provider value={{
      isGloballyMuted,
      setGlobalMute,
      toggleGlobalMute,
      activeVideoId,
      setActiveVideo,
      isVideoActive
    }}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  // Return context directly - it has safe defaults even outside provider
  return context;
};