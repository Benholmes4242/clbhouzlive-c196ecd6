import { useState, useEffect, useCallback, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface VideoState {
  id: string;
  section: 'discover' | 'trending' | 'feed';
  isPlaying: boolean;
  isAutoplay: boolean;
  element?: HTMLVideoElement;
  priority: number;
}

interface VideoPlaybackManagerProps {
  section: 'discover' | 'trending' | 'feed';
  videoId: string;
  autoplayAllowed?: boolean;
  priority?: number;
}

// Global state management for video playback
class VideoPlaybackManager {
  private videos: Map<string, VideoState> = new Map();
  private listeners: Set<(videos: Map<string, VideoState>) => void> = new Set();
  private failedVideos: Set<string> = new Set(); // Track videos that failed to load
  private maxAutoplayVideos = {
    discover: 99, // All visible videos can autoplay
    trending: 1,  // Only first video autoplays
    feed: 2       // Max 2 videos autoplay in feed
  };

  subscribe(listener: (videos: Map<string, VideoState>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.videos));
  }

  registerVideo(videoState: VideoState) {
    this.videos.set(videoState.id, videoState);
    this.notify();
  }

  unregisterVideo(videoId: string) {
    this.videos.delete(videoId);
    this.notify();
  }

  // Mark a video as failed to prevent retry loops
  markVideoAsFailed(videoId: string) {
    console.log(`❌ Marking video as failed: ${videoId}`);
    this.failedVideos.add(videoId);
    // Remove from active videos to prevent further attempts
    this.unregisterVideo(videoId);
  }

  // Check if a video has previously failed
  hasVideoFailed(videoId: string): boolean {
    return this.failedVideos.has(videoId);
  }

  canAutoplay(section: 'discover' | 'trending' | 'feed', videoId: string): boolean {
    // Don't try to autoplay failed videos
    if (this.hasVideoFailed(videoId)) {
      return false;
    }

    const sectionVideos = Array.from(this.videos.values()).filter(v => v.section === section);
    const autoplayingVideos = sectionVideos.filter(v => v.isPlaying && v.isAutoplay);
    
    // If this video is already playing, allow it
    const currentVideo = this.videos.get(videoId);
    if (currentVideo?.isPlaying) return true;
    
    // Check if we can start more autoplay videos
    return autoplayingVideos.length < this.maxAutoplayVideos[section];
  }

  playVideo(videoId: string, isAutoplay: boolean = true) {
    const video = this.videos.get(videoId);
    if (!video) return;

    const section = video.section;
    
    // For trending section, pause other videos when one is clicked
    if (section === 'trending' && !isAutoplay) {
      const trendingVideos = Array.from(this.videos.values()).filter(v => v.section === 'trending');
      trendingVideos.forEach(v => {
        if (v.id !== videoId && v.isPlaying) {
          v.element?.pause();
          this.videos.set(v.id, { ...v, isPlaying: false });
        }
      });
    }

    // For feed section, pause oldest video if we exceed limit
    if (section === 'feed' && isAutoplay) {
      const feedVideos = Array.from(this.videos.values()).filter(v => v.section === 'feed');
      const autoplayingVideos = feedVideos.filter(v => v.isPlaying && v.isAutoplay);
      
      if (autoplayingVideos.length >= 2) {
        // Pause the oldest autoplay video
        const oldestVideo = autoplayingVideos.reduce((oldest, current) => 
          current.priority < oldest.priority ? current : oldest
        );
        oldestVideo.element?.pause();
        this.videos.set(oldestVideo.id, { ...oldestVideo, isPlaying: false });
      }
    }

    this.videos.set(videoId, { ...video, isPlaying: true, isAutoplay });
    this.notify();
  }

  pauseVideo(videoId: string) {
    const video = this.videos.get(videoId);
    if (!video) return;

    this.videos.set(videoId, { ...video, isPlaying: false });
    this.notify();
  }

  pauseAllVideos() {
    this.videos.forEach((video, id) => {
      if (video.isPlaying) {
        video.element?.pause();
        this.videos.set(id, { ...video, isPlaying: false });
      }
    });
    this.notify();
  }

  getVideoState(videoId: string): VideoState | undefined {
    return this.videos.get(videoId);
  }
}

// Global manager instance
const globalVideoManager = new VideoPlaybackManager();

export const useVideoPlaybackManager = ({ 
  section, 
  videoId, 
  autoplayAllowed = true, 
  priority = Date.now() 
}: VideoPlaybackManagerProps) => {
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '50px'
  });

  // Register video with global manager and sync local state
  useEffect(() => {
    const initialState: VideoState = {
      id: videoId,
      section,
      isPlaying: false,
      isAutoplay: false,
      priority
    };

    globalVideoManager.registerVideo(initialState);
    setVideoState(initialState);

    // Subscribe to global state changes
    const unsubscribe = globalVideoManager.subscribe((videos) => {
      const currentVideo = videos.get(videoId);
      if (currentVideo) {
        setVideoState(currentVideo);
      }
    });

    return () => {
      globalVideoManager.unregisterVideo(videoId);
      unsubscribe();
    };
  }, [videoId, section, priority]);

  // Update video element reference in global manager and add event listeners
  useEffect(() => {
    if (videoRef.current && videoState) {
      const video = videoRef.current;
      const updatedState = { ...videoState, element: video };
      globalVideoManager.registerVideo(updatedState);

      // Add event listeners to keep state synchronized
      const handlePlay = () => {
        globalVideoManager.playVideo(videoId, videoState.isAutoplay);
      };

      const handlePause = () => {
        globalVideoManager.pauseVideo(videoId);
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [videoRef.current, videoState?.id]);

  // Handle intersection changes for autoplay
  useEffect(() => {
    if (!videoRef.current || !videoState) return;

    // Skip failed videos
    if (globalVideoManager.hasVideoFailed(videoId)) {
      return;
    }

    if (isInView && autoplayAllowed) {
      // Check if we can autoplay this video and it's not already playing
      if (!videoState.isPlaying && globalVideoManager.canAutoplay(section, videoId)) {
        console.log(`🎬 Starting autoplay for ${section} video: ${videoId}`);
        videoRef.current.play().catch(error => {
          console.error(`❌ Video autoplay failed for ${videoId}:`, error);
          // Mark this video as failed to prevent retry loops
          globalVideoManager.markVideoAsFailed(videoId);
        });
        globalVideoManager.playVideo(videoId, true);
      }
    } else if (!isInView && videoState.isPlaying && videoState.isAutoplay) {
      // Pause autoplay videos when out of view
      console.log(`⏸️ Pausing autoplay for ${section} video: ${videoId}`);
      videoRef.current?.pause();
      globalVideoManager.pauseVideo(videoId);
    }
  }, [isInView, autoplayAllowed, section, videoId, videoState?.isPlaying]);

  // Manual play/pause control
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      globalVideoManager.playVideo(videoId, false);
    } else {
      videoRef.current.pause();
      globalVideoManager.pauseVideo(videoId);
    }
  }, [videoId]);

  // Check if video should show play icon
  const shouldShowPlayIcon = useCallback(() => {
    if (!videoState || !videoRef.current) return false;
    
    // Show play icon only for paused videos in trending and feed sections
    const isVideoActuallyPaused = videoRef.current.paused;
    
    if (section === 'trending' && isVideoActuallyPaused) return true;
    if (section === 'feed' && isVideoActuallyPaused) return true;
    
    return false;
  }, [section, videoState, videoRef.current?.paused]);

  return {
    videoRef,
    containerRef,
    isInView,
    isPlaying: videoState?.isPlaying || false,
    canAutoplay: globalVideoManager.canAutoplay(section, videoId),
    shouldShowPlayIcon: shouldShowPlayIcon(),
    togglePlayPause,
    pauseAllVideos: globalVideoManager.pauseAllVideos
  };
};

// Hook for fullscreen video modal
export const useFullscreenVideoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoData, setVideoData] = useState<{
    src: string;
    poster?: string;
    user: {
      id: string;
      profile_photo_url?: string;
      display_name?: string;
      username?: string;
    };
    content?: string;
  } | null>(null);

  const openModal = useCallback((data: typeof videoData) => {
    // Pause all videos when opening modal
    globalVideoManager.pauseAllVideos();
    setVideoData(data);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setVideoData(null);
  }, []);

  return {
    isOpen,
    videoData,
    openModal,
    closeModal
  };
};