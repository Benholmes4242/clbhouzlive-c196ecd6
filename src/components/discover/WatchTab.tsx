import { lazy, Suspense } from 'react';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';

const WatchPageContent = lazy(() => import('@/components/watch/WatchPageContent'));

export default function WatchTab() {
  return (
    <Suspense fallback={<WatchGridSkeleton />}>
      <WatchPageContent embedded />
    </Suspense>
  );
}
