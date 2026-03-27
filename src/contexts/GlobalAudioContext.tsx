import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface GlobalAudioContextType {
  activeVideoId: string | null;
  setActiveVideo: (videoId: string | null) => void;
  isVideoActive: (videoId: string) => boolean;
}

const defaultContext: GlobalAudioContextType = {
  activeVideoId: null,
  setActiveVideo: () => {},
  isVideoActive: () => false,
};

const GlobalAudioContext = createContext<GlobalAudioContextType>(defaultContext);

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const setActiveVideo = useCallback((videoId: string | null) => {
    setActiveVideoId(videoId);
  }, []);

  const isVideoActive = useCallback((videoId: string) => {
    return activeVideoId === videoId;
  }, [activeVideoId]);

  const value = useMemo(
    () => ({
      activeVideoId,
      setActiveVideo,
      isVideoActive,
    }),
    [activeVideoId, setActiveVideo, isVideoActive]
  );

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  return useContext(GlobalAudioContext);
};
