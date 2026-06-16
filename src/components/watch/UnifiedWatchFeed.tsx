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
import { WatchMoodChips } from './proshop/WatchMoodChips';
import { useWatchMood } from './proshop/hooks/useWatchMood';

interface UnifiedWatchFeedProps {
  embedded?: boolean;
}

export default function UnifiedWatchFeed({ embedded = false }: UnifiedWatchFeedProps) {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const gridRef = useRef<HTMLDivElement>(null);

  const { mood, setMood } = useWatchMood();

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
      <div style={{ paddingBottom: 24 }}>
        <WatchSectionHeader
          paddingTop={34}
          eyebrow="From the community"
          kickerColor="amber"
          title="Clips to explore"
          sub="Every round, every course, every angle"
        />
        {/* ── Mood pills — directly above the grid they control, below the section subhead ── */}
        <div style={{ paddingTop: 4, paddingBottom: 8 }}>
          <WatchMoodChips active={mood} onChange={setMood} />
        </div>
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
          emptyEmoji={
            mood === 'follows' ? '👥'
            : mood === 'played_courses' ? '⛳'
            : '⛳'
          }
          emptyTitle={
            mood === 'follows' ? 'No videos from your follows yet'
            : mood === 'played_courses' ? 'No videos from courses you\u2019ve played'
            : 'No shorts yet'
          }
          emptyMessage={
            mood === 'follows' ? 'Follow more creators to see their clips here'
            : mood === 'played_courses' ? 'Log a round to start seeing clips from those courses'
            : 'Check back soon for new content'
          }
        />
      </div>

      <ScrollToTopGlass />
    </div>
    </WatchActionsProvider>
  );
}
