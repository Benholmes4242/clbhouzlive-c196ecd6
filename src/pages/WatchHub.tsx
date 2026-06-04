import { Suspense, lazy } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';

const WatchTabContent = lazy(() => import('@/components/watch/WatchTabContent'));

/**
 * WatchHub — Phase 1 IA reframe.
 * Thin standalone wrapper around UnifiedWatchFeed (via WatchTabContent).
 */
export default function WatchHub() {
  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <FadeInContent>
        <main
          className="pb-20 bg-background"
          style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
        >
          <Suspense fallback={<WatchGridSkeleton />}>
            <WatchTabContent />
          </Suspense>
        </main>
      </FadeInContent>
    </PageRoot>
  );
}
