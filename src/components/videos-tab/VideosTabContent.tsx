import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import VideosHeader from './VideosHeader';
import VideosFeed from './VideosFeed';
import { useVideosFeed, type VideosFilter } from './hooks/useVideosFeed';

interface VideosTabContentProps {
  embedded?: boolean;
}

const VideosTabContent: React.FC<VideosTabContentProps> = ({ embedded = false }) => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeFilter, setActiveFilter] = useState<VideosFilter>('latest');

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useVideosFeed({ userId, filter: activeFilter });

  const handleFilterChange = (f: VideosFilter) => {
    setActiveFilter(f);
    resetSeen();
  };

  return (
    <div className="bg-background min-h-screen">
      <VideosHeader
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onOpenSearch={() => {/* Phase 4: search overlay */}}
        embedded={embedded}
      />
      <VideosFeed
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
      />
    </div>
  );
};

export default VideosTabContent;
