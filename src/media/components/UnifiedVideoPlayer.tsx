/**
 * UnifiedVideoPlayer - STUBBED (video teardown Stage B)
 *
 * Poster-only chassis. No <video> element, no HLS, no autoplay. Renders the
 * posterUrl (or a solid placeholder) inside a container that matches the
 * original aspectRatio/objectFit/className/style props. All imperative ref
 * methods are inert no-ops that return neutral values.
 *
 * Public API preserved so every caller (HLSPlayer, CarouselSlide, etc.) keeps
 * compiling and rendering its existing UI shell.
 */

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { MediaSurface } from '@/media/runtime/MediaRuntime';
import type { PlaybackState, MediaError, AspectRatio } from '@/media/types';

// ============ Types (unchanged public shape) ============

export interface UnifiedVideoPlayerProps {
  src?: string;
  streamId?: string;
  posterUrl?: string;
  mp4FallbackUrl?: string;

  aspectRatio?: AspectRatio | '3:4' | '16:9' | '1:1' | '9:16';
  objectFit?: 'cover' | 'contain';

  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;

  surface?: MediaSurface;

  controls?: boolean;
  scrubber?: boolean;
  showPlayButton?: boolean;
  showMuteButton?: boolean;
  showQualityBadge?: boolean;

  preload?: 'auto' | 'metadata' | 'none';
  startTime?: number;
  mediaId?: string;
  managedByMediaRuntime?: boolean;

  trimStart?: number | null;
  trimEnd?: number | null;

  className?: string;
  style?: React.CSSProperties;

  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onClick?: () => void;
  onError?: (error: MediaError) => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onStateChange?: (state: PlaybackState) => void;
  onLoadedData?: () => void;
  onCanPlayThrough?: () => void;
}

export interface UnifiedVideoPlayerRef {
  play: () => Promise<boolean>;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  seekToPercent: (percent: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackState: () => PlaybackState;
  isPaused: () => boolean;
  isMuted: () => boolean;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  attach: () => void;
  detach: () => void;
  isAttached: () => boolean;
}

// ============ Poster-only stub ============

const ASPECT_MAP: Record<string, string> = {
  '3:4': '3 / 4',
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '4:5': '4 / 5',
  '2:1': '2 / 1',
  '3:2': '3 / 2',
};

const UnifiedVideoPlayerInner = forwardRef<UnifiedVideoPlayerRef, UnifiedVideoPlayerProps>(
  (props, ref) => {
    const {
      posterUrl,
      aspectRatio = 'auto',
      objectFit = 'cover',
      className,
      style,
      onClick,
      onLoadedData,
    } = props;

    useImperativeHandle(ref, () => ({
      play: async () => false,
      pause: () => {},
      toggle: () => {},
      seek: () => {},
      seekToPercent: () => {},
      getCurrentTime: () => 0,
      getDuration: () => 0,
      getPlaybackState: () => 'idle' as PlaybackState,
      isPaused: () => true,
      isMuted: () => true,
      mute: () => {},
      unmute: () => {},
      toggleMute: () => {},
      getVideoElement: () => null,
      attach: () => {},
      detach: () => {},
      isAttached: () => false,
    }), []);

    // Fire onLoadedData once so callers that gate UI on it don't get stuck.
    useEffect(() => {
      if (!onLoadedData) return;
      const t = setTimeout(() => onLoadedData(), 0);
      return () => clearTimeout(t);
    }, [onLoadedData]);

    const ratio =
      aspectRatio && aspectRatio !== 'auto' ? ASPECT_MAP[aspectRatio as string] : undefined;

    return (
      <div
        className={cn('relative w-full h-full overflow-hidden bg-black', className)}
        style={{ aspectRatio: ratio, ...style }}
        onClick={onClick}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit, objectPosition: 'center' }}
          />
        ) : null}
      </div>
    );
  }
);

UnifiedVideoPlayerInner.displayName = 'UnifiedVideoPlayer';

export const UnifiedVideoPlayer = React.memo(UnifiedVideoPlayerInner);

export default UnifiedVideoPlayer;
