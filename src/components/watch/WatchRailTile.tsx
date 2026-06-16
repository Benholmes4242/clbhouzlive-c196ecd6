import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import Hls from 'hls.js';
import type { FeedPost } from '@/components/media-system/types/media';
import { useWatchActions } from './context/WatchActionsContext';
import { Pin } from './proshop/Pin';
import { haptic } from '@/utils/haptics';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { MediaRuntime } from '@/media/runtime';
import type { RegisterMediaFn } from '@/media';

interface WatchRailTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** When provided, renders a large outlined rank number bottom-left. */
  rank?: number;
  /** Tile width. Defaults to 200. Accepts a CSS length string for responsive layouts. */
  width?: number | string;
  /**
   * Set of post IDs the current user has already watched.
   * When provided, the NEW badge is suppressed for posts in this set.
   * Optional → falls back to global time-only behavior.
   */
  viewedPostIds?: Set<string>;
  /**
   * Phase WatchSpotlight-C: when provided, the tile is runtime-arbitrated
   * (single global 'watch' spotlight, loops while it's the winner).
   * When omitted, falls back to the legacy "plays once on 40% visible"
   * per-card IO (used by LightningRoundRail at /watch/clips).
   */
  registerMedia?: RegisterMediaFn;
  playingIds?: Set<string>;
  /** Visible-candidate set from useMediaAutoplay; drives lazy HLS attach. */
  visibleIds?: Set<string>;
}

// Hybrid "why" labels — Session 2 of 3.
const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h
const POPULAR_REVIEW_LIKES = 25;

function deriveSurfacingReason(
  post: FeedPost,
  viewedPostIds?: Set<string>,
): string | null {
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const isFresh = ageMs < NEW_THRESHOLD_MS;
  const alreadyViewed = viewedPostIds?.has(post.id) ?? false;
  if (isFresh && !alreadyViewed) return 'NEW';
  if (post.isReview && post.likeCount >= POPULAR_REVIEW_LIKES) return 'POPULAR REVIEW';
  return null;
}

/**
 * Canonical horizontal-rail tile for the Watch surface.
 * Used by `TrendingThisWeek` (runtime-arbitrated spotlight, with rank) and
 * `LightningRoundRail` (legacy per-card autoplay, no rank).
 */
export default function WatchRailTile({
  post,
  index,
  allPosts,
  rank,
  width = 200,
  viewedPostIds,
  registerMedia,
  playingIds,
  visibleIds,
}: WatchRailTileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  // Legacy mode (no registerMedia): plays once on 40% visible.
  const [hasPlayed, setHasPlayed] = useState(false);
  const [legacyVisible, setLegacyVisible] = useState(false);

  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const hlsUrl = media?.hlsUrl || '';
  const mp4Url = (media as any)?.videoUrl || (media as any)?.mp4Url || '';

  const runtimeMode = !!registerMedia;
  const mediaId = `watch-rail-${post.id}`;
  const isRuntimePlaying = runtimeMode ? (playingIds?.has(mediaId) ?? false) : false;
  const isVisibleCandidate = runtimeMode ? (visibleIds?.has(mediaId) ?? false) : false;

  // ── Wrapper ref OWNS register/unregister lifecycle (runtime mode). ──
  // React attaches child refs before parent refs; an inner-only
  // register/unregister pattern would demote itself at mount.
  const wrapperRefCallback = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef.current = el;
      if (!runtimeMode || !registerMedia) return;
      if (el && videoRef.current) {
        registerMedia({
          id: mediaId,
          element: videoRef.current,
          observeTarget: el,
          sortIndex: index,
          isCandidate: !!(hlsUrl || mp4Url),
        });
      } else {
        registerMedia({ id: mediaId, element: null });
      }
    },
    [runtimeMode, registerMedia, mediaId, index, hlsUrl, mp4Url],
  );

  // Inner video ref only REGISTERS (never unregisters) — wrapper owns teardown.
  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (!runtimeMode || !registerMedia) return;
      if (el && cardRef.current) {
        registerMedia({
          id: mediaId,
          element: el,
          observeTarget: cardRef.current,
          sortIndex: index,
          isCandidate: !!(hlsUrl || mp4Url),
        });
      }
      // NO else/unregister here — wrapper owns teardown.
    },
    [runtimeMode, registerMedia, mediaId, index, hlsUrl, mp4Url],
  );

  // ── Runtime mode: attach HLS when we win the spotlight, demote on exit ──
  const [videoVisible, setVideoVisible] = useState(false);
  useEffect(() => {
    if (!runtimeMode) return;
    const v = videoRef.current;
    if (!v) return;
    if (!isRuntimePlaying) return;
    if (!hlsUrl && !mp4Url) return;

    let cancelled = false;
    const onReady = () => {
      if (cancelled) return;
      setVideoVisible(true);
      v.play().catch(() => {});
    };

    if (hlsUrl) {
      attachHlsToTile({ hlsUrl, mp4Fallback: mp4Url, video: v, onReady })
        .then((hls) => {
          if (cancelled) {
            if (hls && hlsUrl && HLSPoolManager.isPooled(hlsUrl)) {
              try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
            } else {
              try { hls?.destroy?.(); } catch {}
            }
            return;
          }
          hlsRef.current = hls;
        })
        .catch(() => {});
    } else if (mp4Url) {
      v.src = mp4Url;
      v.addEventListener('canplay', onReady, { once: true });
      v.play().catch(() => {});
    }

    return () => {
      cancelled = true;
      setVideoVisible(false);
      const hls = hlsRef.current;
      if (hls) {
        if (hlsUrl && HLSPoolManager.isPooled(hlsUrl)) {
          try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
        } else {
          try { hls.stopLoad?.(); } catch {}
          try { hls.detachMedia?.(); } catch {}
          try { hls.destroy?.(); } catch {}
        }
        hlsRef.current = null;
      }
      if (v) {
        try { v.pause(); } catch {}
        if (!hlsUrl) {
          v.removeAttribute('src');
          try { v.load(); } catch {}
        }
      }
    };
  }, [runtimeMode, isRuntimePlaying, hlsUrl, mp4Url]);

  // ── Legacy mode: per-card IO, plays once when 40% visible ──
  const startLegacyAutoplay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    video.muted = true;
    video.playsInline = true;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 4 });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => {});
    }

    setLegacyVisible(true);

    video.onended = () => {
      setLegacyVisible(false);
      setHasPlayed(true);
      hlsRef.current?.destroy?.();
      hlsRef.current = null;
    };
  }, [hlsUrl]);

  useEffect(() => {
    if (runtimeMode) return; // skip legacy path
    const el = cardRef.current;
    if (!el || !hlsUrl || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          startLegacyAutoplay();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [runtimeMode, hlsUrl, hasPlayed, startLegacyAutoplay]);

  // Unmount cleanup (legacy path; runtime path handled by its effect)
  useEffect(() => {
    return () => {
      if (!runtimeMode) {
        hlsRef.current?.destroy?.();
        hlsRef.current = null;
      }
    };
  }, [runtimeMode]);

  const { openActions } = useWatchActions();

  const handleTap = () => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  };

  // Long-press → show action sheet (Save / Share / Not interested / Report)
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const startLongPress = useCallback(() => {
    longPressFiredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      haptic('medium');
      openActions(post);
    }, 400);
  }, [openActions, post]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    handleTap();
  }, []);

  const surfacingReason = useMemo(
    () => deriveSurfacingReason(post, viewedPostIds),
    [post, viewedPostIds],
  );

  const showVideo = runtimeMode ? videoVisible : legacyVisible;

  return (
    <div
      ref={wrapperRefCallback}
      style={{
        flexShrink: 0,
        position: 'relative',
        width,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '3/4',
      }}
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {/* Thumbnail */}
      <img
        src={thumb}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* Autoplay video layer — persistent in runtime mode (registered with
          MediaRuntime; loops while winner of the global 'watch' spotlight).
          Legacy mode: plays once on 40% visible (LightningRoundRail). */}
      {hlsUrl && (
        <video
          ref={videoRefCallback}
          muted
          loop={runtimeMode}
          playsInline
          preload="none"
          // @ts-ignore webkit-only attribute
          webkit-playsinline=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: showVideo ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Surfacing reason — amber Pin (NEW / POPULAR REVIEW), top-left */}
      {surfacingReason && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
            maxWidth: 'calc(100% - 16px)',
            pointerEvents: 'none',
          }}
        >
          <Pin variant="amber" size="sm">{surfacingReason}</Pin>
        </div>
      )}

      {/* Optional rank — outlined sans (Geist inherited), top-left */}
      {typeof rank === 'number' && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            left: 8,
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-2px',
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(255,255,255,0.3)',
            pointerEvents: 'none',
            zIndex: 2,
            userSelect: 'none',
          }}
        >
          {rank}
        </span>
      )}


      {/* Likes — amber heart, no pill, text-shadow handles legibility */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.95)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        <Heart
          style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }}
          strokeWidth={1.8}
        />
        {post.likeCount}
      </div>

    </div>
  );
}
