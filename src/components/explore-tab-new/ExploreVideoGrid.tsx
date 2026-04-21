import { memo, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

interface ExploreVideoGridProps {
  posts: FeedPost[];
  isLoading: boolean;
}

function VideoTile({ post, onTap }: { post: FeedPost; onTap: () => void }) {
  const thumb = (post as any).thumbnailUrl ?? (post as any).coverUrl ?? (post as any).mediaUrl ?? null;
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        background: '#0F172A',
        padding: 0,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {thumb ? (
        <img
          src={thumb}
          alt={post.courseName ?? 'Course video'}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '24px 8px 8px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          textAlign: 'left',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.courseName ?? post.review?.courseName ?? ''}
      </div>
    </button>
  );
}

function ExploreVideoGridInner({ posts, isLoading }: ExploreVideoGridProps) {
  const open = useFullscreenFeedStore(s => s.open);

  const handleTap = useCallback(
    (idx: number) => {
      if (!posts.length) return;
      open(posts, idx);
    },
    [posts, open],
  );

  if (isLoading) {
    return (
      <section style={{ padding: '24px 0 0' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            On Camera
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-[1px]">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse" style={{ aspectRatio: '3/4', background: 'rgba(15,23,42,0.06)' }} />
          ))}
        </div>
      </section>
    );
  }

  if (!posts.length) return null;

  // Show first 12 in the grid; legacy ExploreGrid below still shows the full feed.
  const tiles = posts.slice(0, 12);

  return (
    <section style={{ padding: '24px 0 0' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          On Camera
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          Recent video from courses around the world
        </p>
      </div>
      <div className="grid grid-cols-3 gap-[1px]">
        {tiles.map((post, idx) => (
          <VideoTile key={post.id} post={post} onTap={() => handleTap(idx)} />
        ))}
      </div>
    </section>
  );
}

export const ExploreVideoGrid = memo(ExploreVideoGridInner);
