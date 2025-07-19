import React, { createContext, useContext, useMemo } from 'react';
import { useVideoManager } from '@/hooks/useVideoManager';

interface VideoManagerContextType {
  registerVideo: (id: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (id: string) => void;
  handleVideoInView: (id: string, isInView: boolean) => void;
  toggleVideoMute: (id: string) => void;
  getVideoMuteState: (id: string) => boolean;
  getCurrentPlayingVideoId: () => string | null;
  pauseAllVideosExcept: (exceptId?: string) => void;
}

const VideoManagerContext = createContext<VideoManagerContextType | null>(null);

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const videoManager = useVideoManager();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => videoManager, [
    videoManager.registerVideo,
    videoManager.unregisterVideo,
    videoManager.handleVideoInView,
    videoManager.toggleVideoMute,
    videoManager.getVideoMuteState,
    videoManager.getCurrentPlayingVideoId,
    videoManager.pauseAllVideosExcept
  ]);

  return (
    <VideoManagerContext.Provider value={contextValue}>
      {children}
    </VideoManagerContext.Provider>
  );
});

export const useVideoManagerContext = (): VideoManagerContextType => {
  const context = useContext(VideoManagerContext);
  if (!context) {
    throw new Error('useVideoManagerContext must be used within a VideoManagerProvider');
  }
  return context;
};