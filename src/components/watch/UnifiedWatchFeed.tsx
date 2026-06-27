import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import TrendingThisWeek from './TrendingThisWeek';
import LatestVideosRail from './LatestVideosRail';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { SectionHeader } from '@/components/ui/SectionHeader';
// WatchSectionDivider removed in Phase 4 — kicker + h1 already separate
// sections clearly; dividers fragmented the surface visually.


import { useWatchFeed } from './hooks/useWatchFeed';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { WatchOfTheWeekHero } from './proshop/WatchOfTheWeekHero';
import { CourseAnchoredRail } from './proshop/CourseAnchoredRail';
import { BucketListRail } from './proshop/BucketListRail';
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
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ── Pro Shop: Watch of the Week editorial hero ── */}
      <WatchOfTheWeekHero />

      {/* ── Quick clips — portrait shelf ── */}
      <TrendingThisWeek />

      {/* ── From your bucket list — want-to-play anchored rail ── */}
      <BucketListRail />



      {/* ── Latest videos — full-width YouTube-style stack ── */}
      <LatestVideosRail />

      {/* ── From your courses — single course-anchored rail ── */}
      <CourseAnchoredRail />


      {/* ── Section 3: Watch grid ──
          Phase 5g: explicit 24px paddingBottom guarantees clearance from
          the bottom nav even when PageRoot is bypassed. */}
      <div style={{ paddingBottom: 24 }}>
        <SectionHeader
          tier="rail"
          title="Clips to explore"
          paddingTop={28}
          paddingX={16}
        />
        {/* ── Mood pills — pulled up tight under the title, sitting close to the grid ── */}
        <div style={{ paddingTop: 0, paddingBottom: 2, marginTop: -6 }}>
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
          emptyTitle={
            mood === 'follows' ? 'No videos from your follows yet'
            : mood === 'played_courses' ? 'No videos from courses you\u2019ve played'
            : 'No clips yet'
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
  );
}
