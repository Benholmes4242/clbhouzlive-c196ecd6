import { lazy, Suspense } from 'react';
import { FriendsFeedSkeleton } from '@/components/friends-tab/FriendsFeedSkeleton';

const LoopTabContent = lazy(() => import('@/components/loop-tab/LoopTabContent'));

export default function NewLoopTab() {
  return (
    <Suspense fallback={<FriendsFeedSkeleton />}>
      <LoopTabContent embedded />
    </Suspense>
  );
}
