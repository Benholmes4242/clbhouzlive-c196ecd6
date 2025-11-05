
import React from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import BottomNavigation from '@/components/BottomNavigation';
import MyRatingsContent from '@/components/courses/MyRatingsContent';

const MyRatings = () => {
  return (
    <div className="min-h-screen bg-background">
      
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <MyRatingsContent />
        </div>
      </main>
      
      
    </div>
  );
};

export default MyRatings;
