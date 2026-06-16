import React, { useEffect, useRef } from 'react';
import { Film, Heart, MessageCircle } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { haptic } from '@/utils/haptics';
import { Pin } from './proshop/Pin';
import { LONG_PRESS_MS, TOUCHMOVE_CANCEL_PX } from './constants';


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
  /** When rendered inside the mosaic grid: parent controls aspect, tile is flush. */
  variant?: 'hero' | 'tile';
  feature?: boolean;
}

const WatchTile: React.FC<WatchTileProps> = ({
  post,
  index,
  allPosts,
  onLongPress,
  variant,
}) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = post.mediaItems?.[0]?.hlsUrl;
  const { open } = useFullscreenFeedStore();
  

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


  const mosaic = variant === 'hero' || variant === 'tile';
  const tileClassName = mosaic
    ? 'watch-tile relative w-full h-full overflow-hidden cursor-pointer select-none'
    : 'watch-tile relative aspect-[4/5] overflow-hidden rounded-[12px] cursor-pointer select-none';

  return (
    <div
      ref={tileRef}
      data-watch-index={index}
      className={tileClassName}
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
            position: 'absolute',
            top: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100% - 24px)',
            zIndex: 10,
          }}
        >
          <Pin variant="dark" size="grid">{post.courseName}</Pin>
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



      {/* Engagement stats — bottom-right (likes always, comments if > 0).
          Canonical: Lucide Heart + MessageCircle in brand amber, no pill,
          text-shadow handles legibility on busy thumbnails. Mirrors
          WatchRailTile so portrait tiles read identically across surfaces. */}
      <div
        className="absolute z-10 flex flex-col items-end gap-1"
        style={{
          bottom: 8,
          right: 8,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
          <Heart size={13} strokeWidth={1.8} style={{ color: '#F7931E', fill: '#F7931E' }} />
          <span className="text-[11px] font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {abbreviateCount(likeCount)}
          </span>
        </div>
        {commentCount > 0 && (
          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
            <MessageCircle size={12} strokeWidth={1.8} style={{ color: '#ffffff' }} />
            <span className="text-[11px] font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {abbreviateCount(commentCount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTile;
