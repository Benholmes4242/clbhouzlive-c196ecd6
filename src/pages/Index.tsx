
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import TrendingFeed from '@/components/TrendingFeed';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <TrendingFeed />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
