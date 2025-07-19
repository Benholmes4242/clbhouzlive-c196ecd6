import React, { useRef, useEffect, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSingleAudioManager } from '@/contexts/SingleAudioManager';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  enableHLS?: boolean; // Enable HLS streaming
  adaptiveBitrate?: boolean; // Enable adaptive bitrate
  preloadLevel?: 'none' | 'metadata' | 'auto';
  quality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
}

declare global {
  interface Window {
    Hls: any;
  }
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  muted = true,
  loop = false,
  className = '',
  onPlay,
  onPause,
  onClick,
  enableHLS = false,
  adaptiveBitrate = true,
  preloadLevel = 'metadata',
  quality = 'auto'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isGloballyMuted } = useGlobalAudio();
  const isMobile = useIsMobile();
  const { setActiveVideo, clearActiveVideo, isActiveVideo } = useSingleAudioManager();
  
  // Create unique video ID and position preservation
  const videoId = useRef(`video-${Math.random().toString(36).substr(2, 9)}`).current;
  const preservedTimeRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile detection and lazy loading
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  
  // Intersection observer for mobile lazy loading
  const { ref: videoContainerRef, isInView } = useIntersectionObserver({
    threshold: isMobile ? 0.8 : 0.3, // Higher threshold for mobile
    rootMargin: isMobile ? '0px' : '100px' // No margin for mobile
  });

  // Mobile lazy loading logic
  useEffect(() => {
    if (isMobile) {
      // On mobile, only load when actually in view
      if (isInView && !shouldLoadVideo) {
        console.log('📱 Mobile: Video entering view, start loading', { src: src.slice(-20) });
        setShouldLoadVideo(true);
      }
    } else {
      // On desktop, load immediately
      setShouldLoadVideo(true);
    }
  }, [isInView, isMobile, shouldLoadVideo, src]);

  // Load HLS.js if needed - only when shouldLoadVideo is true
  useEffect(() => {
    if (!shouldLoadVideo) return;
    
    if (enableHLS && !window.Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = () => initializeVideo();
      script.onerror = (error) => {
        console.error('❌ Failed to load HLS.js:', error);
        setError('Failed to load video player');
      };
      document.head.appendChild(script);
    } else {
      initializeVideo();
    }
  }, [shouldLoadVideo, enableHLS]);
  
  const initializeVideo = () => {
    console.log('🎬 EnhancedVideoPlayer: Initializing video', { src, enableHLS });
    const video = videoRef.current;
    if (!video) {
      console.log('❌ EnhancedVideoPlayer: No video ref found');
      return;
    }

    // Clear any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Check if HLS is needed and supported
    const isCloudflareStream = src.includes('videodelivery.net') || src.includes('iframe.videodelivery.net') || src.includes('cloudflarestream.com');
    const isM3U8 = src.includes('.m3u8');
    
    if (enableHLS && (isM3U8 || isCloudflareStream)) {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          // Optimized settings for Cloudflare Stream
          ...(isCloudflareStream && {
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            startLevel: -1, // Auto-select quality
            capLevelToPlayerSize: false, // Always allow highest quality regardless of player size
            abrEwmaDefaultEstimate: 2000000,
            abrBandWidthFactor: 0.8,
            abrBandWidthUpFactor: 0.6,
          }),
          // Adaptive bitrate settings
          abrEwmaDefaultEstimate: adaptiveBitrate ? 1000000 : 5000000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(console.error);
          }
        });

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            setError('Video playback error');
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            setIsLoading(false);
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        setIsLoading(false);
      } else {
        video.src = src;
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        setIsLoading(false);
      }
    } else {
      // Standard video
      video.src = src;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      console.log('▶️ EnhancedVideoPlayer: Video play event', { src, timestamp: Date.now() });
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      console.log('⏸️ EnhancedVideoPlayer: Video pause event', { src, timestamp: Date.now() });
      setIsPlaying(false);
      onPause?.();
    };

    const handleLoadStart = () => {
      // Don't show loading spinner for every buffer event
      // Only show for initial load
    };
    const handleCanPlay = async () => {
      console.log('🟢 EnhancedVideoPlayer: Video can play', {
        src,
        timestamp: Date.now(),
        autoplay,
        readyState: video.readyState
      });

      clearTimeout(loadingTimeoutRef.current);
      setIsLoading(false);
      setError(null);

      // Restore preserved time if available
      if (preservedTimeRef.current !== null && video.duration > 0) {
        video.currentTime = Math.min(preservedTimeRef.current, video.duration);
        preservedTimeRef.current = null;
        console.log('🕐 Restored video time to:', video.currentTime);
      }

      if (autoplay) {
        console.log('🚀 EnhancedVideoPlayer: Starting autoplay', {
          src,
          readyState: video.readyState
        });

        try {
          await video.play();
          console.log('✅ Autoplay successful');
          
          // Special handling for mobile
          if (isMobile) {
            console.log('✅ Mobile autoplay successful');
          }
        } catch (error) {
          console.log('❌ Autoplay prevented:', error);
          setIsPlaying(false);
        }
      }
    };
    const handleWaiting = () => {
      console.log('⏳ EnhancedVideoPlayer: Video waiting/buffering', { src, timestamp: Date.now() });
      // Don't show loading spinner for brief buffering
      // Only show for longer waits
    };
    const handlePlaying = () => {
      console.log('🎵 EnhancedVideoPlayer: Video playing', { src, timestamp: Date.now() });
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration || 1;
        setBuffered((bufferedEnd / duration) * 100);
      }
    };

    const handleVolumeChange = () => {
      // Volume changes are now handled by global audio context
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause]);

  // Update video muted state when global audio state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log('🔊 EnhancedVideoPlayer: Updating mute state to', isGloballyMuted ? 'MUTED' : 'UNMUTED');
    
    // If globally muted, mute this video and clear it as active
    if (isGloballyMuted) {
      video.muted = true;
      clearActiveVideo(videoId);
    } else {
      // If globally unmuted, only unmute if this is the active video
      if (isActiveVideo(videoId)) {
        video.muted = false;
      }
    }
  }, [isGloballyMuted, videoId, clearActiveVideo, isActiveVideo]);

  // Cleanup HLS on unmount and preserve video position
  useEffect(() => {
    return () => {
      // Preserve current time before cleanup
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        preservedTimeRef.current = video.currentTime;
        console.log('💾 Preserving video time:', video.currentTime);
      }
      
      if (hlsRef.current) {
        console.log('🧹 Cleaning up HLS instance');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      clearActiveVideo(videoId);
    };
  }, [videoId, clearActiveVideo]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (videoRef.current) {
      const video = videoRef.current;
      const shouldUnmute = video.muted;
      
      if (shouldUnmute) {
        // When unmuting, this becomes the active audio video
        setActiveVideo(videoId, video);
        
        // For mobile, ensure user interaction requirements are met
        if (isMobile) {
          video.muted = false;
          video.play().catch(error => {
            console.warn('Mobile autoplay with sound failed:', error);
            // Fallback to muted if unmuted play fails
            video.muted = true;
            video.play().catch(console.error);
          });
        } else {
          video.muted = false;
        }
      } else {
        // When muting, clear this as active video
        clearActiveVideo(videoId);
        video.muted = true;
      }
      
      console.log('🔊 Video mute toggled to:', video.muted ? 'MUTED' : 'UNMUTED', 'mobile:', isMobile);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (isMobile && videoRef.current?.muted) {
      // On mobile, clicking should unmute and play
      toggleMute(e);
    } else {
      togglePlayPause(e);
    }
  };

  if (error) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={videoContainerRef}
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleVideoClick}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        poster={poster}
        muted={isGloballyMuted}
        loop={loop}
        autoPlay={autoplay}
        playsInline
        preload="metadata"
        src={src}
        className="w-full h-full object-cover"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
      />

      {/* Play/Pause overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={togglePlayPause}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </button>
      </div>


      {/* Quality indicator */}
      {enableHLS && quality !== 'auto' && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {quality}
        </div>
      )}

    </div>
  );
};

export default memo(EnhancedVideoPlayer);