/**
 * VideoPlaybackManager - DEPRECATED STUB
 * 
 * This context has been retired. MediaRuntime is now the single playback authority.
 * This stub provides no-op functions for backward compatibility during migration.
 */
import React, { createContext, useContext, useCallback } from 'react';

interface VideoPlaybackManagerContextType {
  registerVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (videoId: string) => void;
  playVideo: (videoId: string, shouldUnmute?: boolean) => void;
  pauseAllOtherVideos: (activeVideoId: string) => void;
  muteAllVideos: () => void;
  setActiveAudioVideo: (videoId: string | null) => void;
  muteAllOtherVideos: (activeVideoId: string) => void;
  pauseVideo: (videoId: string) => void;
  pauseAllAndSetActive: (activeVideoId: string) => void;
  storeVideoPosition: (videoId: string) => void;
  resumeVideoFromPosition: (videoId: string) => void;
  storeVideoState: (videoId: string) => void;
  resumeVideoWithState: (videoId: string) => void;
}

const VideoPlaybackManagerContext = createContext<VideoPlaybackManagerContextType | undefined>(undefined);

export const VideoPlaybackManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All functions are no-ops - MediaRuntime handles everything
  const noop = useCallback(() => {}, []);
  
  const value: VideoPlaybackManagerContextType = {
    registerVideo: noop,
    unregisterVideo: noop,
    playVideo: noop,
    pauseAllOtherVideos: noop,
    muteAllVideos: noop,
    setActiveAudioVideo: noop,
    muteAllOtherVideos: noop,
    pauseVideo: noop,
    pauseAllAndSetActive: noop,
    storeVideoPosition: noop,
    resumeVideoFromPosition: noop,
    storeVideoState: noop,
    resumeVideoWithState: noop,
  };

  return (
    <VideoPlaybackManagerContext.Provider value={value}>
      {children}
    </VideoPlaybackManagerContext.Provider>
  );
};

export const useVideoPlaybackManager = () => {
  const context = useContext(VideoPlaybackManagerContext);
  // Return no-op stubs if context not available (for gradual migration)
  if (!context) {
    return {
      registerVideo: () => {},
      unregisterVideo: () => {},
      playVideo: () => {},
      pauseAllOtherVideos: () => {},
      muteAllVideos: () => {},
      setActiveAudioVideo: () => {},
      muteAllOtherVideos: () => {},
      pauseVideo: () => {},
      pauseAllAndSetActive: () => {},
      storeVideoPosition: () => {},
      resumeVideoFromPosition: () => {},
      storeVideoState: () => {},
      resumeVideoWithState: () => {},
    };
  }
  return context;
};
