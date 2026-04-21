import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useWatchActions } from './context/WatchActionsContext';
import { haptic } from '@/utils/haptics';

interface LatestVideoTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** Tile width in px. Defaults to 200. */
  width?: number;
}

/**
 * Landscape (16:9) tile for the "Latest videos" rail.
 *
 * YouTube-style: thumbnail on top, title + creator + meta stacked below.
 * No inline autoplay — long-form posters until tapped, matching scannable
 * home-feed behavior and reducing unnecessary HLS load.
 */
export default function LatestVideoTile({
  post,
  index,
  allPosts,
  width = 200,
}: LatestVideoTileProps) {
  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const durationSec = media?.duration ?? 0;
  const [thumbFailed, setThumbFailed] = useState(false);

  const { openActions } = useWatchActions();

  const handleTap = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

  // Long-press → action sheet (Save / Share / Not interested / Report)
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
  }, [handleTap]);

  const durationLabel = useMemo(() => {
    if (!durationSec || durationSec <= 0) return null;
    const total = Math.round(durationSec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [durationSec]);

  const ageLabel = useMemo(() => formatAge(post.createdAt), [post.createdAt]);
  const creator = post.displayName || post.username || '';
  const likeLabel = `${post.likeCount} ${post.likeCount === 1 ? 'like' : 'likes'}`;
  const metaLine = [ageLabel, likeLabel].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        flexShrink: 0,
        width,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Thumbnail — 16:9 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 10,
          overflow: 'hidden',
          background:
            thumb && !thumbFailed
              ? 'hsl(var(--muted))'
              : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--accent)) 100%)',
        }}
      >
        {thumb && !thumbFailed && (
          <img
            src={thumb}
            alt=""
            onError={() => setThumbFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        {/* Center play affordance */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
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
              borderLeft: '8px solid rgba(255,255,255,0.95)',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              marginLeft: 2,
            }}
          />
        </div>

        {/* Duration badge */}
        {durationLabel && (
          <div
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              padding: '2px 4px',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
              pointerEvents: 'none',
            }}
          >
            {durationLabel}
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ marginTop: 8, padding: '0 2px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'hsl(var(--foreground))',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 4,
            wordBreak: 'break-word',
          }}
        >
          {post.caption || 'Untitled'}
        </div>
        {creator && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'hsl(var(--muted-foreground))',
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {creator}
          </div>
        )}
        {metaLine && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'hsl(var(--muted-foreground))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metaLine}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAge(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
