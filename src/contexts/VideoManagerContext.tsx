/**
 * VideoManagerContext - DEPRECATED STUB
 * 
 * This context has been retired. MediaRuntime is now the single playback authority.
 * This stub provides no-op functions for backward compatibility during migration.
 */
import React, { createContext, useContext, useCallback } from 'react';

interface VideoManagerContextType {
  setActiveVideo: (videoElement: HTMLVideoElement | null) => void;
  pauseAllOtherVideos: (currentVideo: HTMLVideoElement) => void;
  addVideo: (video: HTMLVideoElement) => void;
  removeVideo: (video: HTMLVideoElement) => void;
}

const VideoManagerContext = createContext<VideoManagerContextType | undefined>(undefined);

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All functions are no-ops - MediaRuntime handles everything
  const noop = useCallback(() => {}, []);

  const value: VideoManagerContextType = {
    setActiveVideo: noop,
    pauseAllOtherVideos: noop,
    addVideo: noop,
    removeVideo: noop,
  };

  return (
    <VideoManagerContext.Provider value={value}>
      {children}
    </VideoManagerContext.Provider>
  );
};

export const useVideoManager = () => {
  const context = useContext(VideoManagerContext);
  // Return no-op stubs if context not available
  if (!context) {
    return {
      setActiveVideo: () => {},
      pauseAllOtherVideos: () => {},
      addVideo: () => {},
      removeVideo: () => {},
    };
  }
  return context;
};
