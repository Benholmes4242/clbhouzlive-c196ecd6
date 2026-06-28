import { Suspense, lazy } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';

const UnifiedWatchFeed = lazy(() => import('@/components/watch/UnifiedWatchFeed'));

/**
 * WatchHub — Phase 1 IA reframe.
 * Thin standalone wrapper around UnifiedWatchFeed.
 *
 * NOTE: Renders UnifiedWatchFeed directly under a SINGLE Suspense boundary.
 * Previously this stacked WatchHub → WatchTabContent → UnifiedWatchFeed each
 * inside its own Suspense, causing the skeleton to remount/jump twice on
 * cold load and visibly thrashing the page (and the fixed CompactHeader's
 * backdrop blur) until everything settled. Do not re-introduce nested
 * Suspense or a FadeInContent wrapper here — both reintroduce the flicker.
 */
export default function WatchHub() {
  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        className="pb-20 bg-background"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
      >
        <Suspense fallback={<WatchGridSkeleton />}>
          <UnifiedWatchFeed />
        </Suspense>
      </main>
    </PageRoot>
  );
}
