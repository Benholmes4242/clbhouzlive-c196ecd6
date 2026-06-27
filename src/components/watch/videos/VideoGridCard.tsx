import { memo, useCallback, useState } from 'react';
import { Clock, Heart } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Pin } from '../proshop/Pin';
import type { FeedPost } from '@/components/media-system/types/media';

interface VideoGridCardProps {
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

function abbreviateCount(n: number): string {
  if (!n || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function VideoGridCardInner({ post, index, allPosts }: VideoGridCardProps) {
  const media = post.mediaItems.find((m) => m.type === 'video') ?? post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const duration = media?.duration ?? 0;
  const [failed, setFailed] = useState(false);

  const channel = post.displayName || post.username || 'Clbhouz';
  const likeCount = post.likeCount ?? 0;

  const handleTap = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

  return (
    <button
      type="button"
      onClick={handleTap}
      className="block text-left active:scale-[0.99] transition-transform"
      style={{ flex: 1, minWidth: 0, padding: 0, background: 'transparent', border: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'hsl(var(--muted))',
        }}
      >
        {thumb && !failed ? (
          <img
            src={thumb}
            alt={post.caption ?? ''}
            loading="lazy"
            onError={() => setFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {duration > 0 ? (
          <div style={{ position: 'absolute', bottom: 6, right: 6 }}>
            <Pin variant="dark" icon={<Clock size={9} />}>
              {formatHMS(duration)}
            </Pin>
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12.5,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: '#0F172A',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 31,
        }}
      >
        {post.caption || `${channel} on Clbhouz`}
      </div>

      <div
        style={{
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          fontWeight: 500,
          color: '#64748B',
          minWidth: 0,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {channel}
        </span>
        {likeCount > 0 && (
          <>
            <span style={{ flexShrink: 0 }}>·</span>
            <Heart size={11} strokeWidth={0} style={{ color: '#F7931E', fill: '#F7931E', flexShrink: 0 }} />
            <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {abbreviateCount(likeCount)}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export const VideoGridCard = memo(VideoGridCardInner);
export default VideoGridCard;
