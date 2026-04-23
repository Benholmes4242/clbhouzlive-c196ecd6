import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWatchActions } from '../context/WatchActionsContext';
import { Pin } from '../proshop/Pin';
import { haptic } from '@/utils/haptics';

interface VideoRailTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** Tile width in px. Defaults to 200 (Latest videos rail). Use 280 for the
   *  Videos subpage rails to preserve their wider landscape rhythm. */
  width?: number;
  /** Optional progress 0–1 — renders a thin amber scrubber across the
   *  bottom of the thumb (Continue Watching). */
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

function formatAge(iso: string | null | undefined): string {
  if (!iso) return '';
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

/**
 * Unified rail tile for Watch / Videos surfaces.
 *
 * Shares the visual language of the hero `VideoFeedCard` (course/duration
 * pins on a 16:9 thumb, avatar + bold title + muted meta below) but scaled
 * down for horizontal-rail context. Replaces both `LatestVideoTile` and
 * `VideoLandscapeTile`.
 *
 * Behaviour:
 *  • Tap → opens fullscreen player
 *  • Long-press (400ms) → opens WatchActions sheet (haptic)
 *  • No visible three-dot menu — long-press is the sole action surface
 */
function VideoRailTileInner({
  post,
  index,
  allPosts,
  width = 200,
  progress,
}: VideoRailTileProps) {
  const { openActions } = useWatchActions();

  const media = post.mediaItems.find((m) => m.type === 'video') ?? post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const duration = media?.duration ?? 0;
  const [thumbFailed, setThumbFailed] = useState(false);

  const courseName = (post as any).courseName ?? null;
  const ageLabel = useMemo(() => formatAge(post.createdAt), [post.createdAt]);
  const creator = post.displayName || post.username || 'Clbhouz';
  const metaLine = [creator, ageLabel].filter(Boolean).join(' · ');

  // --- Tap vs long-press handling ---------------------------------------
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const handleTap = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

  const startLongPress = useCallback(() => {
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
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

  const showProgress = typeof progress === 'number' && progress > 0 && progress < 1;

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
      {/* Thumb — 16:9 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 12,
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
            loading="lazy"
            onError={() => setThumbFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        {/* Course pin — top-left */}
        {courseName ? (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              maxWidth: 'calc(100% - 60px)',
              pointerEvents: 'none',
            }}
          >
            <Pin variant="dark" icon={<span style={{ fontSize: 9 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {/* Duration pin — bottom-right */}
        {duration > 0 ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              pointerEvents: 'none',
            }}
          >
            <Pin variant="dark" icon={<Clock size={10} />}>
              {formatHMS(duration)}
            </Pin>
          </div>
        ) : null}

        {/* Progress scrubber — Continue Watching only */}
        {showProgress ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 5,
              background: 'rgba(255,255,255,0.28)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(2, (progress ?? 0) * 100))}%`,
                height: '100%',
                background: '#F7931E',
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Meta row — avatar + title/creator·date */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            src={post.avatarUrl}
            alt={creator}
            userId={post.userId}
            size={20}
            hideRing
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {post.caption || 'Untitled'}
          </div>
          {metaLine && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(15,23,42,0.55)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {metaLine}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const VideoRailTile = memo(VideoRailTileInner);
export default VideoRailTile;
