/**
 * UnifiedVideoPlayer — [VIDEOSTUB] poster-only chassis (Stage D remediation)
 *
 * All HLS/<video>/attachMedia/MediaRuntime playback logic has been removed.
 * Renders the poster image only. The component + ref API are exported as
 * inert no-ops so the 6 importers (enhanced-video-player, VideoPlayerModal,
 * CarouselSlide, UnifiedMediaTile, MediaDisplay, VideoOverlay re-export, and
 * HLSPlayer wrapper) continue to compile without change.
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import { cn } from '@/lib/utils';
import type { MediaSurface } from '@/media/runtime/MediaRuntime';
import type { PlaybackState, MediaError, AspectRatio } from '@/media/types';

// ============ Types (preserved) ============

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

const ASPECT_CLASS: Record<string, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
};

if (typeof window !== 'undefined' && !(window as any).__VIDEOSTUB_LOGGED__) {
  (window as any).__VIDEOSTUB_LOGGED__ = true;
  // eslint-disable-next-line no-console
  console.log('[VIDEOSTUB] active — UnifiedVideoPlayer is poster-only');
}

export const UnifiedVideoPlayer = forwardRef<UnifiedVideoPlayerRef, UnifiedVideoPlayerProps>(
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

    const containerRef = useRef<HTMLDivElement>(null);

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

    // Fire onLoadedData once so consumers that gate UI on it don't hang.
    useEffect(() => {
      if (!posterUrl) return;
      const t = setTimeout(() => onLoadedData?.(), 0);
      return () => clearTimeout(t);
    }, [posterUrl, onLoadedData]);

    const aspectClass = ASPECT_CLASS[aspectRatio as string] ?? '';

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden bg-black', aspectClass, className)}
        style={style}
        onClick={onClick}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            draggable={false}
            className={cn(
              'w-full h-full',
              objectFit === 'contain' ? 'object-contain' : 'object-cover'
            )}
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>
    );
  }
);

UnifiedVideoPlayer.displayName = 'UnifiedVideoPlayer';

export default UnifiedVideoPlayer;
