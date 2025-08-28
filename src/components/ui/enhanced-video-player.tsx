import React, { useRef, useEffect, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

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
  hideControls?: boolean; // Hide play/pause controls
  objectFit?: 'cover' | 'contain' | 'smart'; // Add smart object fit option for TikTok-style behavior
}

declare global {
  interface Window {
    Hls: any;
  }
}

const EnhancedVideoPlayer = React.forwardRef<HTMLVideoElement, EnhancedVideoPlayerProps>(({
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
  quality = 'auto',
  hideControls = false,
  objectFit = 'cover'
}, ref) => {
  // 🐛 DEBUG: Log all props received by video player
  console.log('🎥 EnhancedVideoPlayer Props:', {
    src,
    poster,
    autoplay,
    muted,
    loop,
    className,
    enableHLS,
    adaptiveBitrate,
    preloadLevel,
    quality,
    hideControls,
    objectFit,
    hasOnPlay: !!onPlay,
    hasOnPause: !!onPause,
    hasOnClick: !!onClick
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isGloballyMuted } = useGlobalAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [smartObjectFit, setSmartObjectFit] = useState<'cover' | 'contain'>('cover');

  // Mobile detection and lazy loading
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Intersection observer for mobile lazy loading
  const { ref: videoContainerRef, isInView } = useIntersectionObserver({
    threshold: autoplay ? 0.3 : (isMobile ? 0.8 : 0.3), // Lower threshold for autoplay videos
    rootMargin: autoplay ? '200px' : (isMobile ? '0px' : '100px') // Larger margin for autoplay videos
  });

  // FORCE IMMEDIATE LOADING - bypass all lazy loading logic
  useEffect(() => {
    console.log('🚨 FORCE LOADING - Setting shouldLoadVideo=true immediately');
    setShouldLoadVideo(true);
  }, [src]);

  // Load HLS.js if needed - only when shouldLoadVideo is true
  useEffect(() => {
    console.log('🚀 HLS loading effect:', { shouldLoadVideo, enableHLS, hasHls: !!window.Hls });
    
    if (!shouldLoadVideo) {
      console.log('⏸️ Skipping video load - shouldLoadVideo is false');
      return;
    }
    
    if (enableHLS && !window.Hls) {
      console.log('📦 Loading HLS.js script...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = () => {
        console.log('✅ HLS.js loaded successfully');
        initializeVideo();
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load HLS.js:', error);
        setError('Failed to load video player');
      };
      document.head.appendChild(script);
    } else {
      console.log('🎬 Initializing video directly');
      initializeVideo();
    }
  }, [shouldLoadVideo, enableHLS]);
  
  const initializeVideo = async () => {
    console.log('🎬 initializeVideo called');
    const video = videoRef.current;
    if (!video) {
      console.log('❌ No video ref found');
      return;
    }

    console.log('🧹 Clearing existing instances');
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
    const isSupabaseStorage = src.includes('supabase.co/storage');
    
    console.log('🔍 Video URL Analysis:', { 
      src, 
      isCloudflareStream, 
      isM3U8, 
      enableHLS, 
      isSupabaseStorage
    });
    
    // Handle incomplete URLs (like '/manifest/video.m3u8')
    if (src.startsWith('/manifest/video.m3u8')) {
      console.log('❌ Invalid video URL detected');
      setError('Invalid video URL - video not found');
      setIsLoading(false);
      return;
    }
    
    // 🔥 NEW APPROACH: Try native HLS first for Cloudflare Stream
    if (enableHLS && (isM3U8 || isCloudflareStream) && !isSupabaseStorage) {
      console.log('🎯 Attempting native HLS first for Cloudflare Stream');
      
      // Try native HLS support first (works in most modern browsers)
      if (video.canPlayType('application/vnd.apple.mpegurl') || isCloudflareStream) {
        console.log('🍎 Using native HLS support');
        
        // Clear any existing src
        video.removeAttribute('src');
        video.src = '';
        video.load();
        
        // Wait a moment for reset
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set the HLS source directly
        video.src = src;
        console.log('📺 Set native HLS source:', src);
        
        setIsLoading(false);
        
        if (autoplay) {
          console.log('▶️ Attempting autoplay with native HLS');
          setTimeout(() => {
            video.play().catch((err) => {
              console.log('❌ Native HLS autoplay failed:', err);
            });
          }, 500);
        }
        
        return; // Exit early if native HLS works
      }
      
      // Fallback to HLS.js only if native doesn't work
      if (window.Hls && window.Hls.isSupported()) {
        console.log('📦 Falling back to HLS.js');
        
        // Simple HLS.js setup without aggressive clearing
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false, // Disable for stability
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        console.log('📥 Loading HLS source with HLS.js:', src);
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          console.log('🎉 HLS.js manifest parsed for:', src);
          setIsLoading(false);
          
          if (autoplay) {
            console.log('▶️ Attempting autoplay with HLS.js');
            video.play().catch((err) => {
              console.log('❌ HLS.js autoplay failed:', err);
            });
          }
        });

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          console.error('HLS.js Error:', { event, data, src });
          if (data.fatal) {
            console.error('Fatal HLS.js error, trying native fallback');
            setError('Video playback error - trying fallback');
            // Try native as last resort
            video.src = src;
            setIsLoading(false);
          }
        });

        hlsRef.current = hls;
      } else {
        console.log('⚠️ No HLS support, using direct video');
        video.src = src;
        setIsLoading(false);
      }
    } else {
      // Standard video or Supabase storage video
      console.log('📼 Using standard video playback for:', src);
      video.src = src;
      setIsLoading(false);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      console.log('▶️ Video play event');
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      console.log('⏸️ Video pause event');
      setIsPlaying(false);
      onPause?.();
    };

    const handleLoadStart = () => {
      // Don't show loading spinner for every buffer event
      // Only show for initial load
    };
    const handleCanPlay = () => {
      console.log('✅ Video can play event');
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
      
      // Calculate smart object fit for TikTok-style behavior
      if (objectFit === 'smart') {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth && videoHeight) {
          const aspectRatio = videoWidth / videoHeight;
          setVideoAspectRatio(aspectRatio);
          
          // Get screen dimensions
          const screenAspectRatio = window.innerWidth / window.innerHeight;
          
          // Portrait videos (9:16 or similar) should fill screen when they're close to screen aspect ratio
          const isPortrait = aspectRatio < 1;
          const isCloseToScreenRatio = Math.abs(aspectRatio - screenAspectRatio) < 0.3;
          
          // Use cover for portrait videos that are close to 9:16 on mobile screens
          // Use contain for everything else to prevent cropping
          if (isPortrait && (aspectRatio > 0.5 && aspectRatio < 0.8)) {
            // Standard portrait video (9:16 to 4:5) - fill screen
            setSmartObjectFit('cover');
          } else if (isCloseToScreenRatio) {
            // Video aspect ratio matches screen - safe to use cover
            setSmartObjectFit('cover');
          } else {
            // Wide, square, or extreme aspect ratios - use contain to prevent cropping
            setSmartObjectFit('contain');
          }
        }
      }
      
      // Attempt autoplay if requested
      if (autoplay) {
        // Set playsInline for mobile compatibility
        video.playsInline = true;
        
        video.play().catch(() => {
          // Autoplay failed silently - this is normal if user hasn't interacted with page
        });
      }
    };
    const handleWaiting = () => {
      // Don't show loading spinner for brief buffering
      // Only show for longer waits
    };
    const handlePlaying = () => {
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

  // Update video muted state when muted prop changes  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Always respect the muted prop passed to the component
    // For autoplay compliance, the parent component should handle initial muting
    video.muted = muted;
  }, [muted]);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

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
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    // Mute state is now managed by global audio context
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
        ref={(el) => {
          videoRef.current = el;
          if (ref) {
            if (typeof ref === 'function') {
              ref(el);
            } else {
              ref.current = el;
            }
          }
        }}
        poster={poster}
        muted={muted}
        loop={loop}
        autoPlay={autoplay}
        playsInline
        preload="metadata"
        className={`w-full h-full ${
          objectFit === 'smart' 
            ? (smartObjectFit === 'contain' ? 'object-contain' : 'object-cover')
            : objectFit === 'contain' 
              ? 'object-contain' 
              : 'object-cover'
        }`}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
      />



      {/* Quality indicator */}
      {enableHLS && quality !== 'auto' && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {quality}
        </div>
      )}

    </div>
  );
});

export default memo(EnhancedVideoPlayer);