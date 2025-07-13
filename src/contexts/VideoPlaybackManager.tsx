import React, { createContext, useContext, useRef, useCallback } from 'react';

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
  const videoRegistry = useRef<Map<string, HTMLVideoElement>>(new Map());
  const videoPositions = useRef<Map<string, number>>(new Map());
  const currentAudioVideo = useRef<string | null>(null);

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
    currentAudioVideo.current = null;
  }, []);

  const setActiveAudioVideo = useCallback((videoId: string | null) => {
    console.log('🔊 Setting active audio video:', videoId, 'previous:', currentAudioVideo.current);
    
    // If there was a previous active audio video, mute it
    if (currentAudioVideo.current && currentAudioVideo.current !== videoId) {
      const previousVideo = videoRegistry.current.get(currentAudioVideo.current);
      if (previousVideo) {
        console.log('🔇 Muting previous video:', currentAudioVideo.current);
        previousVideo.muted = true;
      }
    }
    
    // If clearing active video (videoId is null), mute the current active video
    if (videoId === null && currentAudioVideo.current) {
      const currentActiveVideo = videoRegistry.current.get(currentAudioVideo.current);
      if (currentActiveVideo) {
        console.log('🔇 Clearing active audio, muting current video:', currentAudioVideo.current);
        currentActiveVideo.muted = true;
      }
    }
    
    currentAudioVideo.current = videoId;
  }, []);

  const pauseVideo = useCallback((videoId: string) => {
    const video = videoRegistry.current.get(videoId);
    if (video && !video.paused) {
      console.log('⏸️ Pausing video:', videoId);
      video.pause();
      video.muted = true;
      
      // Clear as active if it was the active audio video
      if (currentAudioVideo.current === videoId) {
        currentAudioVideo.current = null;
      }
    }
  }, []);

  const pauseAllAndSetActive = useCallback((activeVideoId: string) => {
    console.log('🎬 Pausing ALL videos and setting active:', activeVideoId);
    
    // First, use the registry to pause and mute ALL tracked videos
    videoRegistry.current.forEach((video, videoId) => {
      if (!video.paused) {
        console.log('⏸️ Pausing tracked video:', videoId);
        video.pause();
      }
      video.muted = true;
    });
    
    // AGGRESSIVE: Also find and stop any untracked videos in the DOM
    const allVideoElements = document.querySelectorAll('video');
    allVideoElements.forEach((video) => {
      if (!video.paused) {
        console.log('⏸️ Force pausing DOM video:', video.src);
        video.pause();
      }
      video.muted = true;
    });
    
    // Clear any previous active audio
    currentAudioVideo.current = null;
    
    // Now allow the active video to play (it will handle its own audio based on global mute state)
    if (activeVideoId && activeVideoId !== '') {
      const activeVideo = videoRegistry.current.get(activeVideoId);
      if (activeVideo) {
        console.log('▶️ Starting active video:', activeVideoId);
        activeVideo.play().catch(console.error);
      }
    }
  }, []);

  const muteAllOtherVideos = useCallback((activeVideoId: string) => {
    console.log('🔇 Muting all other videos except:', activeVideoId);
    videoRegistry.current.forEach((video, videoId) => {
      if (videoId !== activeVideoId && !video.muted) {
        // Only mute videos that aren't already muted to avoid disrupting playback
        video.muted = true;
      }
    });
    currentAudioVideo.current = activeVideoId;
  }, []);

  const storeVideoPosition = useCallback((videoId: string) => {
    const video = videoRegistry.current.get(videoId);
    if (video) {
      videoPositions.current.set(videoId, video.currentTime);
      console.log('💾 Stored video position for:', videoId, 'at', video.currentTime);
    }
  }, []);

  const storeVideoState = useCallback((videoId: string) => {
    const video = videoRegistry.current.get(videoId);
    if (video) {
      videoPositions.current.set(videoId, video.currentTime);
      // Store mute state with a special key
      videoPositions.current.set(`${videoId}_muted`, video.muted ? 1 : 0);
      console.log('💾 Stored video state for:', videoId, 'at', video.currentTime, 'muted:', video.muted);
    }
  }, []);

  const resumeVideoWithState = useCallback((videoId: string) => {
    const video = videoRegistry.current.get(videoId);
    const storedPosition = videoPositions.current.get(videoId);
    const storedMuteState = videoPositions.current.get(`${videoId}_muted`);
    
    if (video && storedPosition !== undefined) {
      video.currentTime = storedPosition;
      
      // Restore mute state if it was stored
      if (storedMuteState !== undefined) {
        video.muted = storedMuteState === 1;
        console.log('🔊 Restoring video mute state:', video.muted);
      }
      
      console.log('▶️ Resuming video:', videoId, 'from position:', storedPosition, 'muted:', video.muted);
      
      // Start playing the video
      video.play().catch(error => {
        console.log('Resume autoplay prevented:', error);
      });
      
      // Clear the stored position and mute state
      videoPositions.current.delete(videoId);
      videoPositions.current.delete(`${videoId}_muted`);
    }
  }, []);

  const resumeVideoFromPosition = useCallback((videoId: string) => {
    const video = videoRegistry.current.get(videoId);
    const storedPosition = videoPositions.current.get(videoId);
    
    if (video && storedPosition !== undefined) {
      video.currentTime = storedPosition;
      console.log('▶️ Resuming video:', videoId, 'from position:', storedPosition);
      
      // Start playing the video
      video.play().catch(error => {
        console.log('Resume autoplay prevented:', error);
      });
      
      // Clear the stored position
      videoPositions.current.delete(videoId);
    }
  }, []);

  return (
    <VideoPlaybackManagerContext.Provider value={{
      registerVideo,
      unregisterVideo,
      playVideo,
      pauseAllOtherVideos,
      muteAllVideos,
      setActiveAudioVideo,
      muteAllOtherVideos,
      pauseVideo,
      pauseAllAndSetActive,
      storeVideoPosition,
      resumeVideoFromPosition,
      storeVideoState,
      resumeVideoWithState
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