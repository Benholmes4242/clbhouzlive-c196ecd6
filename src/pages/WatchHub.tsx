import { Suspense, lazy } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import ShellSlot from '@/components/header/ShellSlot';
import WatchGridSkeleton from '@/components/watch/WatchGridSkeleton';
import { WatchMoodChips } from '@/components/watch/proshop/WatchMoodChips';
import { useWatchMood } from '@/components/watch/proshop/hooks/useWatchMood';

const WatchTabContent = lazy(() => import('@/components/watch/WatchTabContent'));

/**
 * WatchHub — Phase 1 IA reframe.
 * Thin standalone wrapper around UnifiedWatchFeed (via WatchTabContent),
 * with the mood chip row that used to live in Discover.
 */
export default function WatchHub() {
  const { mood, setMood } = useWatchMood();

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <ShellSlot>
        <WatchMoodChips active={mood} onChange={setMood} />
      </ShellSlot>

      <FadeInContent>
        <main
          className="pb-20 bg-background"
          style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#64748B',
              padding: '10px 16px 4px',
              margin: 0,
            }}
          >
            Browse — Find a course, a creator, or a moment
          </p>
          <Suspense fallback={<WatchGridSkeleton />}>
            <WatchTabContent />
          </Suspense>
        </main>
      </FadeInContent>
    </PageRoot>
  );
}
