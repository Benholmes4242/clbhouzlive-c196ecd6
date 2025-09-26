
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

import NewsComponent from '@/components/News';

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <NewsComponent />
        </div>
      </main>
      
      
      
    </div>
  );
};

export default News;
