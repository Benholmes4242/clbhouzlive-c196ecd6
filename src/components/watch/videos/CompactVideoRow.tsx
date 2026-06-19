import { memo, useCallback, useMemo, useState } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FeedPost } from '@/components/media-system/types/media';

interface CompactVideoRowProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
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
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} ${min === 1 ? 'minute' : 'minutes'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

function CompactVideoRowInner({ post, index, allPosts }: CompactVideoRowProps) {
  const media = post.mediaItems.find((m) => m.type === 'video') ?? post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const duration = media?.duration ?? 0;
  const [failed, setFailed] = useState(false);

  const ageLabel = useMemo(() => formatAge(post.createdAt), [post.createdAt]);
  const channel = post.displayName || post.username || 'Clbhouz';

  const handleClick = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'flex',
        gap: 11,
        width: '100%',
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        alignItems: 'flex-start',
      }}
    >
      {/* Thumb */}
      <div
        style={{
          position: 'relative',
          width: 132,
          flexShrink: 0,
          aspectRatio: '16 / 9',
          borderRadius: 9,
          overflow: 'hidden',
          background: 'hsl(var(--muted))',
        }}
      >
        {thumb && !failed && (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
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
        {duration > 0 && (
          <span
            style={{
              position: 'absolute',
              right: 5,
              bottom: 5,
              padding: '2px 5px',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: 'rgba(0,0,0,0.8)',
              borderRadius: 4,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatHMS(duration)}
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
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
          {post.caption || `${channel} on Clbhouz`}
        </div>
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <SquircleAvatar size={20} src={post.avatarUrl} alt={channel} hideRing />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              fontWeight: 500,
              color: '#64748B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {channel} · {ageLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

export default memo(CompactVideoRowInner);
