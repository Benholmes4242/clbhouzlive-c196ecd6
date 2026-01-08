import React from 'react';
import NewsComponent from '@/components/News';
import { PageRoot } from '@/components/layout/PageRoot';

const News = () => {
  return (
    <PageRoot className="min-h-screen bg-background">
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <NewsComponent />
        </div>
      </main>
    </PageRoot>
  );
};

export default News;