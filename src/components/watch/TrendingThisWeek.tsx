import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchTile from './WatchTile';
import WatchAutoplay from './WatchAutoplay';

interface TrendingThisWeekProps {
  enabled?: boolean;
}

export default function TrendingThisWeek({ enabled = true }: TrendingThisWeekProps) {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const stripRef = useRef<HTMLDivElement>(null);

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: !!userId && enabled,
  });

  const topPosts = posts.slice(0, 5);
  const heroPost = topPosts[0];
  const stripPosts = topPosts.slice(1, 4);

  // ── Dark skeleton loading state ──
  if (isLoading) {
    const shimmerBase = {
      background: 'rgba(255,255,255,0.07)',
      backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.13) 50%, transparent 100%)',
      backgroundSize: '200% 100%',
    } as React.CSSProperties;

    return (
      <div style={{ background: '#0a0a0a' }}>
        {/* Label row skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
          <div style={{ ...shimmerBase, width: 140, height: 12, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ ...shimmerBase, width: 52, height: 12, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
        </div>
        {/* Hero skeleton */}
        <div style={{ ...shimmerBase, width: '100%', aspectRatio: '16/9', animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
        {/* Strip skeleton */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                ...shimmerBase,
                flex: 1,
                aspectRatio: '4/5',
                animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (topPosts.length === 0) return null;

  return (
    <div style={{ background: '#0a0a0a' }}>
      {/* ── Section label ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px 10px',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#F7931E',
        }}>
          ⛳ Trending this week
        </span>
        <button
          onClick={() => navigate('/watch/clips')}
          style={{
            fontSize: 12, fontWeight: 600, color: '#F7931E',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 2,
            padding: 0,
          }}
        >
          See all →
        </button>
      </div>

      <WatchAutoplay posts={topPosts} gridRef={stripRef as React.RefObject<HTMLDivElement>} />

      {/* ── Hero — full width 16:9 ── */}
      <div
        ref={stripRef}
        style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}
      >
        <WatchTile post={heroPost} index={0} allPosts={topPosts} />
        {/* #1 badge */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12, zIndex: 4,
          background: '#F7931E', color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
          padding: '3px 8px', borderRadius: 4,
          pointerEvents: 'none',
        }}>
          #1
        </div>
        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── 3-up strip ── */}
      <div style={{ display: 'flex', gap: 2 }}>
        {stripPosts.map((post, i) => (
          <div
            key={post.id}
            style={{ flex: 1, position: 'relative', aspectRatio: '4/5', overflow: 'hidden' }}
          >
            <WatchTile post={post} index={i + 1} allPosts={topPosts} />
            {/* Rank badge */}
            <div style={{
              position: 'absolute', top: 6, left: 6, zIndex: 4,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 9, fontWeight: 800,
              padding: '2px 6px', borderRadius: 3,
              pointerEvents: 'none',
            }}>
              #{i + 2}
            </div>
            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 55%)',
              pointerEvents: 'none',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
