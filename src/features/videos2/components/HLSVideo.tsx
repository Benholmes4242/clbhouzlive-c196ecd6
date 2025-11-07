import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

type HLSVideoProps = {
  hlsUrl?: string;
  src?: string;
  poster: string;
  className?: string;
  autoRegister?: (video: HTMLVideoElement | null) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  loop?: boolean;
};

export function HLSVideo({
  hlsUrl,
  src,
  poster,
  className = '',
  autoRegister,
  onMouseEnter,
  onMouseLeave,
  loop = true,
}: HLSVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Register with autoplay controller
    if (autoRegister) {
      autoRegister(video);
    }

    // HLS setup
    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
    } else if (src) {
      // Fallback to MP4
      video.src = src;
    }

    return () => {
      if (autoRegister) {
        autoRegister(null);
      }
    };
  }, [hlsUrl, src, autoRegister]);

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      muted
      playsInline
      preload="metadata"
      loop={loop}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disablePictureInPicture
      controlsList="nodownload"
    />
  );
}
