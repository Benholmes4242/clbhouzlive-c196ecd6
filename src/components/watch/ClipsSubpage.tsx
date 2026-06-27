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



import { ClipsMoodChips } from './clips/ClipsMoodChips';
import { useClipsMood, clipsMoodToWatchMood, clipsMoodLabel } from './clips/hooks/useClipsMood';

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
                emptyTitle={`No clips for “${searchQuery}”`}
                emptyMessage="Nothing here matches that search yet. Try different words, or clear it to see everything."
                emptyAction={{ label: 'Clear search', onClick: handleSearchClose, icon: 'clear' }}
              />
            </>
          ) : (
            <>
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
                emptyTitle={isFiltered ? `Nothing in ${activeLabel} yet` : 'No clips yet'}
                emptyMessage={
                  isFiltered
                    ? 'No clips match this filter right now. New ones land here as creators post.'
                    : 'This is where short golf clips will show up. Check back soon — there’s more on the way.'
                }
                emptyAction={
                  isFiltered
                    ? { label: 'Back to For You', onClick: () => setMood('for_you'), icon: 'back' }
                    : undefined
                }
              />
            </>
          )}
        </div>

        <ScrollToTopGlass />
      </PageRoot>
  );
}
