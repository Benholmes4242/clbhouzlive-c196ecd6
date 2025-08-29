import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { isCloudflareStreamUrl, uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';

interface FeedVideoPlayerProps {
  src: string;
  hlsUrl?: string;
  poster?: string;
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
  hlsUrl: propHlsUrl,
  poster: propPoster,
  className = '',
  muted = true,
  loop = false,
  playsInline = true,
  preload = 'metadata',
  onClick
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Use prop values first, then API values, then fallbacks
  const hlsUrl = propHlsUrl || apiHlsUrl || (uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null);
  const poster = propPoster || apiPoster || (uid ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600` : undefined);

  // Expose unified ref interface to parent
  useImperativeHandle(ref, () => {
    const video = videoRef.current;
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

  // Use HLS Video Card for all videos
  return (
    <HLSVideoCard
      hlsUrl={hlsUrl}
      poster={poster}
      className={className}
      muted={muted}
      loop={loop}
      autoplay={false} // Control autoplay externally
      showMuteButton={false} // Let parent handle mute controls
      onClick={onClick}
    />
  );
});

FeedVideoPlayer.displayName = 'FeedVideoPlayer';

export default FeedVideoPlayer;