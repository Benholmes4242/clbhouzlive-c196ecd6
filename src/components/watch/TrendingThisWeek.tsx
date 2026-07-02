import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import { useViewedPostIds } from './hooks/useViewedPostIds';
import { useWatchReveal } from './WatchRevealContext';
import WatchRailTile from './WatchRailTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HRail } from './proshop/HRail';
import { ClipsMark } from './proshop/SectionMarks';
import { useFirstVisibleDecoded } from './shared/useFirstVisibleDecoded';

const VISIBLE_COUNT = 3;

interface TrendingThisWeekProps {
  enabled?: boolean;
}

export default function TrendingThisWeek({ enabled = true }: TrendingThisWeekProps) {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const { posts, isLoading, hasResolved } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: !!userId && enabled,
  });
  const { data: viewedPostIds } = useViewedPostIds();

  const topPosts = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5);
  const { settled: firstVisibleDecoded, onDecoded } = useFirstVisibleDecoded(topPosts.length, VISIBLE_COUNT);
  const isEmpty = hasResolved && topPosts.length === 0;
  const revealed = useWatchReveal(
    'trending-this-week',
    hasResolved && (isEmpty || firstVisibleDecoded),
  );

  const shimmerBase = {
    background: 'rgba(0,0,0,0.06)',
    backgroundImage:
      'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
  } as React.CSSProperties;

  const skeleton = (
    <div style={{ background: 'hsl(var(--background))' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ ...shimmerBase, width: 70, height: 10, borderRadius: 4, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ ...shimmerBase, width: 160, height: 20, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ ...shimmerBase, width: 52, height: 12, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
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

  // Truly still loading — no data yet: skeleton only.
  if (!hasResolved || isLoading) {
    return skeleton;
  }

  if (topPosts.length === 0) return null;

  // Data present: mount content NOW so DecodedImages can decode under the
  // skeleton overlay. Content stays hidden until coordinated reveal fires.
  return (
    <div style={{ position: 'relative', background: 'hsl(var(--background))' }}>
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        style={{ pointerEvents: revealed ? 'auto' : 'none' }}
      >
        <SectionHeader
          role="rail"
          title="Quick clips"
          action={{ label: 'More clips', onClick: () => navigate('/watch/clips') }}
          paddingX={16}
        />

        <HRail paddingBottom={4}>
          {topPosts.map((post, i) => (
            <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
              <WatchRailTile
                post={post}
                index={i}
                allPosts={topPosts}
                viewedPostIds={viewedPostIds}
                onDecoded={i < VISIBLE_COUNT ? onDecoded : undefined}
                debugId={`trending#${i}`}
              />
            </div>
          ))}
        </HRail>
      </motion.div>

      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {skeleton}
        </div>
      )}
    </div>
  );
}
