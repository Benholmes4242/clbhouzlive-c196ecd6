import React from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';

const Clubhouse = () => {
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteFollowedPosts();

  const handleLike = (contentId: string) => {
    // Handle like functionality
    console.log('Liked post:', contentId);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-10 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-lg">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Main Content - Fullscreen Vertical Feed */}
      <ClubhouseVerticalFeed
        posts={posts}
        onLike={handleLike}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
      
      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Clubhouse;