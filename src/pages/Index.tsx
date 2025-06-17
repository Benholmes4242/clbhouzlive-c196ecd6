
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import TrendingFeed from '@/components/TrendingFeed';
import SuggestedUsers from '@/components/SuggestedUsers';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-8 max-w-6xl mx-auto">
          {/* Main feed */}
          <div className="flex-1 max-w-2xl">
            <TrendingFeed />
          </div>
          
          {/* Suggested users sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SuggestedUsers />
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
