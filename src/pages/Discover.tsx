import React, { useState, useMemo } from 'react';
import ClbhouzPageSpinner from '@/components/ui/ClbhouzPageSpinner';

import SegmentedControl from '@/components/discover/SegmentedControl';
import ExploreFilters from '@/components/explore/ExploreFilters';
import DiscoverVideosHeader from '@/components/discover/DiscoverVideosHeader';
import VideoSearchOverlay from '@/components/videos/VideoSearchOverlay';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useVideoLengthFilter } from '@/hooks/useVideoLengthFilter';
import { DURATION_FILTERS } from '@/constants/videoFilters';

import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
// import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned'; // Stored for future use
import DiscoverContent from '@/components/discover/DiscoverContent';
import FollowingFeed from '@/components/discover/FollowingFeed';
import { ChannelsFeed } from '@/components/channels/ChannelsFeed';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

type MainKey = 'shorts' | 'videos' | 'channels' | 'following';

const Discover = () => {
  // Use vertical feed for consistency with Activity tab
  const USE_MODAL_DISCOVER = false; // using DiscoverVerticalFeed for consistency
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main, sub } = useDiscoverQuery();
  const [durationFilter, setDurationFilter] = useVideoLengthFilter();
  
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

  const { 
    isOpen: isFeedOpen, 
    posts: feedPosts,
    initialItem, 
    openFeed, 
    closeFeed,
    setPosts
  } = useVerticalMediaFeed();

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

  // Show loader on first paint if no content yet
  if (loading && allContent.length === 0) {
    return <ClbhouzPageSpinner label="Loading videos…" />;
  }

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleMediaClick = (item: any) => {
    if (USE_MODAL_DISCOVER) {
      // Find the index of the clicked item in our flattened media array
      const clickedIndex = mediaItems.findIndex(mediaItem => 
        mediaItem.url === item.src || mediaItem.id === item.id
      );
      if (clickedIndex !== -1) {
        setModalStartIndex(clickedIndex);
        setModalOpen(true);
      }
    } else {
      // Use vertical feed - set posts and open feed, using allContent instead of content
      setPosts(allContent || []);
      openFeed(item);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  return (
    <div className="min-h-screen bg-background text-foreground page-with-header">
      <main className="pb-20">
          {/* Static Tabs */}
          <div className="relative z-30 bg-white">
            {/* Segmented Control Tabs */}
            <SegmentedControl 
              activeTab={activeFilter}
              onTabChange={() => {}} // No-op: tabs control via URL now
            />
            
            {/* Videos Header - only show for videos tab */}
            {main === 'videos' && (
              <DiscoverVideosHeader
                activeDuration={durationFilter}
                onChangeDuration={setDurationFilter}
                onOpenShorts={() => setDurationFilter('shorts')}
                onSearchSubmit={(query) => setSearchQuery(query)}
                initialQuery={searchQuery}
              />
            )}
            
            {/* Filter Pills Row - show for non-videos/shorts tabs */}
            {main !== 'videos' && main !== 'shorts' && (
              <div className="pt-1 pb-3 border-b border-gray-50 pl-1.5">
                <ExploreFilters 
                  activeFilter={activeFilter}
                  onFilterChange={() => {}} // No-op: pills will be subfilters
                  main={main}
                  sub={sub}
                />
              </div>
            )}
          </div>

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
                    <FollowingFeed onMediaClick={handleMediaClick} />
                  </div>
                );
              }
              // Both 'shorts' and 'videos' use DiscoverContent
              return (
                <div className="md:container md:mx-auto md:px-0 mt-5">
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


        {/* Conditional Modal/Feed based on feature flag */}
        {USE_MODAL_DISCOVER ? (
          // New FullscreenMediaModal approach
          <FullscreenMediaModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            mediaUrl={mediaItems.map(item => item.url)}
            mediaType={mediaItems.map(item => item.type)}
            initialIndex={modalStartIndex}
            // Optional: Add user info if available from posts
          />
        ) : (
          // DiscoverVerticalFeed approach
          initialItem && (
            <DiscoverVerticalFeed
              isOpen={isFeedOpen}
              onClose={closeFeed}
              posts={feedPosts}
              onLike={handleLike}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoadingMore={loading}
              initialItem={initialItem}
            />
          )
        )}

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
      </div>
    );
  };

export default Discover;