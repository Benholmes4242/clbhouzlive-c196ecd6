import { useState, useCallback, memo } from 'react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';

interface WatchSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

const TRENDING = [
  'Course Vlogs', 'Hole in One', 'Range Sessions',
  'Round Highlights', 'Swing Tips', 'Augusta National',
  'St Andrews', 'Pebble Beach',
];

function WatchSearchOverlayInner({ isOpen, onClose, userId }: WatchSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('watch-recent-searches');

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'trending',
    searchQuery: query || undefined,
    enabled: !!query,
  });

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const handleCommit = useCallback((term: string) => {
    if (term.trim()) addSearch(term.trim());
  }, [addSearch]);

  return (
    <SearchOverlay
      isOpen={isOpen}
      onClose={onClose}
      placeholder="Search shorts..."
      onSearch={handleSearch}
      onCommit={handleCommit}
      recentSearches={recentSearches}
      onClearRecent={clearAll}
      onRemoveRecent={removeSearch}
      trendingItems={TRENDING}
      userId={userId}
    >
      <div className="px-[2px] pt-2">
        {isLoading ? (
          <WatchGridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-[48px]">🔍</span>
            <p className="mt-3 text-base font-semibold text-foreground">
              No results for "{query}"
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Try different search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[2px]">
            {posts.map((post, i) => (
              <WatchTile key={post.id} post={post} index={i} allPosts={posts} />
            ))}
          </div>
        )}
      </div>
    </SearchOverlay>
  );
}

const WatchSearchOverlay = memo(WatchSearchOverlayInner);
export default WatchSearchOverlay;