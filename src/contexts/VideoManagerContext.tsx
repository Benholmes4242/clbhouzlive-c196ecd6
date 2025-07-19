import React, { createContext, useContext, useRef } from 'react';

interface VideoManagerContextType {
  setActiveVideo: (videoElement: HTMLVideoElement | null) => void;
  pauseAllOtherVideos: (currentVideo: HTMLVideoElement) => void;
  addVideo: (video: HTMLVideoElement) => void;
  removeVideo: (video: HTMLVideoElement) => void;
}

const VideoManagerContext = createContext<VideoManagerContextType | undefined>(undefined);

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeVideos = useRef<Set<HTMLVideoElement>>(new Set());
  const currentActiveVideo = useRef<HTMLVideoElement | null>(null);

  const setActiveVideo = (videoElement: HTMLVideoElement | null) => {
    // If there's a currently active video and it's different from the new one, pause it
    if (currentActiveVideo.current && currentActiveVideo.current !== videoElement) {
      currentActiveVideo.current.pause();
      currentActiveVideo.current.currentTime = 0; // Reset to beginning
      console.log('🔇 Paused previous video:', currentActiveVideo.current.src.slice(-20));
    }
    
    currentActiveVideo.current = videoElement;
    
    if (videoElement) {
      console.log('🎵 Set new active video:', videoElement.src.slice(-20));
    }
  };

  const pauseAllOtherVideos = (currentVideo: HTMLVideoElement) => {
    activeVideos.current.forEach(video => {
      if (video !== currentVideo && !video.paused) {
        video.pause();
        console.log('⏸️ Paused other video:', video.src.slice(-20));
      }
    });
  };

  const addVideo = (video: HTMLVideoElement) => {
    activeVideos.current.add(video);
  };

  const removeVideo = (video: HTMLVideoElement) => {
    activeVideos.current.delete(video);
    if (currentActiveVideo.current === video) {
      currentActiveVideo.current = null;
    }
  };

  const value = {
    setActiveVideo,
    pauseAllOtherVideos,
    addVideo,
    removeVideo
  };

  return (
    <VideoManagerContext.Provider value={value}>
      {children}
    </VideoManagerContext.Provider>
  );
};

export const useVideoManager = () => {
  const context = useContext(VideoManagerContext);
  if (context === undefined) {
    throw new Error('useVideoManager must be used within a VideoManagerProvider');
  }
  return context;
};