import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { loadHlsJs } from '@/utils/hlsLoader';

interface HLSVideoCardProps {
  hlsUrl: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  showControls?: boolean;
  showMuteButton?: boolean;
  showCenterSpinner?: boolean; // Show loading spinner (default: false for Clubhouse)
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  externallyManaged?: boolean; // Disable internal autoplay when externally managed
  shouldAttach?: boolean; // Prebuffer when near viewport
  isNearby?: boolean; // For off-screen cleanup
  isActive?: boolean; // Phase 2 Fix #7: Explicit active state for proper cleanup
}

declare global {
  interface Window {
    Hls: any;
  }
}

const HLSVideoCard = forwardRef<HTMLVideoElement, HLSVideoCardProps>(({
  hlsUrl,
  poster,
  className = '',
  aspectRatio = '4/5',
  fit = 'cover',
  showControls = false,
  showMuteButton = false,
  showCenterSpinner = false,
  autoplay = false,
  muted = true,
  loop = true,
  onPlay,
  onPause,
  onClick,
  onEnded,
  externallyManaged = false,
  shouldAttach = false,
  isNearby = true,
  isActive = true // Phase 2 Fix #7: Default to true for backward compatibility
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [attached, setAttached] = useState(false);
  const [ready, setReady] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  // Sync internal muted state with prop changes
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Expose video element and methods to parent
  useImperativeHandle(ref, () => {
    const video = videoRef.current;
    if (video) {
      return video;
    }
    return null;
  }, []);

  // Check if browser supports native HLS
  const canPlayHLSNatively = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  };

  // Attach HLS source to video when shouldAttach becomes true
  useEffect(() => {
    const v = videoRef.current;
    if (!v || attached || !shouldAttach) return;

    // iOS needs both attributes
    (v as any).setAttribute?.('webkit-playsinline', 'true');

    const canUseNativeHLS = v.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (canUseNativeHLS) {
      v.src = hlsUrl;
      try { v.load?.(); } catch {}
      setAttached(true);
      setIsLoaded(true);
      return;
    }

    const setupHls = async () => {
      try {
        const Hls = await loadHlsJs();
        if (!Hls || !Hls.isSupported()) return;
        
        const hls = new Hls({
          maxBufferLength: 6,
          backBufferLength: 3,
        });
        
        // Handle HLS errors
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            setHasError(true);
          }
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(v);
        const onParsed = () => setAttached(true);
        hls.on(Hls.Events.MANIFEST_PARSED, onParsed);
        hlsInstanceRef.current = hls;
        setIsLoaded(true);
        
        return () => {
          hls.off(Hls.Events.MANIFEST_PARSED, onParsed);
          hls.destroy();
        };
      } catch (error) {
        console.error('Error loading HLS:', error);
        setHasError(true);
      }
    };

    setupHls();
  }, [hlsUrl, shouldAttach, attached]);

  // Mark "ready" on first decodable frame and wire video events for loading/error states
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handlePlaying = () => {
      setIsBuffering(false);
      setHasError(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleStalled = () => {
      setIsBuffering(true);
    };

    const handleError = () => {
      setHasError(true);
      setIsBuffering(false);
    };

    const onLoadedData = () => {
      setReady(true);
    };
    
    const onCanPlay = () => {
      setReady(true);
    };

    v.addEventListener('loadeddata', onLoadedData);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('playing', handlePlaying);
    v.addEventListener('waiting', handleWaiting);
    v.addEventListener('stalled', handleStalled);
    v.addEventListener('error', handleError);
    
    return () => {
      v.removeEventListener('loadeddata', onLoadedData);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('playing', handlePlaying);
      v.removeEventListener('waiting', handleWaiting);
      v.removeEventListener('stalled', handleStalled);
      v.removeEventListener('error', handleError);
    };
  }, []);

  // Play only when autoplay && ready && attached, then fade overlay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (autoplay && attached) {
      // PLAYBACK_AUTHORITY_ALLOWED: Controlled component - parent sets autoplay prop via MediaRuntime bridge
      const start = async () => {
        if (!ready) return;
        try {
          await v.play();
          setOverlayHidden(true);
          onPlay?.();
        } catch {
          // Ignore autoplay promise errors
        }
      };
      start();
    } else {
      v.pause();
      if (!ready) setOverlayHidden(false);
      onPause?.();
    }
  }, [autoplay, attached, ready, onPlay, onPause]);

  // Manual seamless loop handler (fixes black flicker)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !loop) return;

    const handleEnded = () => {
      v.currentTime = 0;
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore autoplay errors
        });
      }
    };

    v.addEventListener('ended', handleEnded);
    return () => v.removeEventListener('ended', handleEnded);
  }, [loop]);

  // Phase 2 Fix #7: Cleanup when video becomes inactive (not currently visible)
  useEffect(() => {
    if (!isActive) {
      const v = videoRef.current;
      if (!v) return;

      // Pause video
      v.pause();

      // Destroy HLS instance and release buffer
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }

      // Clear video source
      v.removeAttribute('src');
      v.load();
      setAttached(false);
    }
  }, [isActive]);

  // Off-screen cleanup (frees memory) - only runs if isNearby becomes false
  useEffect(() => {
    if (isNearby) return;

    const v = videoRef.current;
    if (!v) return;

    v.pause();

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    v.removeAttribute('src');
    v.load();
    setAttached(false);
  }, [isNearby]);

  // REMOVED: Intersection observer for autoplay
  // Playback is now controlled by MediaRuntime via the autoplay prop.
  // When externallyManaged=true, parent controls playback.
  // When autoplay=true + attached, the useEffect above handles it.
  // 
  // This component should NOT decide when to play based on visibility.
  // That is MediaRuntime's job via useMediaAutoplay.

  // Handle mute toggle - mute is local UI state, not playback control
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  // Handle video click - always delegate to parent via onClick
  // No internal play/pause control - parent decides via autoplay prop
  const handleVideoClick = () => {
    onClick?.();
  };

  // Compute fit classes
  const isCover = fit === 'cover';
  const videoFitClass = isCover ? 'object-cover' : 'object-contain';
  const overlayFitClass = isCover ? 'bg-cover' : 'bg-contain';

  return (
    <div
      ref={containerRef}
      className={`videoContainer relative overflow-hidden bg-black data-[ready=true]:bg-transparent ${className}`}
      style={{ aspectRatio }}
      data-ready="false"
    >
      <video
        ref={videoRef}
        className={`videoEl absolute inset-0 w-full h-full ${videoFitClass}`}
        playsInline
        muted={isMuted}
        controls={showControls}
        preload="metadata"
        onClick={handleVideoClick}
        onEnded={onEnded}
        onLoadedData={() => {
          if (containerRef.current) {
            containerRef.current.setAttribute('data-ready', 'true');
          }
        }}
      />
      
      <div
        className={`thumbOverlay absolute inset-0 bg-black bg-center bg-no-repeat ${overlayFitClass} transition-opacity duration-\[120ms\] ease-out ${overlayHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${poster})` }}
      />
      
      {showMuteButton && (
        <button
          className="absolute top-2 right-2 bg-black/50 text-white border-0 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
          onClick={toggleMute}
          aria-label="Toggle sound"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* Buffering/Loading overlay */}
      {showCenterSpinner && isBuffering && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-black/40">
          <div className="h-7 w-7 animate-spin rounded-full border border-white/20 border-t-white/80 opacity-80" />
        </div>
      )}

      {/* Error overlay - only show if video completely failed to load */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center text-body-md text-white/85">
          <p className="mb-3">Couldn't load this round.</p>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setIsBuffering(true);
              const v = videoRef.current;
              if (v) {
                v.load();
              }
            }}
            className="rounded-full bg-white px-4 py-1.5 text-body-sm font-medium text-black"
          >
            Tap to try again
          </button>
        </div>
      )}
    </div>
  );
});

HLSVideoCard.displayName = 'HLSVideoCard';

export default HLSVideoCard;