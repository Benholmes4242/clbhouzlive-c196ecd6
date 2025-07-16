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
  private maxAutoplayVideos = {
    discover: 99, // All visible videos can autoplay
    trending: 1,  // Only first video autoplays
    feed: 2       // Max 2 videos autoplay in feed
  };
  private feedAutoplayVideos: Set<string> = new Set(); // Track current autoplaying videos in feed

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
    this.feedAutoplayVideos.delete(videoId);
    this.notify();
  }

  // Check if a video should autoplay based on its position in feed
  shouldAutoplayFeedVideo(videoId: string, inViewVideos: Set<string>): boolean {
    const feedVideos = Array.from(this.videos.values())
      .filter(v => v.section === 'feed')
      .sort((a, b) => a.priority - b.priority); // Sort by priority (creation time)
    
    const videoIndex = feedVideos.findIndex(v => v.id === videoId);
    
    // Only autoplay first card (index 0) and 8th card (index 7) on desktop
    const shouldAutoplay = videoIndex === 0 || videoIndex === 7;
    
    return shouldAutoplay && inViewVideos.has(videoId);
  }

  // Update autoplay selection for feed section
  updateFeedAutoplay(inViewVideos: Set<string>) {
    const feedVideos = Array.from(this.videos.values())
      .filter(v => v.section === 'feed')
      .sort((a, b) => a.priority - b.priority);

    feedVideos.forEach((video, index) => {
      const shouldAutoplay = (index === 0 || index === 7) && inViewVideos.has(video.id);
      const isCurrentlyPlaying = video.isPlaying && video.isAutoplay;
      
      if (shouldAutoplay && !isCurrentlyPlaying) {
        // Start autoplay
        if (video.element) {
          video.element.play().catch(console.error);
          this.videos.set(video.id, { ...video, isPlaying: true, isAutoplay: true });
          this.feedAutoplayVideos.add(video.id);
          console.log(`🎬 Starting autoplay for feed video at position ${index + 1}: ${video.id}`);
        }
      } else if (!shouldAutoplay && isCurrentlyPlaying) {
        // Stop autoplay
        if (video.element) {
          video.element.pause();
          this.videos.set(video.id, { ...video, isPlaying: false });
          this.feedAutoplayVideos.delete(video.id);
          console.log(`⏸️ Stopping autoplay for feed video at position ${index + 1}: ${video.id}`);
        }
      }
    });
    
    this.notify();
  }

  canAutoplay(section: 'discover' | 'trending' | 'feed', videoId: string): boolean {
    if (section === 'feed') {
      // For feed section, use position-based logic
      const feedVideos = Array.from(this.videos.values())
        .filter(v => v.section === 'feed')
        .sort((a, b) => a.priority - b.priority);
      
      const videoIndex = feedVideos.findIndex(v => v.id === videoId);
      return videoIndex === 0 || videoIndex === 7;
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

    // For feed section, handle manual clicks differently
    if (section === 'feed' && !isAutoplay) {
      // If user manually clicks play and we already have 2 autoplaying videos, pause one
      if (this.feedAutoplayVideos.size >= 2) {
        const oldestAutoplayVideo = Array.from(this.feedAutoplayVideos)[0];
        const oldestVideo = this.videos.get(oldestAutoplayVideo);
        if (oldestVideo) {
          oldestVideo.element?.pause();
          this.videos.set(oldestAutoplayVideo, { ...oldestVideo, isPlaying: false });
          this.feedAutoplayVideos.delete(oldestAutoplayVideo);
        }
      }
    }

    // Update video state
    this.videos.set(videoId, { ...video, isPlaying: true, isAutoplay });
    
    // Track manually played feed videos
    if (section === 'feed' && !isAutoplay) {
      this.feedAutoplayVideos.add(videoId);
    }
    
    this.notify();
  }

  pauseVideo(videoId: string) {
    const video = this.videos.get(videoId);
    if (!video) return;

    this.videos.set(videoId, { ...video, isPlaying: false });
    
    // Remove from feed autoplay tracking if it's a feed video
    if (video.section === 'feed') {
      this.feedAutoplayVideos.delete(videoId);
    }
    
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

// Track in-view videos for feed section
const feedInViewVideos = new Set<string>();

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
      // Clean up feed view tracking
      if (section === 'feed') {
        feedInViewVideos.delete(videoId);
      }
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

    if (section === 'feed') {
      // For feed section, use centralized autoplay management
      if (isInView && autoplayAllowed) {
        feedInViewVideos.add(videoId);
        console.log(`📺 Feed video ${videoId} entered view`);
      } else {
        feedInViewVideos.delete(videoId);
        console.log(`📺 Feed video ${videoId} left view`);
      }
      
      // Update feed autoplay selection
      globalVideoManager.updateFeedAutoplay(feedInViewVideos);
    } else {
      // For other sections, use original logic
      if (isInView && autoplayAllowed) {
        // Check if we can autoplay this video and it's not already playing
        if (!videoState.isPlaying && globalVideoManager.canAutoplay(section, videoId)) {
          console.log(`🎬 Starting autoplay for ${section} video: ${videoId}`);
          videoRef.current.play().catch(console.error);
          globalVideoManager.playVideo(videoId, true);
        }
      } else if (!isInView && videoState.isPlaying && videoState.isAutoplay) {
        // Pause autoplay videos when out of view
        console.log(`⏸️ Pausing autoplay for ${section} video: ${videoId}`);
        videoRef.current?.pause();
        globalVideoManager.pauseVideo(videoId);
      }
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