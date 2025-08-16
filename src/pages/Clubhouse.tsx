import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import { Search, Eye } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

const Clubhouse = () => {
  const navigate = useNavigate();
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

  const menuItems = [
    { label: 'Following', active: activeTab === 'Following' },
    { label: 'Explore', active: activeTab === 'Explore' },
    { label: 'Trending', active: activeTab === 'Trending' },
    { label: 'Channels', active: activeTab === 'Channels' },
  ];

  if (isLoading) {
    return <ClubhouzLoading />;
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden relative" style={{
      minHeight: '100dvh',
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      {/* Header with Logo and Floating Menu */}
      <div 
        className={`absolute top-0 left-0 right-0 z-40 backdrop-blur-[2px] bg-white/0 supports-[backdrop-filter]:bg-white/0 ${
          isMobile && currentPostIndex > 0 ? '-translate-y-full' : 'translate-y-0'
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

        {/* Demo Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate('/profile-demo2')}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            Demo 2
          </button>
        </div>

        {/* Floating Horizontal Menu */}
        <div className="flex justify-center pt-16 pb-2">
          <div className="flex items-center space-x-8 px-6">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`relative text-lg font-medium transition-all duration-200 ${
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
      </div>

      {/* Main Content - Fullscreen Vertical Feed */}
      <ClubhouseVerticalFeed
        posts={posts}
        onLike={handleLike}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onCurrentPostChange={handleCurrentPostChange}
      />
      
      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-transparent">
        <BottomNavigation variant="clubhouse" />
      </div>
    </div>
  );
};

export default Clubhouse;