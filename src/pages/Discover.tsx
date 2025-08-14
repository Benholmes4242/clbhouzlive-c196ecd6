import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import SortingChips from '@/components/discover/SortingChips';
import SuggestedUsers from '@/components/discover/SuggestedUsers';
import TrendingNow from '@/components/discover/TrendingNow';
import EngagementPrompts from '@/components/discover/EngagementPrompts';

import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useUserEngagement } from '@/hooks/useUserEngagement';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Discover = () => {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  const [selectedChip, setSelectedChip] = useState<string | null>('all');
  
  // User engagement data
  const { isNewUser, isInactiveUser } = useUserEngagement();
  
  // Get content for the active filter (for the tabs section)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : activeFilter);
  
  // Get trending content specifically for the trending tab
  const { 
    content: trendingContent
  } = useInfiniteExploreContent(FILTER_TYPES.FRIENDS);
  
  const { 
    isOpen: isFeedOpen, 
    initialItem, 
    openFeed, 
    closeFeed 
  } = useVerticalMediaFeed();


  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleMediaClick = (item: any) => {
    openFeed(item);
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  const handleHashtagClick = (tag: string) => {
    // Filter content by hashtag
    console.log('Filter by hashtag:', tag);
    // Could update the selected chip or add hashtag filtering
    // For now, just simulate a search
    setSelectedChip('all'); // Reset sorting chip
  };

  const handleAudioClick = (audioId: string) => {
    // Show posts using this audio or preview the audio
    console.log('Audio clicked:', audioId);
    // In real app: could open audio preview modal or filter by audio
  };

  // Engagement prompt handlers
  const handleCreatePost = () => {
    console.log('Navigate to create post');
    // In real app: navigate to post creation
  };

  const handleTagCourse = () => {
    console.log('Navigate to course tagging');
    // In real app: open course selection modal
  };

  const handleCompleteProfile = () => {
    console.log('Navigate to profile completion');
    // In real app: navigate to profile settings
  };

  const handleFollowCreators = () => {
    console.log('Navigate to creator discovery');
    // In real app: navigate to creators page or open follow suggestions
  };

  // Apply client-side filtering for non-database filters and sorting chips
  const filteredContent = (activeFilter === FILTER_TYPES.TRENDING ? trendingContent : content).filter(item => {
    // First apply existing filter logic
    let passesFilter = true;
    
    // Friends filtering is handled in the database
    if (activeFilter === FILTER_TYPES.FRIENDS || activeFilter === FILTER_TYPES.TRENDING) {
      passesFilter = true;
    }
    // Videos and Photos filtering is handled in the database
    else if (activeFilter === FILTER_TYPES.VIDEOS || activeFilter === FILTER_TYPES.PHOTOS) {
      passesFilter = true;
    }
    // Verified Pros: Empty for now (no content yet)
    else if (activeFilter === FILTER_TYPES.VERIFIED_PROS) {
      passesFilter = false; // No content for verified pros yet
    }
    // Channels: Empty for now (no content yet)
    else if (activeFilter === FILTER_TYPES.CHANNELS) {
      passesFilter = false; // No content for channels yet
    }
    // Hack Shack: Only videos with #hackshack hashtag
    else if (activeFilter === FILTER_TYPES.HACK_SHACK) {
      passesFilter = item.type === MEDIA_TYPES.VIDEO && (
        item.title?.toLowerCase().includes('#hackshack') || 
        item.title?.toLowerCase().includes('hackshack')
      );
    }
    // Brain Game: Videos and photos with #braingame hashtag
    else if (activeFilter === FILTER_TYPES.BRAIN_GAME) {
      passesFilter = (item.type === MEDIA_TYPES.VIDEO || item.type === MEDIA_TYPES.IMAGE) && (
        item.title?.toLowerCase().includes('#braingame') || 
        item.title?.toLowerCase().includes('braingame')
      );
    }

    if (!passesFilter) return false;

    // Then apply sorting chip filtering
    if (!selectedChip || selectedChip === 'all') {
      return true;
    }

    const title = item.title?.toLowerCase() || '';
    const ctaDescription = item.ctaDescription?.toLowerCase() || '';
    const content = `${title} ${ctaDescription}`;

    switch (selectedChip) {
      case 'funny':
        return content.includes('funny') || content.includes('lol') || content.includes('hilarious') || content.includes('laugh');
      case 'tips':
        return content.includes('tip') || content.includes('lesson') || content.includes('how to') || content.includes('tutorial');
      case 'shots':
        return content.includes('shot') || content.includes('drive') || content.includes('putt') || content.includes('swing');
      case 'courses':
        return content.includes('course') || content.includes('golf course') || content.includes('green') || content.includes('fairway');
      case 'reactions':
        return content.includes('reaction') || content.includes('amazing') || content.includes('wow') || content.includes('incredible');
      default:
        return true;
    }
  });

  // Remove duplicates based on src URL for tab content
  const uniqueContent = filteredContent.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );


  return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="pb-20">
          {/* Your Discover Section */}
          <div className="md:container md:mx-auto md:px-0 pt-6">
            <ExploreFilters 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
            />
          </div>


          {/* Trending Now Section */}
          <div>
            <TrendingNow 
              onHashtagClick={handleHashtagClick}
              onAudioClick={handleAudioClick}
            />
          </div>

          {/* Suggested Users */}
          <div className="md:container md:mx-auto md:px-0">
            <SuggestedUsers onUserFollow={handleUserFollow} />
          </div>


          {/* Main Grid with Container */}
          <div className="md:container md:mx-auto md:px-0">
            <ExploreGrid 
              content={uniqueContent}
              onLike={handleLike}
              onFollow={handleFollow}
              onMediaClick={handleMediaClick}
              isLoading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              activeFilter={activeFilter}
              isDiscoverPage={true}
            />
          </div>
        </main>
        
        <BottomNavigation />

        {/* Discover Vertical Feed */}
        {initialItem && (
          <DiscoverVerticalFeed
            isOpen={isFeedOpen}
            onClose={closeFeed}
            posts={uniqueContent}
            onLike={handleLike}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={loading}
            initialItem={initialItem}
          />
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