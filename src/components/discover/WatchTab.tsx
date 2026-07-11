import { Suspense } from 'react';
import WatchHubV2 from '@/features/watch-v2/WatchHubV2';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

export default function WatchTab() {
  return (
    <Suspense fallback={<GenericPageSkeleton />}>
      <WatchHubV2 embedded />
    </Suspense>
  );
}
