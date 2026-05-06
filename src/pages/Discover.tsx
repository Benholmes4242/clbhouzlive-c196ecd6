import React, { useState, lazy, Suspense, useEffect } from 'react';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { logDiscoverPageMount, logDiscoverPageUnmount } from '@/utils/discoverTimeline';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';

import SegmentedControl from '@/components/discover/SegmentedControl';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useNavigate } from 'react-router-dom';
import { useStickyHeaderSafeArea } from '@/hooks/useStickyHeaderSafeArea';


// Lazy load heavy/inactive components for better initial bundle size
const WatchTab = lazy(() => import('@/components/discover/WatchTab'));
const NewLoopTab = lazy(() => import('@/components/discover/NewLoopTab'));
const NewCoursesTab = lazy(() => import('@/components/discover/NewExploreTab'));

type MainKey = 'watch' | 'loop' | 'courses';

const Discover = () => {
  const navigate = useNavigate();
  

  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();

  const { main, setMain } = useDiscoverQuery();
  const { sentinelRef, paddingTop } = useStickyHeaderSafeArea();

  // Timing instrumentation - log page mount/unmount
  useEffect(() => {
    logDiscoverPageMount();
    return () => logDiscoverPageUnmount();
  }, []);

  // ============================================
  // EARLY RETURNS ARE SAFE AFTER ALL HOOKS
  // ============================================

  // Show skeleton during rehydration
  if (isRehydrating) {
    return <DiscoverSkeleton />;
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <FadeInContent>
        <main className="pb-20 bg-background">
            {/* Sentinel for sticky-header safe-area detection */}
            <div
              ref={sentinelRef}
              aria-hidden
              style={{ height: 1, width: '100%', pointerEvents: 'none' }}
            />
            {/* Tabs - sit directly on page canvas, no intermediate blocks */}
            <div
              className="px-1"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 19,
                background: 'hsl(var(--background))',
                paddingTop,
                transition: 'padding-top 200ms ease',
              }}
            >
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

            {/* Main Content - Conditional based on active tab with slide animation */}
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
                // 'courses'
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
