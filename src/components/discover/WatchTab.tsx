import { lazy, Suspense, useState } from 'react';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const WatchTabContent = lazy(() => import('@/components/watch/WatchTabContent'));
const WatchSearchOverlay = lazy(() => import('@/components/watch/WatchSearchOverlay'));

export default function WatchTab() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return (
    <>
      <Suspense fallback={<WatchGridSkeleton />}>
        <WatchTabContent embedded />
      </Suspense>
      {isSearchOpen && (
        <Suspense fallback={null}>
          <WatchSearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            userId={userId}
          />
        </Suspense>
      )}
    </>
  );
}
