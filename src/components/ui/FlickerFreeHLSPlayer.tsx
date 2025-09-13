import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { safePlayAfterAnimation, safePlay, isIOS } from '@/utils/safePlay';
import { logVideoTelemetry } from '@/utils/videoTelemetry';

interface FlickerFreeHLSPlayerProps {
  hlsUrl: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain';
  showMuteButton?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  externallyManaged?: boolean;
}

declare global {
  interface Window {
    Hls: any;
  }
}

const FlickerFreeHLSPlayer = forwardRef<HTMLVideoElement, FlickerFreeHLSPlayerProps>(({
  hlsUrl,
  poster,
  autoplay = false,
  muted = true,
  loop = false,
  className = '',
  objectFit = 'contain',
  showMuteButton = false,
  onPlay,
  onPause,
  onClick,
  onEnded,
  externallyManaged = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const hlsInstanceRef = useRef<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHLSLoaded, setIsHLSLoaded] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);

  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current!, []);

  // Sync muted state
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Check if browser supports native HLS
  const canPlayHLSNatively = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  };

  // Load hls.js library
  const loadHlsJs = async () => {
    if (window.Hls) return window.Hls;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
      script.onload = () => resolve(window.Hls);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Safe src-swap sequence with proper cleanup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    const swapSource = async () => {
      try {
        logVideoTelemetry('video_src_swap_started', { 
          from_id: video.src, 
          to_id: hlsUrl, 
          player_type: 'HLS' 
        });

        // 1. Stop old playback
        try { 
          video.pause(); 
        } catch (e) { 
          console.warn('[HLS] Error pausing video:', e); 
        }

        // 2. Clean up existing HLS instance with proper sequence
        if (hlsInstanceRef.current) {
          console.log('[HLS] Cleaning up previous HLS instance');
          try {
            hlsInstanceRef.current.stopLoad();
            hlsInstanceRef.current.detachMedia();
            hlsInstanceRef.current.destroy();
          } catch (e) {
            console.warn('[HLS] Error during HLS cleanup:', e);
          }
          hlsInstanceRef.current = null;
        }

        // 3. Hard reset the video element (critical for Safari)
        video.removeAttribute("src");
        video.load(); // Flushes old resource

        // 4. Reset states for new source
        setIsHLSLoaded(false);
        setIsVideoReady(false);
        setAutoplayAttempted(false);
        setIsPlaying(false);

        const startTime = Date.now();

        // 5. Attach new source
        if (canPlayHLSNatively()) {
          video.src = hlsUrl;
          
          const handleCanPlayOnce = async () => {
            video.removeEventListener("canplay", handleCanPlayOnce);
            logVideoTelemetry('video_src_swap_ready', { t_ready_ms: Date.now() - startTime });
            setIsHLSLoaded(true);
            await handleAutoplay();
          };
          
          video.addEventListener("canplay", handleCanPlayOnce);
        } else {
          const Hls = await loadHlsJs();
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 6,  // Modest buffer for mobile
              backBufferLength: 4,
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS error:', data);
              if (data.details === 'bufferStalledError') {
                logVideoTelemetry('hls_buffer_stalled', { details: data.details });
              }
            });

            // Wait for media attachment before loading source
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              hls.loadSource(hlsUrl);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, async () => {
              console.log('[HLS] Manifest parsed, HLS ready');
              logVideoTelemetry('video_src_swap_ready', { t_ready_ms: Date.now() - startTime });
              logVideoTelemetry('hls_manifest_parsed');
              setIsHLSLoaded(true);
              
              // Apply iOS nudge after src swap if needed
              if (isIOS && video.currentTime === 0) {
                try {
                  video.currentTime = 0.001;
                } catch (e) {
                  // Ignore errors setting currentTime
                }
              }
              
              await handleAutoplay();
            });
            
            hls.attachMedia(video);
            hlsInstanceRef.current = hls;
          }
        }
      } catch (error) {
        console.error('Error during source swap:', error);
      }
    };

    swapSource();

    return () => {
      // Cleanup only on unmount, not on src change
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.stopLoad();
          hlsInstanceRef.current.detachMedia();
          hlsInstanceRef.current.destroy();
        } catch (e) {
          console.warn('[HLS] Error during cleanup:', e);
        }
        hlsInstanceRef.current = null;
      }
    };
  }, [hlsUrl]); // Only depend on hlsUrl

  // Enhanced autoplay handler with telemetry
  const handleAutoplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !autoplay || autoplayAttempted || isPlaying) return;
    
    console.log('[HLSPlayer] Triggering autoplay handler');
    setAutoplayAttempted(true);
    
    const success = await safePlayAfterAnimation(video);
    if (success) {
      setIsPlaying(true);
      onPlay?.();
      logVideoTelemetry('video_src_swap_autoplay_success');
    } else {
      logVideoTelemetry('video_src_swap_autoplay_blocked');
    }
  }, [autoplay, autoplayAttempted, isPlaying, onPlay]);

  // Handle autoplay when both HLS and video are ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || !isVideoReady || !isHLSLoaded || autoplayAttempted) return;

    handleAutoplay();
  }, [autoplay, isVideoReady, isHLSLoaded, autoplayAttempted, handleAutoplay]);

  // Handle external autoplay control
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !externallyManaged || !isHLSLoaded) return;

    if (autoplay && !isPlaying) {
      safePlay(video);
    } else if (!autoplay && isPlaying) {
      video.pause();
    }
  }, [autoplay, externallyManaged, isHLSLoaded, isPlaying]);

  // Add visibility change handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Pause when hidden
        if (!video.paused) {
          console.log('[HLSPlayer] Document hidden, pausing video');
          video.pause();
        }
      } else {
        // Resume when visible if autoplay is enabled and video should be playing
        if (autoplay && video.paused && !video.getAttribute('data-autoplay-blocked')) {
          console.log('[HLSPlayer] Document visible, attempting to resume video');
          const success = await safePlay(video);
          if (success) {
            setIsPlaying(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoplay]);

  // Video event handlers
  const handleVideoReady = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[HLSPlayer] Video ready event fired');

    // Apply iOS nudge on loadeddata before potential autoplay
    if (isIOS && video.currentTime === 0) {
      try {
        video.currentTime = 0.001;
      } catch {
        // Ignore errors setting currentTime
      }
    }

    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
      setIsVideoReady(true);
      // Trigger autoplay handler
      handleAutoplay();
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleVideoWaiting = () => {
    console.log('[HLSPlayer] Video waiting/stalled');
    // Minimal handling: just log for now as requested
  };

  const handleVideoStalled = () => {
    console.log('[HLSPlayer] Video stalled');
    // Minimal handling: just log for now as requested
  };

  const handleVideoClick = () => {
    if (externallyManaged) {
      onClick?.();
      return;
    }

    const video = videoRef.current;
    if (!video || !isHLSLoaded) return;

    if (video.paused) {
      safePlay(video);
    } else {
      video.pause();
    }
    
    onClick?.();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  // Determine poster visibility: show until video is playing
  const showPoster = !isPlaying && poster && isPosterLoaded;

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Poster Image - stays visible until video starts playing */}
      {poster && (
        <img
          ref={posterRef}
          src={poster}
          alt="Video poster"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          } ${showPoster ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          onLoad={() => setIsPosterLoaded(true)}
          onError={() => setIsPosterLoaded(false)}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className={`feed-card-video w-full h-full ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        muted
        playsInline
        webkit-playsinline="true"
        loop={loop}
        preload="metadata"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        poster={poster}
        onLoadedData={handleVideoReady}
        onCanPlay={handleVideoReady}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onWaiting={handleVideoWaiting}
        onStalled={handleVideoStalled}
        onEnded={onEnded}
        onClick={handleVideoClick}
      />

      {/* Mute Button */}
      {showMuteButton && (
        <button
          className="absolute top-2 right-2 bg-black/50 text-white border-0 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-20"
          onClick={toggleMute}
          aria-label="Toggle sound"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
});

FlickerFreeHLSPlayer.displayName = 'FlickerFreeHLSPlayer';

export default FlickerFreeHLSPlayer;