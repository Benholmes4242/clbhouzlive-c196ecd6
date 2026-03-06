import React from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import WatchPageContent from '@/components/watch/WatchPageContent';

const WatchPage: React.FC = () => {
  return (
    <PageRoot hasBottomNav>
      <WatchPageContent />
    </PageRoot>
  );
};

export default WatchPage;
