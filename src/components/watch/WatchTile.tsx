import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { haptic } from '@/utils/haptics';
import { LONG_PRESS_MS, TOUCHMOVE_CANCEL_PX } from './constants';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function abbreviateCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface WatchTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLongPress?: (post: FeedPost) => void;
}

const WatchTile: React.FC<WatchTileProps> = ({
  post,
  index,
  allPosts,
  onLongPress,
}) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const duration = media?.duration;
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = post.mediaItems?.[0]?.hlsUrl;
  const { open } = useFullscreenFeedStore();
  const navigate = useNavigate();

  // Long-press state
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  const clearLongPress = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressStartRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onLongPress) return;
    longPressFiredRef.current = false;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      haptic('medium');
      onLongPress(post);
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = pressStartRef.current;
    if (!start) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx > TOUCHMOVE_CANCEL_PX || dy > TOUCHMOVE_CANCEL_PX) {
      clearLongPress();
    }
  };

  const handleClick = () => {
    // Suppress click if a long-press just fired
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    open(allPosts ?? [post], index);
  };

  const handleCreatorTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.username) {
      navigate(`/profile/${post.username}`);
    } else if (post.userId) {
      navigate(`/profile/${post.userId}`);
    }
  };

  const creatorLabel = post.displayName || post.username || '';
  const showCreatorChip = !!creatorLabel;

  return (
    <div
      ref={tileRef}
      data-watch-index={index}
      className="relative aspect-[4/5] overflow-hidden rounded-[4px] cursor-pointer select-none"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault();
          if (!longPressFiredRef.current) {
            longPressFiredRef.current = true;
            haptic('medium');
            onLongPress(post);
          }
        }
      }}
    >
      {/* Course name badge — top centre */}
      {post.courseName && (
        <div
          style={{
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 11, fontWeight: 600, color: 'white',
            maxWidth: 'calc(100% - 88px)', overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 10, lineHeight: 1 }}>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.courseName}
          </span>
        </div>
      )}

      {/* Poster or placeholder */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Bottom gradient for legibility */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '45%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }}
      />

      {/* Play affordance — center-right area, on every video tile */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          top: 10, right: 10, zIndex: 9,
          width: 28, height: 28, borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Play size={14} fill="white" stroke="white" strokeWidth={1} style={{ marginLeft: 1 }} />
      </div>

      {/* Duration — top-left (relocated to avoid play-triangle collision) */}
      {duration != null && duration > 0 && (
        <div
          className="absolute top-1.5 left-1.5 z-10 rounded-[4px] flex items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '2px 5px',
          }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Creator chip — bottom-left */}
      {showCreatorChip && (
        <button
          type="button"
          onClick={handleCreatorTap}
          className="absolute z-10 flex items-center gap-1.5 active:scale-[0.97] transition-transform"
          style={{
            bottom: 6, left: 6,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 999, padding: '2px 8px 2px 2px',
            maxWidth: 'calc(100% - 70px)',
          }}
        >
          {post.avatarUrl ? (
            <img
              src={post.avatarUrl}
              alt=""
              style={{
                width: 18, height: 18, borderRadius: 999, objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 18, height: 18, borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: 11, fontWeight: 600, color: 'white',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 90,
            }}
          >
            {creatorLabel}
          </span>
        </button>
      )}

      {/* Engagement stats — bottom-right (likes always, comments if > 0) */}
      <div
        className="absolute z-10 flex flex-col items-end gap-[3px]"
        style={{ bottom: 6, right: 6 }}
      >
        <div
          className="rounded-[4px] flex items-center gap-[3px]"
          style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            padding: '2px 5px',
          }}
        >
          <span style={{ fontSize: 10, lineHeight: 1 }}>🧡</span>
          <span className="text-[11px] font-medium text-white">
            {abbreviateCount(likeCount)}
          </span>
        </div>
        {commentCount > 0 && (
          <div
            className="rounded-[4px] flex items-center gap-[3px]"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              padding: '2px 5px',
            }}
          >
            <span style={{ fontSize: 10, lineHeight: 1 }}>💬</span>
            <span className="text-[11px] font-medium text-white">
              {abbreviateCount(commentCount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTile;
