/**
 * VideoPlaybackManager - DEPRECATED STUB
 * 
 * ⚠️ RETIRE ME: This context has been retired. MediaRuntime is now the single playback authority.
 * This stub provides no-op functions for backward compatibility during migration.
 * 
 * TODO: Delete this file entirely once all consumers have migrated.
 */
import React, { createContext, useContext, useCallback, useEffect } from 'react';

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

// DEV warning - shown once per session
let warnedProvider = false;

export const VideoPlaybackManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (import.meta.env.DEV && !warnedProvider) {
      warnedProvider = true;
      console.warn(
        '⚠️ RETIRE ME: VideoPlaybackManagerProvider is deprecated.\n' +
        'Use MediaRuntime/useMediaAutoplay instead.\n' +
        'This stub will be deleted in the next PR.'
      );
    }
  }, []);

  // All functions are no-ops with DEV warnings
  const warnAndNoop = useCallback((methodName: string) => {
    if (import.meta.env.DEV) {
      console.warn(
        `⚠️ RETIRE ME: VideoPlaybackManager.${methodName}() is deprecated.\n` +
        'Use MediaRuntime.requestPlay/requestPause instead.'
      );
    }
  }, []);
  
  const value: VideoPlaybackManagerContextType = {
    registerVideo: () => warnAndNoop('registerVideo'),
    unregisterVideo: () => warnAndNoop('unregisterVideo'),
    playVideo: () => warnAndNoop('playVideo'),
    pauseAllOtherVideos: () => warnAndNoop('pauseAllOtherVideos'),
    muteAllVideos: () => warnAndNoop('muteAllVideos'),
    setActiveAudioVideo: () => warnAndNoop('setActiveAudioVideo'),
    muteAllOtherVideos: () => warnAndNoop('muteAllOtherVideos'),
    pauseVideo: () => warnAndNoop('pauseVideo'),
    pauseAllAndSetActive: () => warnAndNoop('pauseAllAndSetActive'),
    storeVideoPosition: () => warnAndNoop('storeVideoPosition'),
    resumeVideoFromPosition: () => warnAndNoop('resumeVideoFromPosition'),
    storeVideoState: () => warnAndNoop('storeVideoState'),
    resumeVideoWithState: () => warnAndNoop('resumeVideoWithState'),
  };

  return (
    <VideoPlaybackManagerContext.Provider value={value}>
      {children}
    </VideoPlaybackManagerContext.Provider>
  );
};

// DEV warning - shown once per hook call location
let warnedHook = false;

export const useVideoPlaybackManager = () => {
  if (import.meta.env.DEV && !warnedHook) {
    warnedHook = true;
    console.warn(
      '⚠️ RETIRE ME: useVideoPlaybackManager() is deprecated.\n' +
      'Use MediaRuntime/useMediaAutoplay instead.\n' +
      'This hook will be deleted in the next PR.'
    );
  }

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
