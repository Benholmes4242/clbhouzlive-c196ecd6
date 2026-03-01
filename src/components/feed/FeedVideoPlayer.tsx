import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { isCloudflareStreamUrl, uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface FeedVideoPlayerProps {
  src: string;
  hlsUrl?: string;
  poster?: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  autoplay?: boolean;
  onClick?: () => void;
  trimStart?: number | null;
  trimEnd?: number | null;
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
  hlsUrl: propHlsUrl,
  poster: propPoster,
  className = '',
  muted = true,
  loop = false,
  playsInline = true,
  preload = 'metadata',
  autoplay = false,
  onClick
}, ref) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [apiHlsUrl, setApiHlsUrl] = useState<string | null>(null);
  const [apiPoster, setApiPoster] = useState<string | null>(null);

  // Extract video ID and fetch from API
  const uid = uidFromNode({ src, hls_url: propHlsUrl });
  
  useEffect(() => {
    if (uid && !propHlsUrl) {
      getCloudflareStreamHLS(uid).then(setApiHlsUrl);
    }
    if (uid && !propPoster) {
      getCloudflareStreamPoster(uid).then(setApiPoster);
    }
  }, [uid, propHlsUrl, propPoster]);

  // Use prop values first, then API values, then fallbacks using centralized config
  const hlsUrl = propHlsUrl || apiHlsUrl || (uid ? generateStreamHlsUrl(uid) : null);
  const poster = propPoster || apiPoster || (uid ? generateStreamThumbnailUrl(uid, { height: 600 }) : undefined);

  // PLAYBACK_AUTHORITY_ALLOWED: Exposes underlying HLSPlayer element for parent control via MediaRuntime
  useImperativeHandle(ref, () => {
    const video = playerRef.current?.getElement();
    if (video) {
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
  }, []);

  // Validate video source
  if (!hlsUrl || typeof hlsUrl !== 'string' || hlsUrl.trim() === '') {
    console.error('FeedVideoPlayer - Invalid HLS source:', { src, hlsUrl });
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <p className="text-muted-foreground text-sm">Invalid video source</p>
      </div>
    );
  }

  // UNIFIED WITH CLUBHOUSE: Use HLSPlayer with visibility-based autoplay
  return (
    <HLSPlayer
      ref={playerRef}
      src={hlsUrl}
      posterUrl={poster}
      muted={muted}
      loop={loop}
      autoplay={autoplay}
      showMuteButton={false}
      managedByMediaRuntime={false}
      externallyManaged={false}
      preload="auto"
      className={className}
      onClick={onClick}
    />
  );
});

FeedVideoPlayer.displayName = 'FeedVideoPlayer';

export default FeedVideoPlayer;