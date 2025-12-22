/**
 * VideoManagerContext - DEPRECATED STUB
 * 
 * ⚠️ RETIRE ME: This context has been retired. MediaRuntime is now the single playback authority.
 * This stub provides no-op functions for backward compatibility during migration.
 * 
 * TODO: Delete this file entirely once all consumers have migrated.
 */
import React, { createContext, useContext, useCallback, useEffect } from 'react';

interface VideoManagerContextType {
  setActiveVideo: (videoElement: HTMLVideoElement | null) => void;
  pauseAllOtherVideos: (currentVideo: HTMLVideoElement) => void;
  addVideo: (video: HTMLVideoElement) => void;
  removeVideo: (video: HTMLVideoElement) => void;
}

const VideoManagerContext = createContext<VideoManagerContextType | undefined>(undefined);

// DEV warning - shown once per session
let warnedProvider = false;

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (import.meta.env.DEV && !warnedProvider) {
      warnedProvider = true;
      console.warn(
        '⚠️ RETIRE ME: VideoManagerProvider is deprecated.\n' +
        'Use MediaRuntime/useMediaAutoplay instead.\n' +
        'This stub will be deleted in the next PR.'
      );
    }
  }, []);

  // All functions are no-ops with DEV warnings
  const warnAndNoop = useCallback((methodName: string) => {
    if (import.meta.env.DEV) {
      console.warn(
        `⚠️ RETIRE ME: VideoManager.${methodName}() is deprecated.\n` +
        'Use MediaRuntime.requestPlay/requestPause instead.'
      );
    }
  }, []);

  const value: VideoManagerContextType = {
    setActiveVideo: () => warnAndNoop('setActiveVideo'),
    pauseAllOtherVideos: () => warnAndNoop('pauseAllOtherVideos'),
    addVideo: () => warnAndNoop('addVideo'),
    removeVideo: () => warnAndNoop('removeVideo'),
  };

  return (
    <VideoManagerContext.Provider value={value}>
      {children}
    </VideoManagerContext.Provider>
  );
};

// DEV warning - shown once per hook call location
let warnedHook = false;

export const useVideoManager = () => {
  if (import.meta.env.DEV && !warnedHook) {
    warnedHook = true;
    console.warn(
      '⚠️ RETIRE ME: useVideoManager() is deprecated.\n' +
      'Use MediaRuntime/useMediaAutoplay instead.\n' +
      'This hook will be deleted in the next PR.'
    );
  }

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
