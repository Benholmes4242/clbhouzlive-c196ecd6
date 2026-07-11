import { useNavigationType } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import ShellSlot from '@/components/header/ShellSlot';

import { useVideosMood } from '@/components/watch/videos/hooks/useVideosMood';
import { VideosMoodChips } from '@/components/watch/videos/VideosMoodChips';
import { VideosFullFeed } from '@/components/watch/videos/VideosFullFeed';

const CREAM = '#F8FAFC';

export default function VideosSubpage() {
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useVideosMood();

  const [searchOpen, setSearchOpen] = useState(false);
  const [committedQuery, setCommittedQuery] = useState('');
  const isSearching = committedQuery.length > 0;

  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('videos-recent-searches');

  const handleSearchOpen = () => {
    setSearchOpen(true);
    if (mood !== 'for_you') setMood('for_you');
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
            onSearchOpen={handleSearchOpen}
          />
        </ShellSlot>

        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
          {isSearching ? (
            <VideosFullFeed
              userId={userId}
              mood="for_you"
              searchQuery={committedQuery}
              onClearSearch={() => setCommittedQuery('')}
            />
          ) : (
            <VideosFullFeed
              userId={userId}
              mood={mood}
              onResetMood={() => setMood('for_you')}
            />
          )}
        </div>

        <ScrollToTopGlass />

        <SearchOverlay
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          placeholder="Search videos..."
          onSearch={() => { /* input-only sheet; commit filters the page */ }}
          onCommit={(term) => {
            addSearch(term);
            setCommittedQuery(term);
            setSearchOpen(false);
          }}
          recentSearches={recentSearches}
          onClearRecent={clearAll}
          onRemoveRecent={removeSearch}
          trendingItems={TRENDING}
          userId={userId}
        />
      </PageRoot>
  );
}
