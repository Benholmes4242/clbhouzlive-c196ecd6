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

  // Get videos that are in view and eligible for autoplay
  private getEligibleFeedVideos(): VideoState[] {
    const feedVideos = Array.from(this.videos.values()).filter(v => v.section === 'feed');
    // We need to track which videos are in view - this will be updated by the hook
    return feedVideos.filter(v => !v.isPlaying);
  }

  // Check if two videos are adjacent based on their priority (creation time)
  private areVideosAdjacent(video1: VideoState, video2: VideoState): boolean {
    const priorities = Array.from(this.videos.values())
      .filter(v => v.section === 'feed')
      .map(v => v.priority)
      .sort((a, b) => a - b);
    
    const index1 = priorities.indexOf(video1.priority);
    const index2 = priorities.indexOf(video2.priority);
    
    return Math.abs(index1 - index2) <= 1;
  }

  // Select up to 2 random videos ensuring they're spread out
  private selectRandomSpreadVideos(candidates: VideoState[]): VideoState[] {
    if (candidates.length <= 2) return candidates;
    
    // First, randomly select one video
    const firstVideo = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Filter out adjacent videos
    const nonAdjacentCandidates = candidates.filter(v => 
      v.id !== firstVideo.id && !this.areVideosAdjacent(firstVideo, v)
    );
    
    if (nonAdjacentCandidates.length === 0) {
      // If no non-adjacent videos, just return the first one
      return [firstVideo];
    }
    
    // Select second video from non-adjacent candidates
    const secondVideo = nonAdjacentCandidates[Math.floor(Math.random() * nonAdjacentCandidates.length)];
    
    return [firstVideo, secondVideo];
  }

  // Update autoplay selection for feed section
  updateFeedAutoplay(inViewVideos: Set<string>) {
    if (inViewVideos.size === 0) {
      // Pause all autoplay videos if none are in view
      this.feedAutoplayVideos.forEach(videoId => {
        const video = this.videos.get(videoId);
        if (video && video.isAutoplay) {
          video.element?.pause();
          this.videos.set(videoId, { ...video, isPlaying: false });
        }
      });
      this.feedAutoplayVideos.clear();
      this.notify();
      return;
    }

    // Get eligible videos (in view and not playing)
    const eligibleVideos = Array.from(this.videos.values()).filter(v => 
      v.section === 'feed' && 
      inViewVideos.has(v.id) && 
      !v.isPlaying
    );

    // Get currently autoplaying videos that are still in view
    const currentAutoplayInView = Array.from(this.feedAutoplayVideos).filter(videoId => {
      const video = this.videos.get(videoId);
      return video && video.isPlaying && inViewVideos.has(videoId);
    });

    // If we have less than 2 autoplaying and there are eligible videos
    if (currentAutoplayInView.length < 2 && eligibleVideos.length > 0) {
      const needed = 2 - currentAutoplayInView.length;
      const selectedVideos = this.selectRandomSpreadVideos(eligibleVideos).slice(0, needed);
      
      selectedVideos.forEach(video => {
        if (video.element) {
          video.element.play().catch(console.error);
          this.videos.set(video.id, { ...video, isPlaying: true, isAutoplay: true });
          this.feedAutoplayVideos.add(video.id);
        }
      });
      
      this.notify();
    }

    // Pause autoplaying videos that are out of view
    this.feedAutoplayVideos.forEach(videoId => {
      if (!inViewVideos.has(videoId)) {
        const video = this.videos.get(videoId);
        if (video && video.isAutoplay) {
          video.element?.pause();
          this.videos.set(videoId, { ...video, isPlaying: false });
          this.feedAutoplayVideos.delete(videoId);
        }
      }
    });
  }

  canAutoplay(section: 'discover' | 'trending' | 'feed', videoId: string): boolean {
    if (section === 'feed') {
      // For feed section, use the new random selection logic
      return this.feedAutoplayVideos.has(videoId) || this.feedAutoplayVideos.size < 2;
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