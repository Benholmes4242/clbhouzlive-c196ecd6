import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface VideoState {
  id: string;
  section: 'discover' | 'trending' | 'feed';
  isPlaying: boolean;
  isAutoplay: boolean;
  element?: HTMLVideoElement;
  priority: number;
  isMuted: boolean;
}

interface VideoPlaybackConfig {
  discover: {
    desktop: {
      maxAutoplay: 999; // All visible
      autoplayOnEntry: true;
      pauseOnExit: true;
      clickToPlay: false;
    };
    mobile: {
      maxAutoplay: 2;
      autoplayOnEntry: true;
      pauseOnExit: true;
      clickToPlay: false;
    };
  };
  trending: {
    desktop: {
      maxAutoplay: 1; // Only first
      autoplayOnEntry: true; // First card
      pauseOnExit: false;
      clickToPlay: true;
    };
    mobile: {
      maxAutoplay: 1;
      autoplayOnEntry: true;
      pauseOnExit: false;
      clickToPlay: true;
    };
  };
  feed: {
    desktop: {
      maxAutoplay: 2;
      autoplayOnEntry: false;
      pauseOnExit: false;
      clickToPlay: true;
    };
    mobile: {
      maxAutoplay: 2;
      autoplayOnEntry: false;
      pauseOnExit: false;
      clickToPlay: true;
    };
  };
}

// Global state management for optimized video playback
class OptimizedVideoPlaybackManager {
  private videos: Map<string, VideoState> = new Map();
  private listeners: Set<(videos: Map<string, VideoState>) => void> = new Set();
  private config: VideoPlaybackConfig = {
    discover: {
      desktop: { maxAutoplay: 999, autoplayOnEntry: true, pauseOnExit: true, clickToPlay: false },
      mobile: { maxAutoplay: 2, autoplayOnEntry: true, pauseOnExit: true, clickToPlay: false }
    },
    trending: {
      desktop: { maxAutoplay: 1, autoplayOnEntry: true, pauseOnExit: false, clickToPlay: true },
      mobile: { maxAutoplay: 1, autoplayOnEntry: true, pauseOnExit: false, clickToPlay: true }
    },
    feed: {
      desktop: { maxAutoplay: 2, autoplayOnEntry: false, pauseOnExit: false, clickToPlay: true },
      mobile: { maxAutoplay: 2, autoplayOnEntry: false, pauseOnExit: false, clickToPlay: true }
    }
  };

  private isMobile = () => window.innerWidth < 768;

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

  updateVideoElement(videoId: string, element: HTMLVideoElement) {
    const video = this.videos.get(videoId);
    if (video) {
      this.videos.set(videoId, { ...video, element });
      this.notify();
    }
  }

  private getSectionConfig(section: 'discover' | 'trending' | 'feed') {
    return this.config[section][this.isMobile() ? 'mobile' : 'desktop'];
  }

  canAutoplay(section: 'discover' | 'trending' | 'feed', videoId: string): boolean {
    const config = this.getSectionConfig(section);
    const sectionVideos = Array.from(this.videos.values()).filter(v => v.section === section);
    const autoplayingVideos = sectionVideos.filter(v => v.isPlaying && v.isAutoplay);
    
    // If this video is already playing, allow it
    const currentVideo = this.videos.get(videoId);
    if (currentVideo?.isPlaying) return true;
    
    // Check if we can start more autoplay videos
    return autoplayingVideos.length < config.maxAutoplay;
  }

  playVideo(videoId: string, isAutoplay: boolean = true) {
    const video = this.videos.get(videoId);
    if (!video) return;

    const section = video.section;
    const config = this.getSectionConfig(section);
    
    // Handle section-specific behavior
    if (section === 'trending') {
      // For trending, pause other videos in the same section when one is manually played
      if (!isAutoplay) {
        const trendingVideos = Array.from(this.videos.values()).filter(v => v.section === 'trending');
        trendingVideos.forEach(v => {
          if (v.id !== videoId && v.isPlaying) {
            v.element?.pause();
            this.videos.set(v.id, { ...v, isPlaying: false });
          }
        });
      }
    } else if (section === 'feed') {
      // For feed, maintain max 2 videos limit
      const feedVideos = Array.from(this.videos.values()).filter(v => v.section === 'feed');
      const playingVideos = feedVideos.filter(v => v.isPlaying);
      
      if (playingVideos.length >= 2) {
        // Pause the video with lowest priority (earliest playing)
        const oldestVideo = playingVideos.reduce((oldest, current) => 
          current.priority < oldest.priority ? current : oldest
        );
        oldestVideo.element?.pause();
        this.videos.set(oldestVideo.id, { ...oldestVideo, isPlaying: false });
      }
    }

    // Start playing the video
    video.element?.play().catch(console.error);
    this.videos.set(videoId, { ...video, isPlaying: true, isAutoplay });
    this.notify();
  }

  pauseVideo(videoId: string) {
    const video = this.videos.get(videoId);
    if (!video) return;

    video.element?.pause();
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

  handleIntersection(videoId: string, isInView: boolean) {
    const video = this.videos.get(videoId);
    if (!video) return;

    const config = this.getSectionConfig(video.section);
    
    if (isInView && config.autoplayOnEntry) {
      // Video entered view - try to autoplay if allowed
      if (this.canAutoplay(video.section, videoId)) {
        this.playVideo(videoId, true);
      }
    } else if (!isInView && config.pauseOnExit && video.isPlaying && video.isAutoplay) {
      // Video left view - pause if it was autoplaying
      this.pauseVideo(videoId);
    }
  }

  togglePlayPause(videoId: string) {
    const video = this.videos.get(videoId);
    if (!video) return;

    if (video.isPlaying) {
      this.pauseVideo(videoId);
    } else {
      this.playVideo(videoId, false); // Manual play
    }
  }

  shouldShowPlayIcon(videoId: string): boolean {
    const video = this.videos.get(videoId);
    if (!video || !video.element) return false;
    
    const config = this.getSectionConfig(video.section);
    
    // Show play icon for paused videos in sections that support click-to-play
    return config.clickToPlay && !video.isPlaying;
  }

  getVideoState(videoId: string): VideoState | undefined {
    return this.videos.get(videoId);
  }
}

// Global manager instance
const globalOptimizedVideoManager = new OptimizedVideoPlaybackManager();

export interface UseOptimizedVideoPlaybackProps {
  section: 'discover' | 'trending' | 'feed';
  videoId: string;
  priority?: number;
  autoplayAllowed?: boolean;
}

export const useOptimizedVideoPlayback = ({
  section,
  videoId,
  priority = Date.now(),
  autoplayAllowed = true
}: UseOptimizedVideoPlaybackProps) => {
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '50px'
  });

  // Register video with global manager
  useEffect(() => {
    const initialState: VideoState = {
      id: videoId,
      section,
      isPlaying: false,
      isAutoplay: false,
      priority,
      isMuted: true
    };

    globalOptimizedVideoManager.registerVideo(initialState);
    setVideoState(initialState);

    // Subscribe to global state changes
    const unsubscribe = globalOptimizedVideoManager.subscribe((videos) => {
      const currentVideo = videos.get(videoId);
      if (currentVideo) {
        setVideoState(currentVideo);
      }
    });

    return () => {
      globalOptimizedVideoManager.unregisterVideo(videoId);
      unsubscribe();
    };
  }, [videoId, section, priority]);

  // Update video element reference
  useEffect(() => {
    if (videoRef.current && videoState) {
      globalOptimizedVideoManager.updateVideoElement(videoId, videoRef.current);
      
      // Set up video element properties
      const video = videoRef.current;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      // Add event listeners
      const handlePlay = () => {
        console.log(`🎬 Video ${videoId} started playing`);
      };
      
      const handlePause = () => {
        console.log(`⏸️ Video ${videoId} paused`);
      };
      
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [videoRef.current, videoState?.id]);

  // Handle intersection changes
  useEffect(() => {
    if (!videoRef.current || !videoState || !autoplayAllowed) return;

    globalOptimizedVideoManager.handleIntersection(videoId, isInView);
  }, [isInView, autoplayAllowed, videoId, videoState]);

  // Manual play/pause control
  const togglePlayPause = useCallback(() => {
    globalOptimizedVideoManager.togglePlayPause(videoId);
  }, [videoId]);

  // Check if video should show play icon
  const shouldShowPlayIcon = useCallback(() => {
    return globalOptimizedVideoManager.shouldShowPlayIcon(videoId);
  }, [videoId]);

  return {
    videoRef,
    containerRef,
    isInView,
    isPlaying: videoState?.isPlaying || false,
    isMuted: videoState?.isMuted || true,
    shouldShowPlayIcon: shouldShowPlayIcon(),
    togglePlayPause,
    canAutoplay: globalOptimizedVideoManager.canAutoplay(section, videoId),
    pauseAllVideos: globalOptimizedVideoManager.pauseAllVideos
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
    globalOptimizedVideoManager.pauseAllVideos();
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