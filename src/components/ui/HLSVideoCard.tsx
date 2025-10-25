import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HLSVideoCardProps {
  hlsUrl: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  showControls?: boolean;
  showMuteButton?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  externallyManaged?: boolean; // Disable internal autoplay when externally managed
  shouldAttach?: boolean; // Prebuffer when near viewport
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
  autoplay = false,
  muted = true,
  loop = true,
  onPlay,
  onPause,
  onClick,
  onEnded,
  externallyManaged = false,
  shouldAttach = false
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

    const setupHls = async () => {
      try {
        const Hls = await loadHlsJs();
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 10,
            backBufferLength: 5,
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
        }
      } catch (error) {
        console.error('Error loading HLS:', error);
        setHasError(true);
      }
    };

    setupHls();
  }, [hlsUrl, shouldAttach, attached]);

  // Mark "ready" on first decodable frame
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedData = () => {
      console.log('[OpenFlow]', 'metadataLoaded', performance.now());
      setReady(true);
    };
    const onCanPlay = () => {
      console.log('[OpenFlow]', 'canplay', performance.now());
      setReady(true);
    };
    const onPlaying = () => {
      console.log('[OpenFlow]', 'playing', performance.now());
    };

    v.addEventListener('loadeddata', onLoadedData);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('playing', onPlaying);
    return () => {
      v.removeEventListener('loadeddata', onLoadedData);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Play when autoplay && ready && attached, retry on all changes (critical for mobile)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Mobile Safari requires all conditions to be true before allowing play()
    if (autoplay && attached && ready) {
      const start = async () => {
        console.log('[OpenFlow]', 'attemptPlay', performance.now());
        try {
          const playPromise = v.play();
          if (playPromise) {
            await playPromise;
            console.log('[OpenFlow]', 'playSucceeded', performance.now());
            setOverlayHidden(true);
            onPlay?.();
          }
        } catch (err) {
          console.log('[OpenFlow]', 'playFailed', performance.now(), err);
          // Silently handle mobile autoplay blocks and retry once shortly after
          setTimeout(() => {
            const el = videoRef.current;
            if (!el) return;
            if (!(autoplay && attached && ready)) return;
            el.play().then(() => {
              setOverlayHidden(true);
              onPlay?.();
            }).catch(() => {});
          }, 100);
        }
      };
      start();
    } else if (!autoplay) {
      v.pause();
      if (!ready) setOverlayHidden(false);
      onPause?.();
    }
  }, [autoplay, attached, ready, onPlay, onPause]);

  // Intersection observer for autoplay - only when NOT externally managed
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || externallyManaged) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          try {
            await video.play();
            onPlay?.();
          } catch (error) {
            // Autoplay failed, which is expected in some browsers
          }
        } else {
          video.pause();
          onPause?.();
        }
      },
      { threshold: 0.1 } // Changed to start autoplay as soon as video comes into view
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, [hlsUrl, externallyManaged, onPlay, onPause]);

  // Handle mute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);

    if (!video.paused) {
      video.play().catch(() => {});
    }
  };

  // Handle video click - if externally managed, just call onClick
  const handleVideoClick = () => {
    if (externallyManaged) {
      onClick?.();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {
        // Autoplay failed, but don't show error overlay if video loads successfully  
      });
    } else {
      video.pause();
    }
    
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
        webkit-playsinline="true"
        autoPlay={autoplay}
        muted={isMuted}
        loop={loop}
        controls={showControls}
        poster={poster}
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

      {/* Error overlay - only show if video completely failed to load */}
      {hasError && !isLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <div className="text-sm opacity-80 mb-2">⚠️ Video Error</div>
            <div className="text-xs opacity-60">
              Unable to load video source
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

HLSVideoCard.displayName = 'HLSVideoCard';

export default HLSVideoCard;