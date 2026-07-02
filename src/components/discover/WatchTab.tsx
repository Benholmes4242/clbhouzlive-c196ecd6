import { Suspense, useState, lazy } from 'react';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';
import WatchTabContent from '@/components/watch/WatchTabContent';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const WatchSearchOverlay = lazy(() => import('@/components/watch/WatchSearchOverlay'));

export default function WatchTab() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return (
    <>
      <WatchTabContent embedded />
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
