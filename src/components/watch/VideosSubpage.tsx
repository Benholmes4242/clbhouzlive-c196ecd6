import { useNavigationType } from 'react-router-dom';
import { useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { WatchActionsProvider } from '@/components/watch/context/WatchActionsContext';

import ShellSlot from '@/components/header/ShellSlot';

import { useVideosMood } from '@/components/watch/videos/hooks/useVideosMood';
import { VideosMoodChips } from '@/components/watch/videos/VideosMoodChips';
import { VideoOfTheWeekHero } from '@/components/watch/videos/VideoOfTheWeekHero';
import { VideosContinueWatchingRail } from '@/components/watch/videos/VideosContinueWatchingRail';
import { VideosCourseAnchoredRail } from '@/components/watch/videos/VideosCourseAnchoredRail';
import { VideosCategoryRail } from '@/components/watch/videos/VideosCategoryRail';
import { VideosFollowingRail } from '@/components/watch/videos/VideosFollowingRail';
import { MoreToWatchDivider } from '@/components/watch/videos/MoreToWatchDivider';
import { VideosFullFeed } from '@/components/watch/videos/VideosFullFeed';

const CREAM = '#F8FAFC';

/**
 * Videos subpage — fixed-shell variant. Editorial header (kicker + h1) and
 * mood chips live in <ShellSlot>; body offsets by var(--shell-extra-h).
 * Search is now reached via CompactHeader's magnifier (GlobalSearchOverlay).
 */
export default function VideosSubpage() {
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useVideosMood();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WatchActionsProvider>
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        <ShellSlot>
          <VideosMoodChips active={mood} onChange={setMood} />
        </ShellSlot>

        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
          <VideoOfTheWeekHero />
          <VideosContinueWatchingRail userId={userId} />
          <VideosCourseAnchoredRail userId={userId} />
          <VideosCategoryRail userId={userId} mood={mood} />
          <VideosFollowingRail userId={userId} />

          <MoreToWatchDivider mood={mood} />
          <VideosFullFeed userId={userId} mood={mood} />
        </div>

        <ScrollToTopGlass />
      </PageRoot>
    </WatchActionsProvider>
  );
}
