import React, { useRef, useEffect, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

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
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add video loading manager for mobile
  const [isActuallyReady, setIsActuallyReady] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Intersection observer for lazy loading
  const { ref: videoContainerRef, isInView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px' // Start loading when 200px away from viewport
  });

  // Debug logging for state changes
  useEffect(() => {
    console.log('🎬 EnhancedVideoPlayer: State change', {
      src,
      autoplay,
      isLoading,
      isPlaying,
      error,
      timestamp: Date.now()
    });
  }, [src, autoplay, isLoading, isPlaying, error]);

  // Add visible debug for mobile
  const [mobileDebug, setMobileDebug] = useState<string[]>([]);
  
  useEffect(() => {
    const debugMsg = `${new Date().toLocaleTimeString()}: autoplay=${autoplay}, loading=${isLoading}, playing=${isPlaying}, error=${error}`;
    setMobileDebug(prev => [...prev.slice(-2), debugMsg]);
  }, [autoplay, isLoading, isPlaying, error]);

  // Smart loading logic based on intersection observer
  useEffect(() => {
    if (isInView && !shouldLoad) {
      console.log('📱 Smart Loading: Video entering viewport, start loading', { src: src.slice(-20) });
      setShouldLoad(true);
    }
  }, [isInView, shouldLoad, src]);

  // Only initialize video when we should load it
  useEffect(() => {
    if (shouldLoad) {
      initializeVideo();
    }
  }, [shouldLoad]);

  // Override the default effect that initializes immediately
  
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
    const handleCanPlay = () => {
      console.log('🟢 EnhancedVideoPlayer: Video can play', { src, timestamp: Date.now() });
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
      
      // Only start playing if autoplay is requested AND video has enough data
      if (autoplay && video.readyState >= 3) {
        console.log('🚀 EnhancedVideoPlayer: Starting autoplay', { src, readyState: video.readyState });
        video.play().catch(console.error);
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
      setIsMuted(video.muted);
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
    setIsMuted(video.muted);
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
        ref={videoRef}
        poster={poster}
        muted={muted}
        loop={loop}
        autoPlay={false}
        playsInline
        preload="none"
        src={shouldLoad ? src : undefined}
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

      {/* Corner controls */}
      <div
        className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={handleFullscreen}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Quality indicator */}
      {enableHLS && quality !== 'auto' && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {quality}
        </div>
      )}

      {/* Mobile Debug Overlay */}
      <div className="absolute bottom-2 left-2 bg-red-600/90 text-white text-xs p-2 rounded max-w-[200px] z-50 font-mono">
        <div className="font-bold">LAZY LOAD DEBUG:</div>
        <div>InView: {isInView ? 'YES' : 'NO'}</div>
        <div>ShouldLoad: {shouldLoad ? 'YES' : 'NO'}</div>
        <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
        <div>Playing: {isPlaying ? 'YES' : 'NO'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Autoplay: {autoplay ? 'YES' : 'NO'}</div>
        <div>SRC: {src.slice(-20)}</div>
        <div>VideoReady: {videoRef.current ? 'YES' : 'NO'}</div>
        <div>VideoWidth: {videoRef.current?.videoWidth || 'N/A'}</div>
        <div>VideoHeight: {videoRef.current?.videoHeight || 'N/A'}</div>
        <div>ReadyState: {videoRef.current?.readyState || 'N/A'}</div>
        {mobileDebug.slice(-1).map((info, idx) => (
          <div key={idx} className="text-xs truncate">{info}</div>
        ))}
      </div>
    </div>
  );
};

export default memo(EnhancedVideoPlayer);