import { memo, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { useWatchActions } from '../context/WatchActionsContext';
import { Pin } from '../proshop/Pin';
import { haptic } from '@/utils/haptics';

interface VideoLandscapeTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** Tile width in px. Defaults to 280 (landscape rail standard). */
  width?: number;
  /** Optional progress bar 0–1. Renders thin amber overlay at bottom. */
  progress?: number;
}

function formatHMS(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

/**
 * Landscape 16:9 video tile for horizontal rails on the Videos subpage.
 * Mirror of WatchRailTile but with a wider aspect ratio suited for long-form
 * content. Wires long-press to the shared WatchActions sheet (re-using the
 * same gesture stack as Clips L2).
 */
function VideoLandscapeTileInner({
  post,
  index,
  allPosts,
  width = 280,
  progress,
}: VideoLandscapeTileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const { openActions } = useWatchActions();

  const firstVideo = post.mediaItems.find((m) => m.type === 'video');
  const thumbnail = firstVideo?.thumbnailUrl || firstVideo?.imageUrl || '';
  const duration = firstVideo?.duration ?? 0;

  const handleTap = () => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  };

  const startPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      haptic('medium');
      openActions(post);
      longPressTimer.current = null;
    }, 450);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const courseName = (post as any).courseName ?? null;

  return (
    <div
      ref={cardRef}
      style={{
        flexShrink: 0,
        width,
        scrollSnapAlign: 'start',
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        className="relative block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
        aria-label={`Play video by ${post.displayName}`}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* Course pin (top-left) */}
        {courseName ? (
          <div style={{ position: 'absolute', top: 6, left: 6, maxWidth: 'calc(100% - 60px)' }}>
            <Pin variant="dark" icon={<span style={{ fontSize: 9 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {/* Duration pill (bottom-right) */}
        {duration > 0 ? (
          <div style={{ position: 'absolute', bottom: 6, right: 6 }}>
            <Pin variant="dark">{formatHMS(duration)}</Pin>
          </div>
        ) : null}

        {/* Progress bar overlay (Continue Watching) */}
        {typeof progress === 'number' && progress > 0 && progress < 1 ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 0,
              height: 5,
              background: 'rgba(255,255,255,0.28)',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(2, progress * 100))}%`,
                height: '100%',
                background: '#F7931E',
              }}
            />
          </div>
        ) : null}
      </button>

      {/* Title + creator below the tile */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#0F172A',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            letterSpacing: '-0.01em',
          }}
        >
          {post.caption || `${post.displayName} on Clbhouz`}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(15,23,42,0.55)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {post.displayName || post.username || 'Clbhouz'}
        </div>
      </div>
    </div>
  );
}

export const VideoLandscapeTile = memo(VideoLandscapeTileInner);
export default VideoLandscapeTile;
