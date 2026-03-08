import { lazy, Suspense } from 'react';
import { FriendsFeedSkeleton } from '@/components/friends-tab/FriendsFeedSkeleton';

const FriendsTabContent = lazy(() => import('@/components/friends-tab/FriendsTabContent'));

export default function NewFriendsTab() {
  return (
    <Suspense fallback={<FriendsFeedSkeleton />}>
      <FriendsTabContent embedded />
    </Suspense>
  );
}
