import { useRef, useEffect, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import ShellSlot from '@/components/header/ShellSlot';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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

export default function ClipsSubpage() {
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useClipsMood();
  const gridRef = useRef<HTMLDivElement>(null);

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

  const watchMood = clipsMoodToWatchMood(mood);
  const {
    posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch,
  } = useWatchFeed({
    userId,
    filter: 'trending',
    mood: isSearching ? undefined : watchMood,
    searchQuery: isSearching ? searchQuery : undefined,
  });

  const activeLabel = clipsMoodLabel(mood);
  const isFiltered = mood !== 'for_you';

  return (
    <WatchActionsProvider>
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        <ShellSlot>
          <ClipsMoodChips
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
            <>
              <WatchAutoplay>
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
                  emptyTitle="No clips found"
                  emptyMessage={`Nothing matches "${searchQuery}" — try another search.`}
                />
              </WatchAutoplay>

            </>
          ) : (
            <>
              <ClipOfTheWeekHero />
              <LightningRoundRail userId={userId} mood={mood} />
              <ClipsCourseAnchoredRail userId={userId} mood={mood} />
              <ClipsMostLovedRail userId={userId} mood={mood} />

              <MoreToExploreDivider mood={mood} />

              <WatchAutoplay>
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
                  emptyTitle={isFiltered ? 'No clips here yet.' : 'No shorts yet'}
                  emptyMessage={
                    isFiltered && activeLabel
                      ? `Nothing matches "${activeLabel}" right now — try another filter.`
                      : 'Check back soon for new content'
                  }
                />
              </WatchAutoplay>

            </>
          )}
        </div>

        <ScrollToTopGlass />
      </PageRoot>
    </WatchActionsProvider>
  );
}
