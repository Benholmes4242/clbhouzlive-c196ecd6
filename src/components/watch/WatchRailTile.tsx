import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import Hls from 'hls.js';
import type { FeedPost } from '@/components/media-system/types/media';
import { useWatchActions } from './context/WatchActionsContext';
import { Pin } from './proshop/Pin';
import { haptic } from '@/utils/haptics';

interface WatchRailTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** When provided, renders a large outlined rank number bottom-left. */
  rank?: number;
  /** Tile width in px. Defaults to 200. */
  width?: number;
  /**
   * Set of post IDs the current user has already watched.
   * When provided, the NEW badge is suppressed for posts in this set.
   * Optional → falls back to global time-only behavior.
   */
  viewedPostIds?: Set<string>;
}

// Hybrid "why" labels — Session 2 of 3.
// Server-side reasons (TRENDING / NEAR YOU / FROM A COURSE YOU'VE PLAYED)
// are deferred until we add the joins to get_watch_shorts. For now we derive
// the two cheap reasons from data already on FeedPost.
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
 * Used by `TrendingThisWeek` (with rank) and `LatestVideosRail` (no rank).
 *
 * Per-card autoplay: plays once when 40% visible, freezes on last frame,
 * shows a glass play affordance afterwards.
 */
export default function WatchRailTile({
  post,
  index,
  allPosts,
  rank,
  width = 200,
  viewedPostIds,
}: WatchRailTileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const hlsUrl = media?.hlsUrl || '';

  // Per-card IntersectionObserver — autoplay once when 40% visible
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !hlsUrl || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          startAutoplay();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl, hasPlayed]);

  const startAutoplay = useCallback(() => {
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

    setIsPlaying(true);

    video.onended = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

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
      // Long-press already fired → suppress the implicit tap.
      longPressFiredRef.current = false;
      return;
    }
    handleTap();
  }, []);

  const surfacingReason = useMemo(
    () => deriveSurfacingReason(post, viewedPostIds),
    [post, viewedPostIds],
  );

  return (
    <div
      ref={cardRef}
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
        // Suppress native long-press context menu so the action sheet wins.
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

      {/* Autoplay video layer */}
      {hlsUrl && (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
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

      {/* Optional rank — outlined sans (Geist inherited), bottom-left */}
      {typeof rank === 'number' && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
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

      {/* Likes — amber heart SVG */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Heart
          style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }}
          strokeWidth={1.8}
        />
        {post.likeCount}
      </div>

      {/* Solid play button — shown after autoplay finishes */}
      {hasPlayed && !isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid rgba(255,255,255,0.9)',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              marginLeft: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}
