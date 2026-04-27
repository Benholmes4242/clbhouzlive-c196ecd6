import { useState, useCallback, memo } from 'react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useFriendsFeed } from './hooks/useFriendsFeed';
import { LoopCard } from '@/components/loop-tab/LoopCard';
import { FriendsFeedSkeleton } from './FriendsFeedSkeleton';

interface FriendsSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const TRENDING = [
  'Golf Swing', 'Course Tour', 'Bunker Shot',
  'Putting Tips', 'Hole in One', 'Golf Cart',
];

function FriendsSearchOverlayInner({ isOpen, onClose, userId }: FriendsSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('friends-recent-searches');

  const { posts, isLoading, isError, refetch } = useFriendsFeed({
    userId,
    mode: 'latest',
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
      placeholder="Search friends' posts..."
      onSearch={handleSearch}
      onCommit={addSearch}
      recentSearches={recentSearches}
      onClearRecent={clearAll}
      onRemoveRecent={removeSearch}
      trendingItems={TRENDING}
      userId={userId}
    >
      <div>
        {isLoading && posts.length === 0 ? (
          <FriendsFeedSkeleton />
        ) : isError && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              No results for "<span className="text-foreground font-medium">{query}</span>"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-3 pb-4">
            {posts.map((post, i) => (
              <LoopCard key={post.id} post={post} userId={userId} cardIndex={i} allPosts={posts} />
            ))}
          </div>
        )}
      </div>
    </SearchOverlay>
  );
}

export const FriendsSearchOverlay = memo(FriendsSearchOverlayInner);
