import { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed, type VideosFilter } from './hooks/useVideosFeed';
import { VideosHeader } from './VideosHeader';
import { VideosFeed } from './VideosFeed';
import { VideosSearchOverlay } from './VideosSearchOverlay';

interface VideosTabContentProps {
  embedded?: boolean;
  hideStickyHeader?: boolean;
  limitCards?: number;
}

export default function VideosTabContent({ embedded = false, hideStickyHeader = false, limitCards }: VideosTabContentProps) {
  const { user } = useSupabaseSession();
  const [activeFilter, setActiveFilter] = useState<VideosFilter>('latest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useVideosFeed({ userId: user?.id, filter: activeFilter });

  const handleFilterChange = (filter: VideosFilter) => {
    setActiveFilter(filter);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-background min-h-screen">
      {!hideStickyHeader && (
        <VideosHeader
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onOpenSearch={() => setIsSearchOpen(true)}
          embedded={embedded}
        />
      )}
      <VideosFeed
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        userId={user?.id}
        activeFilter={activeFilter}
      />
      <VideosSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={user?.id}
      />
    </div>
  );
}
