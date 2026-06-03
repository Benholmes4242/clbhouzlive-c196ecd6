import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import TrendingThisWeek from './TrendingThisWeek';
import LatestVideosRail from './LatestVideosRail';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import WatchSectionHeader from './WatchSectionHeader';
// WatchSectionDivider removed in Phase 4 — kicker + h1 already separate
// sections clearly; dividers fragmented the surface visually.
import LongPressTipBanner from './LongPressTipBanner';
import { WatchActionsProvider } from './context/WatchActionsContext';
import { useWatchFeed } from './hooks/useWatchFeed';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { WatchOfTheWeekHero } from './proshop/WatchOfTheWeekHero';
import { CourseAnchoredRail } from './proshop/CourseAnchoredRail';
import { useWatchMood } from './proshop/hooks/useWatchMood';

interface UnifiedWatchFeedProps {
  embedded?: boolean;
}

export default function UnifiedWatchFeed({ embedded = false }: UnifiedWatchFeedProps) {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const gridRef = useRef<HTMLDivElement>(null);

  const { mood } = useWatchMood();

  // Mood pills (in ShellSlot) drive both rails and the grid. useWatchFeed
  // resolves mood→RPC mode internally and applies client-side narrowing
  // for 'follows' and 'played_courses'.
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useWatchFeed({
    userId,
    mood,
    category: undefined,
  });

  return (
    <WatchActionsProvider>
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <LongPressTipBanner />

      {/* ── Pro Shop: Watch of the Week editorial hero ── */}
      <WatchOfTheWeekHero />

      {/* ── Latest videos — full-width YouTube-style stack ── */}
      <LatestVideosRail />

      {/* ── Quick clips — portrait shelf ── */}
      <TrendingThisWeek />

      {/* ── From your courses — single course-anchored rail ── */}
      <CourseAnchoredRail />

      {/* ── Section 3: Watch grid ──
          Phase 5g: explicit 24px paddingBottom guarantees clearance from
          the bottom nav even when PageRoot is bypassed. */}
      <div style={{ paddingTop: 28, paddingBottom: 24 }}>
        <WatchSectionHeader
          eyebrow="Explore"
          title="Clips to explore"
          sub="From the golfing community"
        />
        <WatchAutoplay
          posts={posts}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
        />
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
          userId={userId}
        />
      </div>

      <ScrollToTopGlass />
    </div>
    </WatchActionsProvider>
  );
}
