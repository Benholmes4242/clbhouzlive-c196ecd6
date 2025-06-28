
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import PostExpandedModal from '@/components/explore/PostExpandedModal';
import FloatingPostButton from '@/components/explore/FloatingPostButton';
import { ExploreContentItem } from '@/components/explore/types';
import { mockExploreContent } from '@/components/explore/mockData';

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [content, setContent] = useState<ExploreContentItem[]>(mockExploreContent);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExploreContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight * 0.8) {
        if (!isLoading) {
          setIsLoading(true);
          // Simulate loading more content
          setTimeout(() => {
            setContent(prev => [...prev, ...mockExploreContent.slice(0, 4)]);
            setIsLoading(false);
          }, 1000);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const handleLike = (contentId: string) => {
    setContent(prev => prev.map(item => {
      if (item.id === contentId) {
        return { ...item, likes: item.likes + 1 };
      }
      return item;
    }));
  };

  const handleFollow = (contentId: string) => {
    setContent(prev => prev.map(item => {
      if (item.id === contentId) {
        return { ...item, isFollowing: !item.isFollowing };
      }
      return item;
    }));
  };

  const handleItemClick = (item: ExploreContentItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const filteredContent = content.filter(item => {
    if (activeFilter === 'Trending') return item.label === 'Trending';
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'image';
    if (activeFilter === 'Pros') return item.user?.verified;
    if (activeFilter === 'Tips') return item.label === 'Pro Tip';
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Filter Bar */}
        <ExploreFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Masonry Grid */}
        <ExploreGrid 
          content={filteredContent}
          onLike={handleLike}
          onFollow={handleFollow}
          onItemClick={handleItemClick}
          isLoading={isLoading}
        />
      </main>
      
      {/* Floating Post Button */}
      <FloatingPostButton />
      
      <BottomNavigation />

      {/* Expanded Post Modal */}
      <PostExpandedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
        onLike={handleLike}
        onFollow={handleFollow}
      />
    </div>
  );
};

export default Explore;
