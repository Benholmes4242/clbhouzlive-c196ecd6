import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface FeedVideoPlayerProps {
  src: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onClick?: () => void;
}

declare global {
  interface Window {
    Hls: any;
  }
}

const FeedVideoPlayer = forwardRef<HTMLVideoElement, FeedVideoPlayerProps>(({
  src,
  className = '',
  muted = true,
  loop = false,
  playsInline = true,
  preload = 'metadata',
  onClick
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Expose the video element to parent via ref
  useImperativeHandle(ref, () => videoRef.current!, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Validate video source
    if (!src || typeof src !== 'string' || src.trim() === '') {
      console.error('FeedVideoPlayer - Invalid video source:', src);
      return;
    }

    // Clear any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS is needed and if source is a proper URL
    const isValidUrl = src.startsWith('http') || src.startsWith('/');
    const isHLS = src.includes('.m3u8') || src.includes('cloudflarestream.com');
    
    // Reduced logging - only log errors
    if (!isValidUrl) {
      console.error('FeedVideoPlayer - Invalid video URL format:', src);
      return;
    }
    
    if (isHLS) {
      // Load HLS.js if not already loaded
      if (!window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => initializeHLS();
        script.onerror = () => {
          console.error('FeedVideoPlayer - Failed to load HLS.js');
          video.src = src; // Fallback to direct src
        };
        document.head.appendChild(script);
      } else {
        initializeHLS();
      }
    } else {
      // Regular video
      video.src = src;
    }

    function initializeHLS() {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          startLevel: -1, // Let HLS.js choose the best quality
          capLevelToPlayerSize: true,
          debug: false,
          progressive: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          enableSoftwareAES: false
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          console.error('FeedVideoPlayer - HLS Error:', event, data);
          if (data.fatal) {
            console.error('FeedVideoPlayer - Fatal HLS Error, trying fallback');
            // Fallback to direct video src
            video.src = src;
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      } else {
        // Fallback to regular video
        video.src = src;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload="metadata"
      crossOrigin="anonymous"
      onClick={onClick}
      onError={(e) => {
        console.error('FeedVideoPlayer - Video error:', e, 'Source:', src);
      }}
    />
  );
});

FeedVideoPlayer.displayName = 'FeedVideoPlayer';

export default FeedVideoPlayer;