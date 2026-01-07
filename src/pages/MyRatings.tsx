
import React from 'react';
import MyRatingsContent from '@/components/courses/MyRatingsContent';
import { PageRoot } from '@/components/layout/PageRoot';

const MyRatings = () => {
  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)] compact-header-offset">
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <MyRatingsContent />
        </div>
      </main>
    </PageRoot>
  );
};

export default MyRatings;
