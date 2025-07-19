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
    console.log('🎮 VideoManager: setActiveVideo called', {
      newVideo: videoElement?.src.slice(-20),
      currentActive: currentActiveVideo.current?.src.slice(-20),
      totalVideos: activeVideos.current.size
    });

    // Pause and reset ALL other videos
    activeVideos.current.forEach(video => {
      if (video !== videoElement && !video.paused) {
        video.pause();
        video.currentTime = 0;
        console.log('🔇 VideoManager: Paused and reset video:', video.src.slice(-20));
      }
    });
    
    currentActiveVideo.current = videoElement;
    
    if (videoElement) {
      console.log('🎵 VideoManager: Set new active video:', videoElement.src.slice(-20));
    } else {
      console.log('🔇 VideoManager: Cleared active video');
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
    console.log('➕ VideoManager: Added video, total count:', activeVideos.current.size, video.src.slice(-20));
  };

  const removeVideo = (video: HTMLVideoElement) => {
    activeVideos.current.delete(video);
    if (currentActiveVideo.current === video) {
      currentActiveVideo.current = null;
    }
    console.log('➖ VideoManager: Removed video, total count:', activeVideos.current.size, video.src.slice(-20));
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