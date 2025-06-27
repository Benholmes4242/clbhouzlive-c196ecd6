
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FloatingPostButton from '@/components/posts/FloatingPostButton';
import NewsComponent from '@/components/News';

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <NewsComponent />
        </div>
      </main>
      
      <FloatingPostButton />
      <BottomNavigation />
    </div>
  );
};

export default News;
