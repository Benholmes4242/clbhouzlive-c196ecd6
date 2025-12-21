import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';

interface GridAutoplayVideoProps {
  src: string;
  poster?: string;
  className?: string;
  onCanPlay?: () => void;
}

/**
 * Lightweight HLS-aware video component for grid autoplay.
 * Handles both native HLS (Safari) and HLS.js (Chrome/Firefox).
 * Stays muted + looped for grid preview.
 */
const GridAutoplayVideo = forwardRef<HTMLVideoElement, GridAutoplayVideoProps>(
  ({ src, poster, className, onCanPlay }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hlsReadyRef = useRef(false);

    // Expose video element to parent
    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      const isHLS = src.includes('.m3u8');
      video.dataset.gridVideoSrc = src;
      hlsReadyRef.current = false;

      // Native HLS support (Safari)
      if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
        delete video.dataset.gridUsesHlsJs;
        video.src = src;
        hlsReadyRef.current = true;
        return;
      }

      // HLS.js for Chrome/Firefox
      if (isHLS && Hls.isSupported()) {
        video.dataset.gridUsesHlsJs = '1';

        hlsRef.current = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
          maxBufferLength: 8,
          maxMaxBufferLength: 15,
          backBufferLength: 5,
        });

        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          hlsReadyRef.current = true;
          // Signal that we're ready to play
          onCanPlay?.();
        });

        hlsRef.current.on(Hls.Events.ERROR, (_, data) => {
          if (import.meta.env.DEV && data.fatal) {
            console.error('[GridAutoplayVideo][HLS Error]', data.type, data.details);
          }
        });

        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(video);

        return () => {
          hlsRef.current?.destroy();
          hlsRef.current = null;
          hlsReadyRef.current = false;
          delete video.dataset.gridUsesHlsJs;
        };
      }

      // Fallback: try direct src (for non-HLS)
      delete video.dataset.gridUsesHlsJs;
      video.src = src;
      hlsReadyRef.current = true;
    }, [src, onCanPlay]);

    return (
      <video
        ref={videoRef}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={onCanPlay}
        className={className}
      />
    );
  }
);

GridAutoplayVideo.displayName = 'GridAutoplayVideo';

export default GridAutoplayVideo;
