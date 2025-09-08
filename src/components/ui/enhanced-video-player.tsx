import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import FlickerFreeHLSPlayer from '@/components/ui/FlickerFreeHLSPlayer';
import FlickerFreeVideoPlayer from '@/components/ui/FlickerFreeVideoPlayer';
import { uidFromNode, isCloudflareStreamUrl } from '@/utils/cloudflareStreamTransform';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  enableHLS?: boolean; // Enable HLS streaming
  adaptiveBitrate?: boolean; // Enable adaptive bitrate
  preloadLevel?: 'none' | 'metadata' | 'auto';
  quality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  hideControls?: boolean; // Hide play/pause controls
  objectFit?: 'cover' | 'contain' | 'smart'; // Add smart object fit option for TikTok-style behavior
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

const EnhancedVideoPlayer = forwardRef<HTMLVideoElement, EnhancedVideoPlayerProps>(({
  src,
  autoplay = false,
  muted = true,
  loop = false,
  controls = false,
  className = "",
  poster = "",
  preloadLevel = "metadata",
  objectFit = "cover",
  enableHLS = true, // Default to true for HLS support
  hideControls = false,
  onLoadStart,
  onLoad,
  onError,
  onTimeUpdate,
  onProgress,
  onVolumeChange,
  onSeeking,
  onSeeked,
  onClick,
  onEnded
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Expose video element to parent via ref
  useImperativeHandle(ref, () => videoRef.current!, []);

  // Extract UID and generate HLS URL if it's a Cloudflare Stream video
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : src;
  const videoPoster = poster || (uid ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600` : undefined);

  // For Cloudflare Stream URLs, always use HLS
  if (isCloudflareStreamUrl(src) || enableHLS) {
    return (
      <FlickerFreeHLSPlayer
        hlsUrl={hlsUrl}
        poster={videoPoster}
        className={className}
        objectFit={objectFit === 'smart' ? 'cover' : objectFit}
        showMuteButton={false}
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        onClick={onClick}
        onPlay={() => onLoad?.()}
        onPause={() => {}}
        onEnded={onEnded}
        ref={ref}
      />
    );
  }

  // Fallback to flicker-free video player for non-Cloudflare URLs
  return (
    <FlickerFreeVideoPlayer
      ref={ref}
      src={src}
      autoplay={autoplay}
      muted={muted}
      loop={loop}
      className={className}
      poster={poster}
      objectFit={objectFit === 'smart' ? 'cover' : objectFit}
      showMuteButton={false}
      onClick={onClick}
      onPlay={() => onLoad?.()}
      onPause={() => {}}
      onEnded={onEnded}
    />
  );
});

EnhancedVideoPlayer.displayName = 'EnhancedVideoPlayer';

export default EnhancedVideoPlayer;