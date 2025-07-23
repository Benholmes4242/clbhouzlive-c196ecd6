import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
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

  const [headerVisible, setHeaderVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('Following');

  const handleLike = (contentId: string) => {
    // Handle like functionality
    console.log('Liked post:', contentId);
  };

  const handleScroll = (scrollDirection: 'up' | 'down') => {
    if (scrollDirection === 'up') {
      setHeaderVisible(false);
    } else if (scrollDirection === 'down') {
      setHeaderVisible(true);
    }
  };

  const menuItems = [
    { label: 'Following', active: activeTab === 'Following' },
    { label: 'Explore', active: activeTab === 'Explore' },
    { label: 'Trending', active: activeTab === 'Trending' },
    { label: 'Channels', active: activeTab === 'Channels' },
  ];

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
    <div className="h-screen bg-transparent overflow-hidden relative" style={{
      minHeight: '100dvh',
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      {/* Header with Logo and Floating Menu */}
      <div 
        className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Logo Mark and Clubhouse Logo */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1 md:gap-2">
            <img
              src="/lovable-uploads/dc594c09-ec74-44cb-82be-f42cbdcb12cf.png"
              alt="Logo Mark"
              className="h-10 md:h-12 w-auto object-contain flex-shrink-0"
            />
            <img
              src="/lovable-uploads/638495f6-b30e-46cb-bed7-e42b9b5ab329.png"
              alt="clbhouz Logo"
              className="h-10 md:h-12 w-auto object-contain flex-shrink-0"
            />
          </div>
        </div>

        {/* Floating Horizontal Menu */}
        <div className="flex justify-center pt-16 pb-4">
          <div className="flex items-center space-x-8 px-6">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`relative text-base font-medium transition-all duration-200 ${
                  item.active 
                    ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-white after:rounded-full' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button className="text-white/70 hover:text-white transition-colors duration-200">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Main Content - Fullscreen Vertical Feed */}
      <ClubhouseVerticalFeed
        posts={posts}
        onLike={handleLike}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onScroll={handleScroll}
      />
      
      {/* Footer with Glass Effect - matches header styling */}
      <footer className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="flex items-center justify-center h-12 px-4">
          <div className="flex items-center space-x-6 text-sm text-white/70">
            <span>© 2024 clbhouz</span>
            <span>•</span>
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
      
      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-transparent">
        <BottomNavigation variant="clubhouse" />
      </div>
    </div>
  );
};

export default Clubhouse;