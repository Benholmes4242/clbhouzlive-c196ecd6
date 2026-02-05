/**
 * HLSPlayer - LEGACY WRAPPER
 * 
 * This file now wraps UnifiedVideoPlayer for backward compatibility.
 * All new code should use UnifiedVideoPlayer directly from '@/media'.
 * 
 * @deprecated Use UnifiedVideoPlayer from '@/media' instead
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from './components/UnifiedVideoPlayer';
import type { MediaError } from './types';

import type { MediaSurface } from './runtime/MediaRuntime';

export interface HLSPlayerProps {
  src: string;
  mp4FallbackUrl?: string;
  posterUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  aspectRatio?: '3:4' | '16:9' | '1:1' | '9:16' | 'auto';
  objectFit?: 'cover' | 'contain';
  showMuteButton?: boolean;
  showPlayButton?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onClick?: () => void;
  onError?: (error: Error) => void;
  onLoadedData?: () => void;
  onCanPlayThrough?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onFatalError?: (error: Error, triedMp4: boolean) => void;
  externallyManaged?: boolean;
  startTime?: number;
  preload?: 'none' | 'metadata' | 'auto';
  managedByMediaRuntime?: boolean;
  showScrubber?: boolean;
  mediaId?: string;
  customLoadingComponent?: React.ReactNode;
  /** Explicit surface override for spinner suppression */
  surface?: MediaSurface;
}

export interface HLSPlayerRef {
  play: () => Promise<boolean>;
  pause: () => void;
  seek: (time: number) => void;
  getElement: () => HTMLVideoElement | null;
  getCurrentTime: () => number;
  getDuration: () => number;
  attach: () => void;
  detach: () => void;
  isAttached: () => boolean;
}

/**
 * @deprecated Use UnifiedVideoPlayer from '@/media' instead
 */
const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>((props, ref) => {
const {
    src,
    mp4FallbackUrl,
    posterUrl,
    autoplay = false,
    muted = true,
    loop = false,
    className,
    aspectRatio = 'auto',
    objectFit = 'cover',
    showMuteButton = false,
    showPlayButton = false,
    onPlay,
    onPause,
    onEnded,
    onClick,
    onError,
    onLoadedData,
    onCanPlayThrough,
    onTimeUpdate,
    startTime,
    preload = 'auto',
    managedByMediaRuntime = false,
    showScrubber = false,
    mediaId,
    surface: explicitSurface,
  } = props;

  const playerRef = useRef<UnifiedVideoPlayerRef>(null);

  useImperativeHandle(ref, () => ({
    play: async () => playerRef.current?.play() ?? false,
    pause: () => playerRef.current?.pause(),
    seek: (time: number) => playerRef.current?.seek(time),
    getElement: () => playerRef.current?.getVideoElement() ?? null,
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    getDuration: () => playerRef.current?.getDuration() ?? 0,
    attach: () => playerRef.current?.attach(),
    detach: () => playerRef.current?.detach(),
    isAttached: () => playerRef.current?.isAttached() ?? false,
  }), []);

  const handleError = (error: MediaError) => {
    onError?.(new Error(error.message));
  };

  return (
    <UnifiedVideoPlayer
      ref={playerRef}
      src={src}
      mp4FallbackUrl={mp4FallbackUrl}
      posterUrl={posterUrl}
      autoplay={autoplay}
      muted={muted}
      loop={loop}
      className={className}
      aspectRatio={aspectRatio}
      objectFit={objectFit}
      showMuteButton={showMuteButton}
      showPlayButton={showPlayButton}
      scrubber={showScrubber}
      startTime={startTime}
      preload={preload}
      managedByMediaRuntime={managedByMediaRuntime}
      mediaId={mediaId}
      surface={explicitSurface ?? (managedByMediaRuntime ? 'clubhouse' : 'grid')}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onClick={onClick}
      onError={handleError}
      onLoadedData={onLoadedData}
      onCanPlayThrough={onCanPlayThrough}
      onTimeUpdate={onTimeUpdate}
    />
  );
});

HLSPlayer.displayName = 'HLSPlayer';

export default HLSPlayer;
