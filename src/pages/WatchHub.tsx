import { PageRoot } from '@/components/layout/PageRoot';
import UnifiedWatchFeed from '@/components/watch/UnifiedWatchFeed';

/**
 * WatchHub — Phase 1 IA reframe.
 * Thin standalone wrapper around UnifiedWatchFeed.
 *
 * NOTE: Renders UnifiedWatchFeed directly with NO Suspense boundary here.
 * The router (`App.tsx`) already wraps this route in a single Suspense with
 * <WatchGridSkeleton/> fallback. A second Suspense here previously caused the
 * skeleton to mount twice on cold load, visibly thrashing the page and the
 * fixed CompactHeader's backdrop blur until everything settled. Do not
 * re-introduce a nested Suspense or a FadeInContent wrapper.
 */
export default function WatchHub() {
  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        className="pb-20 bg-background"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
      >
        <UnifiedWatchFeed />
      </main>
    </PageRoot>
  );
}
