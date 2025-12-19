import React, { useState, useMemo, lazy, Suspense } from 'react';
import CompactHeader from '@/components/header/CompactHeader';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';

import SegmentedControl from '@/components/discover/SegmentedControl';
import ExploreFilters from '@/components/explore/ExploreFilters';
import DiscoverVideosHeader from '@/components/discover/DiscoverVideosHeader';
import VideoSearchOverlay from '@/components/videos/VideoSearchOverlay';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useVideoLengthFilter } from '@/hooks/useVideoLengthFilter';
import { DURATION_FILTERS } from '@/constants/videoFilters';

// import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned'; // Stored for future use
import DiscoverContent from '@/components/discover/DiscoverContent';
import { ChannelsFeed } from '@/components/channels/ChannelsFeed';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { useTop100DiscoverRecommendations } from '@/hooks/useTop100DiscoverRecommendations';
import { useTrendingTop100Moments } from '@/hooks/useTrendingTop100Moments';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import Top100Pills from '@/components/courses/Top100Pills';

// Lazy load heavy/inactive components for better initial bundle size
const FollowingFeed = lazy(() => import('@/components/discover/FollowingFeed'));
const LearnTab = lazy(() => import('@/components/learn/LearnTab'));

type MainKey = 'shorts' | 'videos' | 'channels' | 'following';

const Discover = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main, sub } = useDiscoverQuery();
  const [durationFilter, setDurationFilter] = useVideoLengthFilter();

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
      'channels': FILTER_TYPES.CHANNELS,
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

  // Transform content to MediaItem[] for FullscreenMediaModal - use allContent
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = allContent || [];
    return currentContent.flatMap((post, postIndex) => {
      // Handle posts with media array vs single media
      const mediaArray = post.media && post.media.length > 0 ? post.media : [{ 
        id: `${post.id}-single`, 
        media_type: post.type, 
        media_url: post.src 
      }];
      
      return mediaArray.map((media, mediaIndex) => {
        if (media.media_type === 'video') {
          const streamId = getStreamIdFromUrl(media.media_url);
          return {
            id: `${post.id}-${mediaIndex}`,
            type: 'video' as const,
            url: media.media_url,
            streamId,
            posterUrl: getStreamPoster(media.media_url, '1s') ?? undefined,
            alt: post.title || 'Video'
          };
        }
        return {
          id: `${post.id}-${mediaIndex}`,
          type: 'image' as const,
          url: media.media_url,
          alt: post.title || 'Photo'
        };
      });
    });
  }, [allContent]);

  // No loading state needed - Suspense at route level handles it with GenericPageSkeleton
  // if (loading && allContent.length === 0) return null;

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleMediaClick = (item: any) => {
    // Find the index of the clicked item in our flattened media array
    const clickedIndex = mediaItems.findIndex(mediaItem => 
      mediaItem.url === item.src || mediaItem.id === item.id
    );
    if (clickedIndex !== -1) {
      setModalStartIndex(clickedIndex);
      setModalOpen(true);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  return (
    <PageRoot className="min-h-screen bg-background text-foreground">
      <CompactHeader />
      <FadeInContent>
        <main className="pb-20 bg-background">
            {/* Tabs - sit directly on page canvas, no intermediate blocks */}
            <div className="px-1 bg-background">
              <SegmentedControl 
                activeTab={activeFilter}
                onTabChange={() => {}} // No-op: tabs control via URL now
              />
            </div>
            
            
            {/* Filter Pills Row - show for non-videos/shorts tabs */}
            {main !== 'videos' && main !== 'shorts' && (
              <div className="pt-1 pb-3 pl-3">
                <ExploreFilters 
                  activeFilter={activeFilter}
                  onFilterChange={() => {}} // No-op: pills will be subfilters
                  main={main}
                  sub={sub}
                />
              </div>
            )}

            {/* Suggested Users - Below Tabs/Search */}
            {/* <div className="pt-1">
              <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
            </div> */}
            {/* Commented out for future use - SuggestedUsersRedesigned component is stored in /components/discover/ */}


            {/* Main Content - Conditional based on active tab with slide animation */}
            <SlidingPanels
              activeKey={main as MainKey}
              order={['shorts', 'videos', 'channels', 'following'] as const}
            >
              {(key: MainKey) => {
                if (key === 'channels') {
                  return <ChannelsFeed />;
                }
                if (key === 'following') {
                  return (
                    <div className="md:container md:mx-auto md:px-0 mt-4">
                      <Suspense fallback={null}>
                        <FollowingFeed onMediaClick={handleMediaClick} />
                      </Suspense>
                    </div>
                  );
                }
                if (key === 'videos') {
                  return (
                    <Suspense fallback={null}>
                      <LearnTab onVideoClick={handleMediaClick} />
                    </Suspense>
                  );
                }
                // 'shorts' uses DiscoverContent
                return (
                  <div className="md:container md:mx-auto md:px-0">
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


        {/* Fullscreen Media Modal */}
        <FullscreenMediaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mediaUrl={mediaItems.map(item => item.url)}
          mediaType={mediaItems.map(item => item.type)}
          initialIndex={modalStartIndex}
        />

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