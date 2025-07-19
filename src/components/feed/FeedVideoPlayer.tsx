import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useSingleAudioManager } from '@/contexts/SingleAudioManager';

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
  const { setActiveVideo, clearActiveVideo } = useSingleAudioManager();
  const videoId = useRef(`feed-video-${Math.random().toString(36).substr(2, 9)}`).current;

  // Expose the video element to parent via ref
  useImperativeHandle(ref, () => videoRef.current!, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Clear any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS is needed
    const isHLS = src.includes('.m3u8') || src.includes('cloudflarestream.com');
    
    if (isHLS) {
      // Load HLS.js if not already loaded
      if (!window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => initializeHLS();
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
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            console.error('HLS Error:', data);
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

  // Handle audio management when video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!video.muted) {
        setActiveVideo(videoId, video);
      }
    };

    const handlePause = () => {
      clearActiveVideo(videoId);
    };

    const handleVolumeChange = () => {
      if (!video.muted) {
        setActiveVideo(videoId, video);
      } else {
        clearActiveVideo(videoId);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      clearActiveVideo(videoId);
    };
  }, [videoId, setActiveVideo, clearActiveVideo]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      onClick={onClick}
    />
  );
});

FeedVideoPlayer.displayName = 'FeedVideoPlayer';

export default FeedVideoPlayer;