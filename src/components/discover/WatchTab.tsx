import { lazy, Suspense } from 'react';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';

const WatchTabContent = lazy(() => import('@/components/watch/WatchTabContent'));

export default function WatchTab() {
  return (
    <Suspense fallback={<WatchGridSkeleton />}>
      <WatchTabContent embedded />
    </Suspense>
  );
}
