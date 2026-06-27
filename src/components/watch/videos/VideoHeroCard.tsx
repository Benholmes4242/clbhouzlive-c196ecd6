import { memo, useCallback, useMemo, useState } from 'react';
import { Clock, Heart } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Pin } from '../proshop/Pin';
import type { FeedPost } from '@/components/media-system/types/media';

interface VideoHeroCardProps {
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
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function abbreviateCount(n: number): string {
  if (!n || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function VideoHeroCardInner({ post, index, allPosts }: VideoHeroCardProps) {
  const media = post.mediaItems.find((m) => m.type === 'video') ?? post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const duration = media?.duration ?? 0;
  const [failed, setFailed] = useState(false);

  const channel = post.displayName || post.username || 'Clbhouz';
  const ageLabel = useMemo(() => formatAge(post.createdAt), [post.createdAt]);
  const courseName = (post as any).courseName as string | undefined;
  const likeCount = post.likeCount ?? 0;

  const handleTap = useCallback(() => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  }, [allPosts, index]);

  return (
    <section style={{ padding: '0 16px' }}>
      <button
        type="button"
        onClick={handleTap}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'hsl(var(--muted))',
          border: 'none',
          padding: 0,
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

        {/* bottom scrim for chip legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 35%)',
            pointerEvents: 'none',
          }}
        />

        {courseName ? (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, maxWidth: 'calc(100% - 110px)', flexWrap: 'wrap' }}>
            <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {duration > 0 ? (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <Pin variant="dark" icon={<Clock size={11} />}>
              {formatHMS(duration)}
            </Pin>
          </div>
        ) : null}
      </button>

      <div
        style={{
          marginTop: 12,
          padding: '0 2px',
          fontSize: 16.5,
          fontWeight: 800,
          lineHeight: 1.25,
          letterSpacing: '-0.015em',
          color: '#0F172A',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.caption || `${channel} on Clbhouz`}
      </div>

      <div style={{ marginTop: 8, padding: '0 2px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <SquircleAvatar size={22} src={post.avatarUrl} alt={channel} hideRing />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: '#64748B', minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{channel}</span>
          <span style={{ flexShrink: 0 }}>·</span>
          <span style={{ flexShrink: 0 }}>{ageLabel}</span>
          {likeCount > 0 && (
            <>
              <span style={{ flexShrink: 0 }}>·</span>
              <Heart size={12} strokeWidth={0} style={{ color: '#F7931E', fill: '#F7931E', flexShrink: 0 }} />
              <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{abbreviateCount(likeCount)}</span>
            </>
          )}
        </span>
      </div>
    </section>
  );
}

export const VideoHeroCard = memo(VideoHeroCardInner);
export default VideoHeroCard;
