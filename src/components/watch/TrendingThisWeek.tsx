import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchRailTile from './WatchRailTile';
import WatchSectionHeader from './WatchSectionHeader';

interface TrendingThisWeekProps {
  enabled?: boolean;
}

export default function TrendingThisWeek({ enabled = true }: TrendingThisWeekProps) {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: !!userId && enabled,
  });

  const topPosts = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5);

  // ── Loading skeleton ──
  if (isLoading) {
    const shimmerBase = {
      background: 'rgba(0,0,0,0.06)',
      backgroundImage:
        'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
      backgroundSize: '200% 100%',
    } as React.CSSProperties;

    return (
      <div style={{ background: '#F8FAFC' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                ...shimmerBase,
                width: 70,
                height: 10,
                borderRadius: 4,
                animation: 'clb-shimmer 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                ...shimmerBase,
                width: 160,
                height: 20,
                borderRadius: 6,
                animation: 'clb-shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <div
            style={{
              ...shimmerBase,
              width: 52,
              height: 12,
              borderRadius: 6,
              animation: 'clb-shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...shimmerBase,
                flexShrink: 0,
                width: 200,
                aspectRatio: '3/4',
                borderRadius: 12,
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
    <div style={{ background: '#F8FAFC' }}>
      <WatchSectionHeader
        eyebrow="Trending"
        title="Hot right now"
        onSeeAll={() => navigate('/watch/clips')}
        paddingTop={12}
      />

      {/* Horizontal scroll — ranked cards, with edge padding + snap */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '0 16px 4px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
        {topPosts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
            <WatchRailTile post={post} index={i} allPosts={topPosts} rank={i + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}
