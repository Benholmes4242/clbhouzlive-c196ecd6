import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreGrid from '@/components/explore/ExploreGrid';
import ExploreFilters from '@/components/explore/ExploreFilters';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { mockExploreContent } from '@/components/explore/mockData';

const Explore = () => {
  const { user } = useSupabaseSession();
  const [activeFilter, setActiveFilter] = useState('All');

  const handleLike = (contentId: string) => {
    console.log('Liked content:', contentId);
  };

  const handleFollow = (contentId: string) => {
    console.log('Followed user:', contentId);
  };

  const handleLoadMore = () => {
    console.log('Load more content');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20">
          <div className="max-w-md mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>
            <p className="text-muted-foreground">
              Sign in to explore golf content and connect with the community.
            </p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>
            <ExploreFilters 
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
          <ExploreGrid 
            content={mockExploreContent}
            onLike={handleLike}
            onFollow={handleFollow}
            isLoading={false}
            hasMore={false}
            onLoadMore={handleLoadMore}
            activeFilter={activeFilter}
          />
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Explore;