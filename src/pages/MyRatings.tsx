
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import MyRatingsContent from '@/components/courses/MyRatingsContent';

const MyRatings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <MyRatingsContent />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default MyRatings;
