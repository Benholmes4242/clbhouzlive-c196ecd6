import React, { useState, useMemo, lazy, Suspense, useEffect, useCallback } from 'react';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { logDiscoverPageMount, logDiscoverPageUnmount, logWatchTabActive } from '@/utils/discoverTimeline';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';

import SegmentedControl from '@/components/discover/SegmentedControl';
import ExploreFilters from '@/components/explore/ExploreFilters';
import DiscoverVideosHeader from '@/components/discover/DiscoverVideosHeader';
import VideoSearchOverlay from '@/components/videos/VideoSearchOverlay';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useVideoLengthFilter } from '@/hooks/useVideoLengthFilter';
import { DURATION_FILTERS } from '@/constants/videoFilters';
import { ContinueWatchingSection } from '@/components/videos/ContinueWatchingSection';

// import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned'; // Stored for future use
import DiscoverContent from '@/components/discover/DiscoverContent';
import { ChannelsFeed } from '@/components/channels/ChannelsFeed';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';

import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted
import { usePostEngagement } from '@/hooks/usePostEngagement';
import type { ExploreContentItem } from '@/components/explore/types';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { useTop100DiscoverRecommendations } from '@/hooks/useTop100DiscoverRecommendations';
import { useTrendingTop100Moments } from '@/hooks/useTrendingTop100Moments';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import Top100Pills from '@/components/courses/Top100Pills';
import { toast } from 'sonner';


// Lazy load heavy/inactive components for better initial bundle size
const CommunityFeed = lazy(() => import('@/components/community/CommunityFeed'));
const VideosTab = lazy(() => import('@/components/videos/VideosTab'));
const ExploreTab = lazy(() => import('@/components/explore-tab/ExploreTab'));

type MainKey = 'shorts' | 'videos' | 'explore' | 'following';

const Discover = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Track current fullscreen post for engagement
  const [currentFullscreenPostId, setCurrentFullscreenPostId] = useState<string | null>(null);
  
  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();
  
  const { main, sub, setMain } = useDiscoverQuery();
  const [durationFilter, setDurationFilter] = useVideoLengthFilter();

  // Timing instrumentation - log page mount/unmount
  useEffect(() => {
    logDiscoverPageMount();
    return () => logDiscoverPageUnmount();
  }, []);

  // Top 100 integration hooks
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
  
  // Convert durationFilter key to range for API
  const durationRange = React.useMemo(() => {
    const filter = DURATION_FILTERS.find(f => f.key === durationFilter);
    if (!filter || filter.key === 'all') return undefined;
    return { from: filter.from, to: filter.to };
  }, [durationFilter]);

  // Detect Shorts mode for compact view
  const isShorts = main === 'shorts' || durationFilter === 'shorts';

  // Derive activeFilter from URL main param (single source of truth)
  const activeFilter = React.useMemo(() => {
    const mainToFilter: Record<string, string> = {
      'shorts': FILTER_TYPES.VIDEOS,
      'videos': FILTER_TYPES.VIDEOS,
      'explore': FILTER_TYPES.CHANNELS,
      'channels': FILTER_TYPES.CHANNELS, // Back-compat
      'following': FILTER_TYPES.FOLLOWING,
      'friends': FILTER_TYPES.FOLLOWING, // Back-compat
      'verified-pros': FILTER_TYPES.VERIFIED_PROS,
      'hack-shack': FILTER_TYPES.HACK_SHACK,
    };
    return mainToFilter[main] || FILTER_TYPES.VIDEOS;
  }, [main]);

  // Reset tags when switching main pill
  React.useEffect(() => {
    setSelectedTags([]);
  }, [main]);

  // Log when Watch tab becomes active
  useEffect(() => {
    if (main === 'shorts' || main === 'videos') {
      logWatchTabActive(main);
    }
  }, [main]);
  
  // Get content for the vertical feed (we'll use the new DiscoverContent component for the grid)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter, sub, durationRange);

  const { optimisticPosts } = useOptimisticPostInsertion();

  // Combine optimistic posts with regular content
  const allContent = React.useMemo(() => {
    return [...optimisticPosts, ...(content || [])];
  }, [optimisticPosts, content]);

  // Get engagement state for current fullscreen post
  const { toggleLike } = usePostEngagement(currentFullscreenPostId);

  // Share handler
  const handleSharePost = useCallback((postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on Clbhouz',
        url: shareUrl,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Copied to clipboard');
      }).catch(() => {
        toast.error("Couldn't copy link");
      });
    }
  }, []);

  // TODO: Wire to new media player
  const openFullscreen = (...args: any[]) => console.log('[Fullscreen] TODO: Wire to new media player', args);

  // ============================================
  // ALL CALLBACKS MUST USE useCallback HOOKS
  // Defined BEFORE any early returns
  // ============================================

  const handleLike = useCallback((contentId: string) => {
    // Update likes optimistically via engagement hook
  }, []);

  const handleFollow = useCallback((contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
  }, []);

  // Handle media click from DiscoverContent - opens unified fullscreen player
  // CRITICAL FIX: Accept optional items array to use the correct data source
  const handleMediaClick = useCallback((item: ExploreContentItem, index?: number, items?: any[]) => {
    // If items array is provided, use it (e.g., from WatchGridV2 or Hero)
    // Otherwise fall back to allContent (legacy behavior)
    const playlist = items && items.length > 0 ? items : allContent;
    
    console.log('[Discover] handleMediaClick:', {
      itemId: item.id?.slice(0, 8),
      providedIndex: index,
      usingProvidedItems: !!(items && items.length > 0),
      playlistLength: playlist.length,
      firstFiveIds: playlist.slice(0, 5).map((p: any) => (p.id || p.postId)?.slice(0, 8))
    });
    
    // Find the index if not provided
    const clickedIndex = index ?? playlist.findIndex(c => c.id === item.id);
    
    console.log('[Discover] Opening fullscreen at index:', clickedIndex, 'for item:', item.id?.slice(0, 8));
    
    if (clickedIndex !== -1) {
      setCurrentFullscreenPostId(item.id); // Set initial post
      // CRITICAL: Pass focusItemId so fullscreen viewer can find the item after deduplication
      openFullscreen(playlist, clickedIndex, item.id);
    }
  }, [allContent, openFullscreen]);

  // Handle video click from VideosTab
  // NOTE: VideosTab now handles fullscreen internally using its own data source.
  // This callback is kept for any navigation or analytics, but doesn't open fullscreen.
  const handleVideoClick = useCallback((_id: string) => {
    // VideosTab handles fullscreen internally
  }, []);

  // Handle media click from CommunityFeed (receives any item shape)
  const handleCommunityMediaClick = useCallback((item: any) => {
    const clickedIndex = allContent.findIndex(c => c.id === item.id);
    if (clickedIndex !== -1) {
      openFullscreen(allContent, clickedIndex);
    }
  }, [allContent, openFullscreen]);

  const handleUserFollow = useCallback((userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
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
                  { id: 'shorts', label: 'Watch' },
                  { id: 'videos', label: 'Videos' },
                  { id: 'explore', label: 'Explore' },
                  { id: 'following', label: 'Friends' },
                ]}
                activeTab={main}
                onTabChange={(id) => setMain(id as MainKey)}
              />
            </div>
            
            
            {/* Filter Pills Row removed - now handled by DiscoverCommandCenter in each tab */}

            {/* Suggested Users - Below Tabs/Search */}
            {/* <div className="pt-1">
              <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
            </div> */}
            {/* Commented out for future use - SuggestedUsersRedesigned component is stored in /components/discover/ */}


            {/* Main Content - Conditional based on active tab with slide animation */}
            <SlidingPanels
              activeKey={main as MainKey}
              order={['shorts', 'videos', 'explore', 'following'] as const}
            >
              {(key: MainKey) => {
                if (key === 'explore') {
                  return (
                    <Suspense fallback={null}>
                      <ExploreTab onMediaClick={handleCommunityMediaClick} />
                    </Suspense>
                  );
                }
                if (key === 'following') {
                  return (
                    <div className="md:container md:mx-auto md:px-0">
                      <Suspense fallback={null}>
                        <CommunityFeed onMediaClick={handleCommunityMediaClick} />
                      </Suspense>
                    </div>
                  );
                }
                if (key === 'videos') {
                  return (
                    <Suspense fallback={null}>
                      <VideosTab onVideoClick={handleVideoClick} />
                    </Suspense>
                  );
                }
                // 'shorts' uses DiscoverContent
                return (
                  <div className="md:container md:mx-auto md:px-0">
                    {/* Continue Watching section at top of Shorts/Discover */}
                    <ContinueWatchingSection
                      onVideoClick={(id) => navigate(`/video/${id}`)}
                      className="mb-6 mt-2"
                    />
                    <DiscoverContent
                      onLike={handleLike}
                      onFollow={handleFollow}
                      onMediaClick={handleMediaClick}
                      searchQuery={searchQuery}
                      selectedTags={selectedTags}
                    />
                  </div>
                );
              }}
            </SlidingPanels>
        </main>
      </FadeInContent>


        {/* Unified Fullscreen Player - rendered via context provider in App.tsx */}

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