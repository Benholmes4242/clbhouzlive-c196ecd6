import { useState, useCallback, memo } from 'react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useVideosFeed } from './hooks/useVideosFeed';
import VideoFeedCard from '@/components/watch/videos/VideoFeedCard';
import { VideosFeedSkeleton } from './VideosFeedSkeleton';

interface VideosSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const TRENDING = [
  'Course Vlog', 'Golf Tips', 'Tournament Highlights',
  'Swing Analysis', 'Golf Travel', 'Equipment Review',
];

function VideosSearchOverlayInner({ isOpen, onClose, userId }: VideosSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches('videos-recent-searches');

  const { posts, isLoading, isError, refetch } = useVideosFeed({
    userId,
    filter: 'latest',
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
      placeholder="Search videos..."
      onSearch={handleSearch}
      onCommit={handleCommit}
      recentSearches={recentSearches}
      onClearRecent={clearAll}
      onRemoveRecent={removeSearch}
      trendingItems={TRENDING}
      userId={userId}
    >
      <div>
        {isLoading && posts.length === 0 ? (
          <VideosFeedSkeleton />
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
          <div className="flex flex-col pb-4 pt-2">
            {posts.map((post, i) => (
              <VideoFeedCard
                key={post.id}
                post={post}
                index={i}
                allPosts={posts}
                userId={userId}
              />
            ))}
          </div>
        )}
      </div>
    </SearchOverlay>
  );
}

export const VideosSearchOverlay = memo(VideosSearchOverlayInner);