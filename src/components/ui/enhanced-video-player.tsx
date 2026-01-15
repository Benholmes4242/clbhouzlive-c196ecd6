import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode, isCloudflareStreamUrl } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl, generateStreamMp4Url } from '@/config/cloudflareStream';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  playsInline?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  enableHLS?: boolean;
  adaptiveBitrate?: boolean;
  preloadLevel?: 'none' | 'metadata' | 'auto';
  quality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  hideControls?: boolean;
  objectFit?: 'cover' | 'contain' | 'smart';
  controls?: boolean;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onProgress?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVolumeChange?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeking?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeked?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

/**
 * EnhancedVideoPlayer - Wrapper around HLSPlayer for simpler usage
 * 
 * Provides backward-compatible API while delegating to HLSPlayer.
 * Automatically detects Cloudflare Stream URLs and generates HLS URLs.
 */
const EnhancedVideoPlayer = forwardRef<HTMLVideoElement, EnhancedVideoPlayerProps>(({
  src,
  autoplay = false,
  muted = true,
  loop = false,
  className = "",
  poster = "",
  objectFit = "contain",
  onClick,
  onPlay,
  onPause,
  onEnded,
  onLoad,
}, ref) => {
  const playerRef = useRef<HLSPlayerRef>(null);

  // Expose video element to parent via ref (for backward compatibility)
  useImperativeHandle(ref, () => {
    return playerRef.current?.getElement() as HTMLVideoElement;
  }, []);

  // Extract UID and generate HLS URL if it's a Cloudflare Stream video
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : src;
  const mp4FallbackUrl = uid ? generateStreamMp4Url(uid) : undefined;
  const videoPoster = poster || (uid ? generateStreamThumbnailUrl(uid, { height: 600 }) : undefined);

  return (
    <HLSPlayer
      ref={playerRef}
      src={hlsUrl}
      mp4FallbackUrl={mp4FallbackUrl}
      className={className}
      objectFit={objectFit === 'smart' ? 'cover' : objectFit}
      showMuteButton={false}
      showPlayButton={false}
      autoplay={autoplay}
      muted={muted}
      loop={loop}
      onClick={onClick}
      onPlay={() => {
        onPlay?.();
        onLoad?.();
      }}
      onPause={onPause}
      onEnded={onEnded}
    />
  );
});

EnhancedVideoPlayer.displayName = 'EnhancedVideoPlayer';

export default EnhancedVideoPlayer;