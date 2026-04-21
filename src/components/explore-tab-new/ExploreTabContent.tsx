import { useState, useCallback, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegionChips } from './hooks/useExploreRegionChips';
import { useExploreMood } from './hooks/useExploreMood';
import { ExploreHeader } from './ExploreHeader';
import { MoodChips } from './MoodChips';
import { ExploreHero } from './ExploreHero';
import { ExploreRecommendations } from './ExploreRecommendations';
import { ExplorePassport } from './ExplorePassport';
import { ExploreEchoCTA } from './ExploreEchoCTA';
import { ExploreDestinations } from './ExploreDestinations';
import { ExploreVideoGrid } from './ExploreVideoGrid';
import { FeaturedCoursesCarousel } from './FeaturedCoursesCarousel';
import { BucketListStrip } from './BucketListStrip';
import { BestRoundsStrip } from './BestRoundsStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';
import ExploreGrid from './ExploreGrid';
import ExploreAutoplay from './ExploreAutoplay';
import { ExploreSearchOverlay } from './ExploreSearchOverlay';

interface ExploreTabContentProps {
  embedded?: boolean;
}

export default function ExploreTabContent({ embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const { mood, setMood } = useExploreMood();
  const { regions, isLoading: regionsLoading } = useExploreRegionChips();

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useExploreFeed({ userId, region: activeRegion });

  const coursePosts = useMemo(() => {
    return posts.filter(post => !!(post.courseName || post.review?.courseName));
  }, [posts]);

  const handleRegionChange = useCallback((slug: string | null) => {
    setActiveRegion(slug);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetSeen]);

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <ExploreHeader
        activeRegion={activeRegion}
        regions={regions}
        regionsLoading={regionsLoading}
        onRegionChange={handleRegionChange}
        onOpenSearch={handleOpenSearch}
        embedded={embedded}
      />

      {/* ===== ACTIVE / PERSONALISED ===== */}
      <MoodChips active={mood} onChange={setMood} />
      <ExploreHero userId={userId} mood={mood} />
      <ExploreRecommendations userId={userId} mood={mood} />
      <ExplorePassport userId={userId} />
      <ExploreEchoCTA mood={mood} />
      <ExploreDestinations activeRegion={activeRegion} onRegionSelect={handleRegionChange} />

      {/* ===== EDITORIAL / SUPPORTING (ported from courses-tab) ===== */}
      {activeRegion === null && <FeaturedCoursesCarousel onRegionSelect={handleRegionChange} />}
      {activeRegion === null && <BucketListStrip />}
      <BestRoundsStrip activeRegion={activeRegion} />
      <ReviewsOfTheWeekStrip activeRegion={activeRegion} />

      {/* ===== VIDEO TAIL ===== */}
      <ExploreVideoGrid posts={coursePosts} isLoading={isLoading} />

      {/* ===== Section divider before legacy rails ===== */}
      <div style={{ padding: '32px 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          More to explore
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          The full course feed
        </p>
      </div>

      {/* ===== LEGACY: kept live alongside new content for Session 2 ===== */}
      <ExploreGrid
        posts={posts}
        coursePosts={coursePosts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        gridRef={gridRef}
        activeRegion={activeRegion}
        onRegionChange={handleRegionChange}
      />

      <ExploreAutoplay posts={coursePosts} gridRef={gridRef} />

      <ExploreSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={userId}
      />
    </div>
  );
}
