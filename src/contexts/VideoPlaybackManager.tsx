import React, { createContext, useContext, useRef, useCallback } from 'react';

interface VideoPlaybackManagerContextType {
  registerVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (videoId: string) => void;
  playVideo: (videoId: string, shouldUnmute?: boolean) => void;
  pauseAllOtherVideos: (activeVideoId: string) => void;
  muteAllVideos: () => void;
}

const VideoPlaybackManagerContext = createContext<VideoPlaybackManagerContextType | undefined>(undefined);

export const VideoPlaybackManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRegistry = useRef<Map<string, HTMLVideoElement>>(new Map());

  const registerVideo = useCallback((videoId: string, videoElement: HTMLVideoElement) => {
    videoRegistry.current.set(videoId, videoElement);
  }, []);

  const unregisterVideo = useCallback((videoId: string) => {
    videoRegistry.current.delete(videoId);
  }, []);

  const playVideo = useCallback((videoId: string, shouldUnmute = false) => {
    const video = videoRegistry.current.get(videoId);
    if (!video) return;

    // First pause/mute all other videos
    videoRegistry.current.forEach((otherVideo, otherId) => {
      if (otherId !== videoId) {
        otherVideo.muted = true;
        if (!otherVideo.paused) {
          otherVideo.pause();
        }
      }
    });

    // Then play the target video
    video.muted = !shouldUnmute;
    video.play().catch(console.error);
  }, []);

  const pauseAllOtherVideos = useCallback((activeVideoId: string) => {
    videoRegistry.current.forEach((video, videoId) => {
      if (videoId !== activeVideoId) {
        video.muted = true;
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, []);

  const muteAllVideos = useCallback(() => {
    videoRegistry.current.forEach((video) => {
      video.muted = true;
    });
  }, []);

  return (
    <VideoPlaybackManagerContext.Provider value={{
      registerVideo,
      unregisterVideo,
      playVideo,
      pauseAllOtherVideos,
      muteAllVideos
    }}>
      {children}
    </VideoPlaybackManagerContext.Provider>
  );
};

export const useVideoPlaybackManager = () => {
  const context = useContext(VideoPlaybackManagerContext);
  if (context === undefined) {
    throw new Error('useVideoPlaybackManager must be used within a VideoPlaybackManagerProvider');
  }
  return context;
};