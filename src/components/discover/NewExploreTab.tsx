import { lazy, Suspense } from 'react';
import DiscoverCourseLedSkeleton from '@/components/explore-tab-new/courseled/DiscoverCourseLedSkeleton';

const ExploreTabContent = lazy(() => import('@/components/explore-tab-new/ExploreTabContent'));

export default function NewExploreTab() {
  return (
    <Suspense fallback={<DiscoverCourseLedSkeleton />}>
      <ExploreTabContent embedded />
    </Suspense>
  );
}
