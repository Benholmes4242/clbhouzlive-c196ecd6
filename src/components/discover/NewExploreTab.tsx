import { lazy, Suspense } from 'react';
import ExploreGridSkeleton from '@/components/explore-tab-new/ExploreGridSkeleton';

const ExploreTabContent = lazy(() => import('@/components/explore-tab-new/ExploreTabContent'));

export default function NewExploreTab() {
  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <ExploreTabContent embedded />
    </Suspense>
  );
}
