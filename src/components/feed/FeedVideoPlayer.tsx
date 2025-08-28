import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import CloudflareIframePlayer, { CloudflareIframePlayerRef } from '@/components/ui/CloudflareIframePlayer';
import { isCloudflareStreamUrl } from '@/utils/cloudflareStreamTransform';

interface FeedVideoPlayerProps {
  src: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onClick?: () => void;
}

// Unified ref type that provides basic video controls for both implementations
export interface FeedVideoPlayerRef {
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
  duration?: number;
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  // Keep native element for backward compatibility
  element?: HTMLVideoElement | HTMLIFrameElement;
}

const FeedVideoPlayer = forwardRef<FeedVideoPlayerRef, FeedVideoPlayerProps>(({
  src,
  className = '',
  muted = true,
  loop = false,
  playsInline = true,
  preload = 'metadata',
  onClick
}, ref) => {
  const iframeRef = useRef<CloudflareIframePlayerRef>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Expose unified ref interface to parent
  useImperativeHandle(ref, () => {
    if (isCloudflareStreamUrl(src) && iframeRef.current) {
      const iframe = iframeRef.current;
      return {
        play: () => iframe.play(),
        pause: () => iframe.pause(),
        element: iframe.iframe,
        get currentTime() { return 0; }, // Async, would need proper implementation
        get duration() { return 0; },
        get paused() { return false; },
        get muted() { return true; },
        get volume() { return 0; }
      };
    } else if (videoRef.current) {
      const video = videoRef.current;
      return {
        play: () => video.play(),
        pause: () => video.pause(),
        element: video,
        get currentTime() { return video.currentTime; },
        get duration() { return video.duration; },
        get paused() { return video.paused; },
        get muted() { return video.muted; },
        get volume() { return video.volume; }
      };
    }
    return {};
  }, [src]);

  // Validate video source
  if (!src || typeof src !== 'string' || src.trim() === '') {
    console.error('FeedVideoPlayer - Invalid video source:', src);
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <p className="text-muted-foreground text-sm">Invalid video source</p>
      </div>
    );
  }

  // Use Cloudflare iframe for Stream URLs
  if (isCloudflareStreamUrl(src)) {
    return (
      <CloudflareIframePlayer
        ref={iframeRef}
        src={src}
        className={className}
        autoplay={false} // Control autoplay externally
        muted={muted}
        loop={loop}
        onClick={onClick}
        onError={() => {
          console.error('FeedVideoPlayer - Cloudflare iframe error:', src);
        }}
      />
    );
  }

  // Fallback to regular video element for non-Cloudflare URLs
  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
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