import React, { useRef, useEffect } from 'react';

interface VideoFitToContainProps {
  src: string;
  poster?: string;
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export function VideoFitToContain({ 
  src, 
  poster,
  muted = true,
  autoplay = true,
  loop = true,
  controls = false,
  onPlay,
  onPause,
  onEnded
}: VideoFitToContainProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;

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

    const canPlayHLSNatively = () => {
      const video = document.createElement('video');
      return video.canPlayType('application/vnd.apple.mpegurl') !== '';
    };

    // HLS initialization
    if (src.endsWith('.m3u8')) {
      if (canPlayHLSNatively()) {
        el.src = src;
      } else {
        loadHlsJs().then((Hls) => {
          if (Hls && Hls.isSupported()) {
            const hls = new Hls({ 
              autoStartLoad: false,
              maxBufferLength: 10,
              backBufferLength: 5,
            });
            hls.loadSource(src);
            hls.attachMedia(el);
            
            const handlePlay = () => hls.startLoad();
            el.addEventListener('play', handlePlay, { once: true });
            
            return () => {
              el.removeEventListener('play', handlePlay);
              hls.destroy();
            };
          }
        }).catch(console.error);
      }
    } else {
      el.src = src; // MP4 fallback, etc.
    }

    if (autoplay) {
      el.play().catch(() => {
        // Autoplay failed, which is expected in some browsers
      });
    }
  }, [src, autoplay]);

  return (
    <video
      ref={ref}
      className="max-w-full max-h-full object-contain bg-black select-none"
      playsInline
      webkit-playsinline="true"
      preload="metadata"
      muted={muted}
      loop={loop}
      controls={controls}
      poster={poster}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      draggable={false}
    />
  );
}