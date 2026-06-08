import { useRef, useEffect } from 'react';
import { useNavigationType } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import ShellSlot from '@/components/header/ShellSlot';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { WatchActionsProvider } from './context/WatchActionsContext';


import { ClipsMoodChips } from './clips/ClipsMoodChips';
import { useClipsMood, clipsMoodToWatchMood, clipsMoodLabel } from './clips/hooks/useClipsMood';
import { ClipOfTheWeekHero } from './clips/ClipOfTheWeekHero';
import { LightningRoundRail } from './clips/LightningRoundRail';
import { ClipsCourseAnchoredRail } from './clips/ClipsCourseAnchoredRail';
import { ClipsMostLovedRail } from './clips/ClipsMostLovedRail';
import { MoreToExploreDivider } from './clips/MoreToExploreDivider';

const CREAM = '#F8FAFC';

/**
 * Clips subpage — fixed-shell variant. Editorial header (kicker + h1) and
 * mood chips live in <ShellSlot>; body offsets by var(--shell-extra-h).
 */
export default function ClipsSubpage() {
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useClipsMood();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch,
  } = useWatchFeed({ userId, filter: 'trending' });

  return (
    <WatchActionsProvider>
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        <ShellSlot>
          <ClipsMoodChips active={mood} onChange={setMood} />
        </ShellSlot>

        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
          <ClipOfTheWeekHero />
          <LightningRoundRail userId={userId} mood={mood} />
          <ClipsCourseAnchoredRail userId={userId} mood={mood} />
          <ClipsMostLovedRail userId={userId} mood={mood} />

          <MoreToExploreDivider />

          <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
          <WatchGrid
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            refetch={refetch}
            gridRef={gridRef as React.RefObject<HTMLDivElement>}
            userId={userId}
          />
        </div>

        <ScrollToTopGlass />
      </PageRoot>
    </WatchActionsProvider>
  );
}
