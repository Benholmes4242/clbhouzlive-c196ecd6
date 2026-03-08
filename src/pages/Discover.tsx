import React, { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { logDiscoverPageMount, logDiscoverPageUnmount } from '@/utils/discoverTimeline';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';

import SegmentedControl from '@/components/discover/SegmentedControl';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { useTop100DiscoverRecommendations } from '@/hooks/useTop100DiscoverRecommendations';
import { useTrendingTop100Moments } from '@/hooks/useTrendingTop100Moments';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
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

  // Top 100 integration hooks (used by sub-components via context/props in future)
  const {
    data: intent,
    isLoading: intentLoading,
  } = useUserTop100Intent();

  const {
    data: personalRecs = [],
    isLoading: personalLoading,
  } = useTop100DiscoverRecommendations(12);

  const {
    data: trendingTop100 = [],
    isLoading: trendingLoading,
  } = useTrendingTop100Moments(12, 7);

  const hasTop100Journey =
    (intent?.total_top100_played ?? 0) > 0 ||
    (intent?.wishlist_list_slugs?.length ?? 0) > 0;

  // Friends snapshot for nudges
  const { data: friendsSnapshot } = useTop100FriendsSnapshot();

  // Derive personalTop100Nudge
  const personalTop100Nudge = React.useMemo(() => {
    if (!friendsSnapshot) return null;
    const me = friendsSnapshot.me;
    const friends = friendsSnapshot.friends || [];
    if (!me || friends.length === 0) return null;

    const myCount = me.total_top100_played;
    const sorted = friends
      .slice()
      .sort((a, b) => b.total_top100_played - a.total_top100_played);

    const leader = sorted[0];

    if (leader && leader.total_top100_played > myCount) {
      const diff = leader.total_top100_played - myCount;
      return `You're ${diff} Top 100 course${diff === 1 ? '' : 's'} behind ${leader.display_name}.`;
    }

    return "You're leading your friends on the Top 100 journey – don't let them catch up.";
  }, [friendsSnapshot]);

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
                    <div className="md:container md:mx-auto md:px-0">
                      <Suspense fallback={null}>
                        <CommunityFeed />
                      </Suspense>
                    </div>
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

        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </PageRoot>
    );
  };

export default Discover;
