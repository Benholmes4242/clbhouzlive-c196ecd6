import { useState, useCallback, memo } from 'react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useExploreFeed } from './hooks/useExploreFeed';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';

interface ExploreSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

const TRENDING = [
  'Augusta National', 'Links Golf', 'Course Reviews',
  'Best Par 3s', 'Bucket List Courses', 'Hidden Gems',
];

function ExploreSearchOverlayInner({ isOpen, onClose, userId }: ExploreSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('explore-recent-searches');

  const { posts, isLoading, isError } = useExploreFeed({
    userId,
    searchQuery: query || undefined,
    enabled: !!query,
  });

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  return (
    <SearchOverlay
      isOpen={isOpen}
      onClose={onClose}
      placeholder="Search courses & videos..."
      onSearch={handleSearch}
      onCommit={addSearch}
      recentSearches={recentSearches}
      onClearRecent={clearAll}
      onRemoveRecent={removeSearch}
      trendingItems={TRENDING}
      userId={userId}
    >
      <>
        {isLoading ? (
          <ExploreGridSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">📡</span>
            <p className="text-muted-foreground text-sm">Something went wrong</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">🔍</span>
            <p className="text-foreground text-sm font-medium">No results found</p>
            <p className="text-muted-foreground text-xs text-center max-w-[240px]">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[1px] px-[1px]">
            {posts.map((post, index) => (
              <ExploreTile key={post.id} post={post} index={index} allPosts={posts} />
            ))}
          </div>
        )}
      </>
    </SearchOverlay>
  );
}

export const ExploreSearchOverlay = memo(ExploreSearchOverlayInner);
