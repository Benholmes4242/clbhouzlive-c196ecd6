/**
 * InlineVideo — Clubhouse feed video tile (paused-first-frame model).
 *
 * Architecture (per Master Brief):
 *  - The video's OWN first frame is the poster. No thumbnail layer, no
 *    cross-dissolve, no `attachHlsToTile`. Element stays opacity:0 until
 *    the first frame paints, then reveals.
 *  - HLS lifecycle goes through `useHlsPool` (promote → register → demote).
 *    Teardown DEMOTES instead of destroying — this is what makes scroll-back
 *    replay instant.
 *  - `usePausedFirstFrame` forces a paused paint (iOS-safe via seek-to-0.001
 *    plus a muted micro play→pause fallback), then drives play/pause by
 *    `isActive` without re-attaching.
 *  - Registered with MediaRuntime on surface 'clubhouse' (concurrency 1) so
 *    only one tile plays at a time and the runtime auto-pauses the previous.
 */
import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useHlsPool } from '@/media/hooks/useHlsPool';
import { usePausedFirstFrame } from '@/media/hooks/usePausedFirstFrame';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import type { MediaItem } from '@/components/media-system/types/media';

interface Props {
  item: MediaItem;
  /** This tile is the single active (playing) tile. */
  isActive: boolean;
  /** Tile is within the neighbour radius — pre-decode and hold paused. */
  isNear: boolean;
  objectFit?: 'cover' | 'contain';
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  isNear,
  objectFit = 'cover',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pool = useHlsPool();

  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);

  const hlsUrl = item.hlsUrl || '';
  const regId = extractCloudflareUid(hlsUrl) || item.id;

  const { hasFirstFrame, reset } = usePausedFirstFrame(videoRef, isActive);

  // Attach when near; demote-to-pool when leaving the radius.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    if (isNear) {
      video.muted = true;
      video.playsInline = true;
      if (hlsUrl) {
        pool.attach(hlsUrl, video, item.mp4Url).then(() => {
          if (cancelled) return;
          try {
            if (video.currentTime < 0.001) video.currentTime = 0.001;
          } catch {}
        });
      } else if (item.mp4Url) {
        video.src = item.mp4Url;
      }
      return () => {
        cancelled = true;
      };
    } else {
      pool.teardown(hlsUrl);
      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNear, hlsUrl, item.mp4Url]);

  // Register with MediaRuntime (clubhouse surface = concurrency 1).
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !isNear) return;
    MediaRuntime.registerMedia({
      id: regId,
      element: video,
      surface: 'clubhouse',
      sortIndex: 0,
      observeTarget: container || video,
    });
    return () => MediaRuntime.unregisterMedia(regId);
  }, [isNear, regId]);

  // Ask runtime to play when active (runtime auto-pauses the previous).
  useEffect(() => {
    if (isActive) {
      MediaRuntime.requestPlay({ id: regId, surface: 'clubhouse', reason: 'autoplay' });
    }
  }, [isActive, regId]);

  // Keep muted state live without re-attach.
  useEffect(() => {
    const v = videoRef.current;
    if (v && isActive) v.muted = isMuted;
  }, [isMuted, isActive]);

  // Final cleanup on unmount.
  useEffect(
    () => () => {
      pool.teardown(hlsUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, backgroundColor: '#0a0a0a' }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
          backgroundColor: '#0a0a0a',
          opacity: hasFirstFrame ? 1 : 0,
          transition: 'opacity 120ms ease-out',
          zIndex: 1,
        }}
      />
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isMuted) markUserGestureUnmute();
            toggleMute();
          }}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 36,
            height: 36,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
