import React from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import BottomNavigation from '@/components/BottomNavigation';
import GlobalTop100Content from '@/components/global-top100/GlobalTop100Content';

const GlobalTop100 = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">Global Top 100</h1>
            <h2 className="font-display text-xl text-muted-foreground">Follow the Clubhouse Community through the World's Top 100 Courses</h2>
          </div>
          
          <GlobalTop100Content />
        </div>
      </main>
      
      
    </div>
  );
};

export default GlobalTop100;