import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HLSVideoCardProps {
  hlsUrl: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  showControls?: boolean;
  showMuteButton?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  externallyManaged?: boolean; // Disable internal autoplay when externally managed
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
  objectFit = 'cover',
  showControls = false,
  showMuteButton = true,
  autoplay = true,
  muted = true,
  loop = true,
  onPlay,
  onPause,
  onClick,
  externallyManaged = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync internal muted state with prop changes
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Expose video element and methods to parent
  useImperativeHandle(ref, () => ({
    ...videoRef.current,
    attachHLS
  }), []);

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

  // Attach HLS source to video
  const attachHLS = async () => {
    const video = videoRef.current;
    if (!video || !hlsUrl || isLoaded) return;

    try {
      if (canPlayHLSNatively()) {
        video.src = hlsUrl;
        setIsLoaded(true);
      } else {
        const Hls = await loadHlsJs();
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 10,
            backBufferLength: 5,
          });
          
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hlsInstanceRef.current = hls;
          setIsLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error loading HLS:', error);
    }
  };

  // Intersection observer for autoplay - skip if externally managed
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || !autoplay || externallyManaged) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          await attachHLS();
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
      { threshold: 0.6 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, [hlsUrl, autoplay, externallyManaged, onPlay, onPause]);

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
      if (!isLoaded) {
        attachHLS().then(() => {
          video.play().catch(() => {});
        });
      } else {
        video.play().catch(() => {});
      }
    } else {
      video.pause();
    }
    
    onClick?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black ${className}`}
      style={{ aspectRatio }}
    >
      <video
        ref={videoRef}
        className={`w-full h-full block ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
        playsInline
        muted={isMuted}
        loop={loop}
        controls={showControls}
        poster={poster}
        preload="metadata"
        onClick={handleVideoClick}
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
    </div>
  );
});

HLSVideoCard.displayName = 'HLSVideoCard';

export default HLSVideoCard;