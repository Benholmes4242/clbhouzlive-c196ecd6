import React, { createContext, useContext, useRef, useCallback } from 'react';

interface SingleAudioManagerContextType {
  setActiveVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  clearActiveVideo: (videoId: string) => void;
  isActiveVideo: (videoId: string) => boolean;
}

const SingleAudioManagerContext = createContext<SingleAudioManagerContextType | undefined>(undefined);

export const SingleAudioManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeVideoRef = useRef<{ id: string; element: HTMLVideoElement } | null>(null);

  const setActiveVideo = useCallback((videoId: string, videoElement: HTMLVideoElement) => {
    // If there's already an active video and it's different, mute it
    if (activeVideoRef.current && activeVideoRef.current.id !== videoId) {
      console.log('🔇 Muting previous active video:', activeVideoRef.current.id);
      activeVideoRef.current.element.muted = true;
    }

    // Set the new active video
    activeVideoRef.current = { id: videoId, element: videoElement };
    console.log('🔊 Setting active video for audio:', videoId);
  }, []);

  const clearActiveVideo = useCallback((videoId: string) => {
    if (activeVideoRef.current?.id === videoId) {
      console.log('🔇 Clearing active video:', videoId);
      activeVideoRef.current = null;
    }
  }, []);

  const isActiveVideo = useCallback((videoId: string) => {
    return activeVideoRef.current?.id === videoId;
  }, []);

  return (
    <SingleAudioManagerContext.Provider value={{
      setActiveVideo,
      clearActiveVideo,
      isActiveVideo
    }}>
      {children}
    </SingleAudioManagerContext.Provider>
  );
};

export const useSingleAudioManager = () => {
  const context = useContext(SingleAudioManagerContext);
  if (context === undefined) {
    throw new Error('useSingleAudioManager must be used within a SingleAudioManagerProvider');
  }
  return context;
};