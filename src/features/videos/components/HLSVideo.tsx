import { useEffect, useRef } from "react";
import Hls from "hls.js";

type Props = {
  hlsUrl?: string;
  src?: string;        // fallback MP4
  poster?: string;
  className?: string;
  autoRegister?: (el: HTMLVideoElement | null) => void; // from useAutoplay
};

/**
 * HLS video player component with fallback to MP4
 * Supports Cloudflare Stream HLS playback using hls.js
 */
export default function HLSVideo({ hlsUrl, src, poster, className, autoRegister }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let hls: Hls | null = null;

    if (hlsUrl && Hls.isSupported()) {
      hls = new Hls({ autoStartLoad: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl; // Safari native HLS
    } else if (src) {
      video.src = src;    // MP4 fallback
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, src]);

  return (
    <video
      ref={(el) => { ref.current = el; autoRegister?.(el); }}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
