import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Film, Heart, MessageCircle } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { haptic } from '@/utils/haptics';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { Pin } from './proshop/Pin';
import { LONG_PRESS_MS, TOUCHMOVE_CANCEL_PX } from './constants';
import { useWatchAutoplay } from './WatchAutoplay';


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
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const hlsUrl = post.mediaItems?.[0]?.hlsUrl;
  const mp4Url = (post.mediaItems?.[0] as any)?.videoUrl || (post.mediaItems?.[0] as any)?.mp4Url;
  const { open } = useFullscreenFeedStore();

  // Phase WatchSpotlight-B: runtime arbitrates which tile plays.
  // Namespaced id avoids collision with rails (Stage C: watch-rail-*).
  const ctx = useWatchAutoplay();
  const mediaId = `watch-grid-${post.id}`;
  const isPlaying = ctx?.playingIds.has(mediaId) ?? false;
  const [videoVisible, setVideoVisible] = useState(false);

  // Long-press state
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  // Video element ref callback — registers/unregisters with MediaRuntime.
  // The runtime needs a real <video> to call play()/pause(); we always render
  // an empty muted/looped/playsinline element so the runtime can decide BEFORE
  // we attach HLS. HLS wire-up happens reactively in the isPlaying effect below.
  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
      if (!ctx) return;
      if (el && tileRef.current) {
        ctx.registerMedia({
          id: mediaId,
          element: el,
          observeTarget: tileRef.current,
          sortIndex: index,
          isCandidate: !!(hlsUrl || mp4Url),
        });
      } else {
        ctx.registerMedia({ id: mediaId, element: null });
      }
    },
    [ctx, mediaId, index, hlsUrl, mp4Url],
  );

  // Attach HLS when runtime says we're the spotlight; demote-to-pool on the
  // way out (mirrors AutoplayVideoCard's WatchJank-2 teardown — orthogonal to
  // runtime arbitration: runtime owns play/pause, pool owns instance lifecycle).
  useEffect(() => {
    const v = videoElRef.current;
    if (!v) return;
    if (!isPlaying) return;
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
            // demote if pool-managed, else destroy
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
        // For mp4 path, clear src so the next promotion can start fresh.
        if (!hlsUrl) {
          v.removeAttribute('src');
          try { v.load(); } catch {}
        }
      }
    };
  }, [isPlaying, hlsUrl, mp4Url]);

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

      {/* Poster or placeholder — fades out when video is ready */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          style={{
            opacity: videoVisible ? 0 : 1,
            transition: 'opacity 200ms ease',
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Runtime-arbitrated autoplay layer. The <video> element is always
          mounted (cheap, no src until isPlaying) so MediaRuntime has a
          real element to call play()/pause() on. HLS is attached only when
          the runtime picks this tile as the spotlight. */}
      {ctx && (hlsUrl || mp4Url) && (
        <video
          ref={videoRefCallback}
          muted
          loop
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
            pointerEvents: 'none',
            zIndex: 1,
            opacity: videoVisible ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        />
      )}

      {/* Bottom gradient for legibility */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '45%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
          zIndex: 2,
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
