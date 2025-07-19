import { useCallback, useRef, useEffect } from 'react';

interface VideoInstance {
  id: string;
  videoElement: HTMLVideoElement;
  isInView: boolean;
  isPlaying: boolean;
  isMuted: boolean;
}

/**
 * Video Manager Hook for Clubhouse Feed
 * Ensures only one video plays at a time and only when in viewport
 */
export const useVideoManager = () => {
  const videosRef = useRef<Map<string, VideoInstance>>(new Map());
  const currentPlayingVideoRef = useRef<string | null>(null);
  const globalAudioPreferenceRef = useRef<boolean>(true); // true = muted, false = unmuted

  // Register a video with the manager
  const registerVideo = useCallback((id: string, videoElement: HTMLVideoElement) => {
    videosRef.current.set(id, {
      id,
      videoElement,
      isInView: false,
      isPlaying: false,
      isMuted: true // All videos start muted
    });
  }, []);

  // Unregister a video
  const unregisterVideo = useCallback((id: string) => {
    const video = videosRef.current.get(id);
    if (video) {
      video.videoElement.pause();
      video.videoElement.muted = true;
      videosRef.current.delete(id);
      
      if (currentPlayingVideoRef.current === id) {
        currentPlayingVideoRef.current = null;
      }
    }
  }, []);

  // Pause all videos except the specified one
  const pauseAllVideosExcept = useCallback((exceptId?: string) => {
    videosRef.current.forEach((video, id) => {
      if (id !== exceptId && video.videoElement) {
        video.videoElement.pause();
        video.videoElement.muted = true;
        video.isPlaying = false;
        video.isMuted = true;
        videosRef.current.set(id, video);
      }
    });
  }, []);

  // Handle video entering viewport
  const handleVideoInView = useCallback((id: string, isInView: boolean) => {
    const video = videosRef.current.get(id);
    if (!video) return;

    video.isInView = isInView;
    videosRef.current.set(id, video);

    if (isInView) {
      // Pause all other videos when this one comes into view
      pauseAllVideosExcept(id);
      
      // Start playing this video, respecting global audio preference
      const shouldBeMuted = globalAudioPreferenceRef.current;
      video.videoElement.muted = shouldBeMuted;
      video.videoElement.play().then(() => {
        video.isPlaying = true;
        video.isMuted = shouldBeMuted;
        currentPlayingVideoRef.current = id;
        videosRef.current.set(id, video);
      }).catch(error => {
        console.log('Video autoplay failed:', error);
      });
    } else {
      // Pause video when it goes out of view
      video.videoElement.pause();
      video.videoElement.muted = true;
      video.isPlaying = false;
      video.isMuted = true;
      videosRef.current.set(id, video);
      
      if (currentPlayingVideoRef.current === id) {
        currentPlayingVideoRef.current = null;
      }
    }
  }, [pauseAllVideosExcept]);

  // Toggle mute for the currently visible video
  const toggleVideoMute = useCallback((id: string) => {
    const video = videosRef.current.get(id);
    if (!video || !video.isInView) return;

    // Mute all other videos first
    videosRef.current.forEach((otherVideo, otherId) => {
      if (otherId !== id && otherVideo.videoElement) {
        otherVideo.videoElement.muted = true;
        otherVideo.isMuted = true;
        videosRef.current.set(otherId, otherVideo);
      }
    });

    // Toggle mute state for the current video
    const newMutedState = !video.isMuted;
    video.videoElement.muted = newMutedState;
    video.isMuted = newMutedState;
    videosRef.current.set(id, video);

    // Update global audio preference based on user's action
    globalAudioPreferenceRef.current = newMutedState;

    // If unmuting, ensure this video is playing
    if (!newMutedState && video.isInView) {
      video.videoElement.play().catch(error => {
        console.log('Video play failed:', error);
      });
    }
  }, []);

  // Get the current mute state of a video
  const getVideoMuteState = useCallback((id: string): boolean => {
    const video = videosRef.current.get(id);
    return video?.isMuted ?? true;
  }, []);

  // Get the current playing video ID
  const getCurrentPlayingVideoId = useCallback((): string | null => {
    return currentPlayingVideoRef.current;
  }, []);

  // Cleanup all videos on unmount
  useEffect(() => {
    return () => {
      videosRef.current.forEach((video) => {
        if (video.videoElement) {
          video.videoElement.pause();
          video.videoElement.muted = true;
        }
      });
      videosRef.current.clear();
      currentPlayingVideoRef.current = null;
    };
  }, []);

  return {
    registerVideo,
    unregisterVideo,
    handleVideoInView,
    toggleVideoMute,
    getVideoMuteState,
    getCurrentPlayingVideoId,
    pauseAllVideosExcept
  };
};