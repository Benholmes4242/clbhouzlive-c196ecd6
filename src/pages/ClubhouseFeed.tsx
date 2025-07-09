import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

const ClubhouseFeed = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Clubhouse Feed</h1>
          <p className="text-muted-foreground">
            Feed functionality temporarily disabled during maintenance.
          </p>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;