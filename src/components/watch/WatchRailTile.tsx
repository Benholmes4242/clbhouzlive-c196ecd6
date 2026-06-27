import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import Hls from 'hls.js';
import type { FeedPost } from '@/components/media-system/types/media';
import { Pin } from './proshop/Pin';

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
  /** Tile aspect ratio. Defaults to '3/4' (portrait). Pass '1/1' for square. */
  aspectRatio?: string;
  /** Border radius in px. Defaults to 6. */
  radius?: number;
}

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
  aspectRatio = '3/4',
  radius = 6,
}: WatchRailTileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const hlsUrl = media?.hlsUrl || '';

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

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  const handleClick = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

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
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio,
      }}
      onClick={handleClick}
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

      {/* Optional rank — bold translucent filled marker, top-left */}
      {typeof rank === 'number' && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 10,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'rgba(255,255,255,0.32)',
            textShadow: '0 2px 12px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            zIndex: 2,
            userSelect: 'none',
          }}
        >
          {rank}
        </span>
      )}


      {/* Likes — amber heart, no pill, text-shadow handles legibility */}
      {(post.likeCount ?? 0) > 0 && (
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
      )}

    </div>
  );
}
