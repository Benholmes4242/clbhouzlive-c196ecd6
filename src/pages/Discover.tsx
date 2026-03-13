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

// Lazy load heavy/inactive components for better initial bundle size
const NewFriendsTab = lazy(() => import('@/components/discover/NewFriendsTab'));
const NewVideosTab = lazy(() => import('@/components/discover/NewVideosTab'));
const NewExploreTab = lazy(() => import('@/components/discover/NewExploreTab'));
const WatchTab = lazy(() => import('@/components/discover/WatchTab'));

type MainKey = 'watch' | 'videos' | 'explore' | 'following';

const Discover = () => {
  const navigate = useNavigate();

  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();

  const { main, setMain } = useDiscoverQuery();

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
            {/* Tabs - sit directly on page canvas, no intermediate blocks */}
            <div className="px-1">
              <SegmentedControl
                tabs={[
                  { id: 'watch', label: 'Watch' },
                  { id: 'videos', label: 'Videos' },
                  { id: 'explore', label: 'Explore' },
                  { id: 'following', label: 'Friends' },
                ]}
                activeTab={main}
                onTabChange={(id) => setMain(id as MainKey)}
              />
            </div>

            {/* Main Content - Conditional based on active tab with slide animation */}
            <SlidingPanels
              activeKey={main as MainKey}
              order={['watch', 'videos', 'explore', 'following'] as const}
            >
              {(key: MainKey) => {
                if (key === 'watch') {
                  return (
                    <Suspense fallback={null}>
                      <WatchTab />
                    </Suspense>
                  );
                }
                if (key === 'explore') {
                  return (
                    <Suspense fallback={null}>
                      <NewExploreTab />
                    </Suspense>
                  );
                }
                if (key === 'following') {
                  return (
                    <Suspense fallback={null}>
                      <NewFriendsTab />
                    </Suspense>
                  );
                }
                // 'videos'
                return (
                  <Suspense fallback={null}>
                    <NewVideosTab />
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