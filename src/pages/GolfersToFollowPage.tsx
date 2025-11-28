import React from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { FadeInContent } from '@/components/ui/FadeInContent';

const GolfersToFollowPage = () => {
  return (
    <div className="min-h-screen bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="px-4 md:container md:mx-auto md:px-0 pt-[72px] pb-[30px]">
          <div className="max-w-5xl mx-auto">
            {/* Content will go here */}
          </div>
        </main>
      </FadeInContent>
    </div>
  );
};

export default GolfersToFollowPage;
