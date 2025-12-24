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
        startLevel: 0, // Start with lowest quality for fast first frame
        abrEwmaDefaultEstimate: 500000, // 500kbps initial estimate
      });
      
      // Log manifest parsing
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels?.map((l, i) => ({
          idx: i,
          res: `${l.width}x${l.height}`,
          kbps: Math.round((l.bitrate || 0) / 1000),
        }));
        console.log('[HLSVideo] MANIFEST_PARSED', {
          url: hlsUrl?.slice(-40),
          levels,
          startLevel: hls.startLevel,
        });
      });
      
      // Log quality switches
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels?.[data.level];
        console.log('[HLSVideo] LEVEL_SWITCHED', {
          level: data.level,
          res: level ? `${level.width}x${level.height}` : 'N/A',
          kbps: level?.bitrate ? Math.round(level.bitrate / 1000) : 'N/A',
        });
      });
      
      // Log fragment loading with timing
      hls.on(Hls.Events.FRAG_LOADING, (_, data) => {
        console.log('[HLSVideo] FRAG_LOADING', {
          sn: data.frag.sn,
          duration: data.frag.duration?.toFixed(2) + 's',
          level: data.frag.level,
        });
      });
      
      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        const stats = data.frag.stats;
        const bytes = stats?.total || 0;
        const loadTime = (stats?.loading?.end || 0) - (stats?.loading?.start || 0);
        console.log('[HLSVideo] FRAG_LOADED', {
          sn: data.frag.sn,
          sizeKB: (bytes / 1024).toFixed(1),
          loadMs: loadTime.toFixed(0),
          level: data.frag.level,
        });
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
