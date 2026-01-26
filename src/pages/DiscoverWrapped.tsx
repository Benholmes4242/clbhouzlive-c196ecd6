import React, { useEffect, lazy, Suspense } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';

// Lazy load Discover to avoid static/dynamic import conflict with App.tsx
const Discover = lazy(() => import('./Discover'));

const DiscoverWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return (
    <>
      <Suspense fallback={<DiscoverSkeleton />}>
        <Discover />
      </Suspense>
      <ScrollToTopGlass />
    </>
  );
};

export default DiscoverWrapped;
