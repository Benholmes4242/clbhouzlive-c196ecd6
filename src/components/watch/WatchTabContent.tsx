import { lazy, Suspense } from 'react';
import WatchGridSkeleton from './WatchGridSkeleton';

const UnifiedWatchFeed = lazy(() => import('./UnifiedWatchFeed'));

interface WatchTabContentProps {
  embedded?: boolean;
}

export default function WatchTabContent({ embedded = false }: WatchTabContentProps) {
  return (
    <Suspense fallback={<WatchGridSkeleton />}>
      <UnifiedWatchFeed embedded={embedded} />
    </Suspense>
  );
}
