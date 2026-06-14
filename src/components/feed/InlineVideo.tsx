/**
 * InlineVideo — Clubhouse feed video tile (paused-first-frame model).
 *
 * INSTRUMENTED: every lifecycle decision emits a TILE trace via logTileLife,
 * tagged with `[#feedIndex tag]` for greppable per-tile timelines.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useHlsPool } from '@/media/hooks/useHlsPool';
import { usePausedFirstFrame } from '@/media/hooks/usePausedFirstFrame';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { DecoderLimitManager } from '@/utils/video/DecoderLimitManager';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { logTileLife, attachVideoEventLoggers } from '@/media/mobileVideoDebug';
import type { MediaItem } from '@/components/media-system/types/media';

interface Props {
  item: MediaItem;
  isActive: boolean;
  isNear: boolean;
  feedIndex?: number;
  objectFit?: 'cover' | 'contain';
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  isNear,
  feedIndex,
  objectFit = 'cover',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pool = useHlsPool();
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);

  const hlsUrl = (item as any).hlsUrl || '';
  const mp4Url = (item as any).mp4Url as string | undefined;
  const regId = extractCloudflareUid(hlsUrl) || item.id;
  const tag = regId.slice(-6);

  const [attachToken, setAttachToken] = useState(0);
  const { hasFirstFrame, reset } = usePausedFirstFrame(videoRef, isActive, attachToken);

  // Trace prop changes — the inputs that drive every decision below.
  useEffect(() => {
    logTileLife(tag, feedIndex, 'PROPS', {
      isActive,
      isNear,
      hasFirstFrame,
      decoders: DecoderLimitManager.getSlotCount(),
    });
  }, [isActive, isNear, hasFirstFrame, tag, feedIndex]);

  // Attach raw DOM video-event logger once per mount.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    logTileLife(tag, feedIndex, 'MOUNT');
    const detach = attachVideoEventLoggers(video, regId);
    return () => {
      logTileLife(tag, feedIndex, 'UNMOUNT');
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tracks whether this tile currently holds an attached HLS/MSE source.
  // Used to detect "denied at preload, now active" → retry attach.
  const attachedRef = useRef(false);
  const cancelledRef = useRef(false);

  // Stable attach routine — callable from the [isNear] effect AND from the
  // [isActive] retry effect (P1-E: denied slot recovers when promoted to playing).
  const attemptAttach = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (attachedRef.current) return;

    const activeNow = isActiveRef.current;
    const priority = activeNow ? 'playing' : 'preload';
    logTileLife(tag, feedIndex, 'SLOT_REQUEST', {
      priority,
      decoders: DecoderLimitManager.getSlotCount(),
    });
    const granted = DecoderLimitManager.requestSlot(regId, video, priority, () => {
      logTileLife(tag, feedIndex, 'EVICTED_BLACK', {
        decoders: DecoderLimitManager.getSlotCount(),
      });
      attachedRef.current = false;
      try { video.pause(); } catch {}
      try { video.removeAttribute('src'); video.load(); } catch {}
      pool.teardown(hlsUrl);
      reset();
    });
    if (!granted) {
      logTileLife(tag, feedIndex, 'SLOT_DENIED_BLACK', {
        priority,
        decoders: DecoderLimitManager.getSlotCount(),
      });
      return;
    }
    logTileLife(tag, feedIndex, 'SLOT_GRANTED', {
      priority,
      decoders: DecoderLimitManager.getSlotCount(),
    });
    video.muted = true;
    video.playsInline = true;
    if (hlsUrl) {
      logTileLife(tag, feedIndex, 'ATTACH_START');
      attachedRef.current = true;
      pool.attach(hlsUrl, video, mp4Url).then(() => {
        if (cancelledRef.current) {
          logTileLife(tag, feedIndex, 'ATTACH_CANCELLED');
          return;
        }
        logTileLife(tag, feedIndex, 'ATTACH_DONE', { readyState: video.readyState });
        try {
          if (video.currentTime < 0.001) video.currentTime = 0.001;
        } catch {}
        setAttachToken((t) => t + 1);
        logTileLife(tag, feedIndex, 'ATTACH_SETTLED', {
          hasSrc: !!video.src,
          readyState: video.readyState,
          active: isActiveRef.current,
          paused: video.paused,
        });
        if (isActiveRef.current && video.paused) {
          video.play().catch(() => {});
        }
      });
    } else if (mp4Url) {
      attachedRef.current = true;
      video.src = mp4Url;
    }
  }, [hlsUrl, mp4Url, regId, tag, feedIndex, pool, reset]);

  // Attach when near; demote-to-pool when leaving the radius.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    cancelledRef.current = false;

    if (isNear) {
      attemptAttach();
      return () => {
        cancelledRef.current = true;
      };
    } else {
      logTileLife(tag, feedIndex, 'LEAVE_RADIUS_TEARDOWN', {
        decoders: DecoderLimitManager.getSlotCount(),
      });
      DecoderLimitManager.releaseSlot(regId);
      pool.teardown(hlsUrl);
      attachedRef.current = false;
      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNear, hlsUrl, mp4Url]);

  // Keep decoder priority in sync with active/near state.
  // P1-E: if this tile became active but never attached (denied at preload),
  // retry now — playing priority evicts a lower-priority neighbour.
  useEffect(() => {
    if (isActive) {
      DecoderLimitManager.updatePriority(regId, 'playing');
      logTileLife(tag, feedIndex, 'PRIORITY→playing');
      if (isNear && !attachedRef.current) {
        logTileLife(tag, feedIndex, 'ACTIVE_RETRY_ATTACH');
        attemptAttach();
      }
    } else if (isNear) {
      DecoderLimitManager.updatePriority(regId, 'visible');
      logTileLife(tag, feedIndex, 'PRIORITY→visible');
    }
  }, [isActive, isNear, regId, tag, feedIndex, attemptAttach]);

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
    logTileLife(tag, feedIndex, 'RUNTIME_REGISTER');
    return () => {
      MediaRuntime.unregisterMedia(regId);
      logTileLife(tag, feedIndex, 'RUNTIME_UNREGISTER');
    };
  }, [isNear, regId, tag, feedIndex]);

  // Trace-only: play itself is owned by usePausedFirstFrame's [active] effect.
  // Surface arbitration is still owned by MediaRuntime via register/unregister.
  useEffect(() => {
    if (isActive) {
      const v = videoRef.current;
      logTileLife(tag, feedIndex, 'ACTIVE_FLIP', {
        hasSrc: !!v?.src,
        readyState: v?.readyState,
      });
    }
  }, [isActive, regId, tag, feedIndex]);

  // Trace the reveal moment.
  useEffect(() => {
    if (hasFirstFrame) logTileLife(tag, feedIndex, 'FRAME_REVEALED');
  }, [hasFirstFrame, tag, feedIndex]);

  // Keep muted state live without re-attach.
  useEffect(() => {
    const v = videoRef.current;
    if (v && isActive) v.muted = isMuted;
  }, [isMuted, isActive]);

  // Final cleanup on unmount.
  useEffect(
    () => () => {
      DecoderLimitManager.releaseSlot(regId);
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
