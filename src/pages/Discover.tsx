import React, { lazy, Suspense, useEffect } from 'react';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { logDiscoverPageMount, logDiscoverPageUnmount } from '@/utils/discoverTimeline';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';

import SegmentedControl from '@/components/discover/SegmentedControl';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';

import ShellSlot from '@/components/header/ShellSlot';
import { WatchMoodChips } from '@/components/watch/proshop/WatchMoodChips';
import { useWatchMood } from '@/components/watch/proshop/hooks/useWatchMood';
import DiscoverExploreShellRow from '@/components/discover/DiscoverExploreShellRow';
import DiscoverFriendsShellRow from '@/components/discover/DiscoverFriendsShellRow';
import { useExploreMood } from '@/components/explore-tab-new/hooks/useExploreMood';
import { useExploreRegion } from '@/components/explore-tab-new/hooks/useExploreRegion';
import { useLoopMode } from '@/components/loop-tab/hooks/useLoopMode';

// Lazy load heavy/inactive components for better initial bundle size
const WatchTab = lazy(() => import('@/components/discover/WatchTab'));
const NewLoopTab = lazy(() => import('@/components/discover/NewLoopTab'));
const NewCoursesTab = lazy(() => import('@/components/discover/NewExploreTab'));

type MainKey = 'watch' | 'loop' | 'courses';

const Discover = () => {
  // (navigate not used here)

  const { isRehydrating } = useRehydrationSafe();
  const { main, setMain } = useDiscoverQuery();
  const { mood, setMood } = useWatchMood();

  // URL-backed filter state shared with the active sub-tab's body.
  const { mood: exploreMood, setMood: setExploreMood } = useExploreMood();
  const { region: exploreRegion, setRegion: setExploreRegion } = useExploreRegion();
  const { mode: loopMode, setMode: setLoopMode } = useLoopMode();

  useEffect(() => {
    logDiscoverPageMount();
    return () => logDiscoverPageUnmount();
  }, []);

  if (isRehydrating) {
    return <DiscoverSkeleton />;
  }

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <ShellSlot>
        <div className="px-1">
          <SegmentedControl
            tabs={[
              { id: 'watch', label: 'Watch' },
              { id: 'courses', label: 'Explore' },
              { id: 'loop', label: 'Friends' },
            ]}
            activeTab={main}
            onTabChange={(id) => setMain(id as MainKey)}
          />
        </div>
        {main === 'watch' && (
          <WatchMoodChips active={mood} onChange={setMood} />
        )}
        {main === 'courses' && (
          <DiscoverExploreShellRow
            activeMood={exploreMood}
            onMoodChange={setExploreMood}
            activeRegion={exploreRegion}
            onRegionChange={setExploreRegion}
          />
        )}
        {main === 'loop' && (
          <DiscoverFriendsShellRow
            activeMode={loopMode}
            onModeChange={setLoopMode}
          />
        )}
      </ShellSlot>

      <FadeInContent>
        <main
          className="pb-20 bg-background"
          style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
        >
          <SlidingPanels
            activeKey={main as MainKey}
            order={['watch', 'courses', 'loop'] as const}
          >
            {(key: MainKey) => {
              if (key === 'watch') {
                return (
                  <Suspense fallback={null}>
                    <WatchTab />
                  </Suspense>
                );
              }
              if (key === 'loop') {
                return (
                  <Suspense fallback={null}>
                    <NewLoopTab />
                  </Suspense>
                );
              }
              return (
                <Suspense fallback={null}>
                  <NewCoursesTab />
                </Suspense>
              );
            }}
          </SlidingPanels>
        </main>
      </FadeInContent>
    </PageRoot>
  );
};

export default Discover;
