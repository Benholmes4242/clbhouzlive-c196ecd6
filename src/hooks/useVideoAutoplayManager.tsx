
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface VideoAutoplayContextType {
  activeVideoId: string | null;
  setActiveVideo: (videoId: string | null) => void;
  isVideoActive: (videoId: string) => boolean;
}

const VideoAutoplayContext = createContext<VideoAutoplayContextType | undefined>(undefined);

export const VideoAutoplayProvider = ({ children }: { children: ReactNode }) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const setActiveVideo = useCallback((videoId: string | null) => {
    console.log('Setting active video:', videoId);
    setActiveVideoId(videoId);
  }, []);

  const isVideoActive = useCallback((videoId: string) => {
    return activeVideoId === videoId;
  }, [activeVideoId]);

  return (
    <VideoAutoplayContext.Provider value={{ activeVideoId, setActiveVideo, isVideoActive }}>
      {children}
    </VideoAutoplayContext.Provider>
  );
};

export const useVideoAutoplayManager = () => {
  const context = useContext(VideoAutoplayContext);
  if (!context) {
    throw new Error('useVideoAutoplayManager must be used within VideoAutoplayProvider');
  }
  return context;
};
