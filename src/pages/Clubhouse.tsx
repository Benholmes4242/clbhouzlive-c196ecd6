import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import ScrollableTabs from '@/components/clubhouse/ScrollableTabs';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';

const Clubhouse = () => {
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteFollowedPosts();

  const [activeTab, setActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const isMobile = useIsMobile();

  const handleLike = (contentId: string) => {
    // Handle like functionality
    console.log('Liked post:', contentId);
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };


  if (isLoading) {
    return <ClubhouzLoading />;
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden relative clubhouse-root" style={{
      minHeight: '100dvh',
    }}>
      {/* Unified Header with Tabs */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        <ClubhouseVerticalFeed
          posts={posts}
          onLike={handleLike}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onCurrentPostChange={handleCurrentPostChange}
        />
      </div>
      
      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-transparent">
        <BottomNavigation variant="clubhouse" />
      </div>
    </div>
  );
};

export default Clubhouse;