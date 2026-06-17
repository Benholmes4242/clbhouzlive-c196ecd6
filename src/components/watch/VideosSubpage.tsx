import { useNavigationType } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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

export default function VideosSubpage() {
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useVideosMood();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchRaw, setSearchRaw] = useState('');
  const searchQuery = useDebouncedValue(searchRaw.trim(), 180);
  const isSearching = searchQuery.length > 0;

  const handleSearchOpen = () => {
    setSearchOpen(true);
    if (mood !== 'for_you') setMood('for_you');
  };
  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchRaw('');
  };

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        <ShellSlot>
          <VideosMoodChips
            active={mood}
            onChange={setMood}
            searchOpen={searchOpen}
            searchValue={searchRaw}
            onSearchOpen={handleSearchOpen}
            onSearchChange={setSearchRaw}
            onSearchClose={handleSearchClose}
          />
        </ShellSlot>

        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
          {isSearching ? (
            <VideosFullFeed userId={userId} mood="for_you" searchQuery={searchQuery} />
          ) : (
            <>
              <VideoOfTheWeekHero />
              <VideosContinueWatchingRail userId={userId} />
              <VideosCourseAnchoredRail userId={userId} />
              <VideosCategoryRail userId={userId} mood={mood} />
              <VideosFollowingRail userId={userId} />

              <MoreToWatchDivider mood={mood} />
              <VideosFullFeed userId={userId} mood={mood} />
            </>
          )}
        </div>

        <ScrollToTopGlass />
      </PageRoot>
  );
}
