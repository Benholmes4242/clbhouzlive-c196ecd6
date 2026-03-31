import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfilePosts } from './hooks/useProfilePosts';
import { ContentFilterPills, FilterOption } from '@/components/common/ContentFilterPills';

import { HybridPostsFeed } from './HybridPostsFeed';
import { PostsAutoplay } from './PostsAutoplay';

type PostsFilter = 'all' | 'videos' | 'shorts' | 'images' | 'reviews';

const LONGFORM_THRESHOLD = 180; // 3 min — matches classifyPost in HybridPostsFeed

const filterOptions: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'videos', label: 'Videos' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'images', label: 'Images' },
  { key: 'reviews', label: 'Reviews' },
];

interface PostsTabContentProps {
  actorType: 'personal' | 'business';
  actorId: string;
  actorName?: string;
  isOwnProfile?: boolean;
  hideReviewsCount?: boolean;
}

const PostsTabContent: React.FC<PostsTabContentProps> = ({
  actorType,
  actorId,
  actorName,
  isOwnProfile = false,
  hideReviewsCount = false,
}) => {
  const { user } = useSupabaseSession();
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<PostsFilter>('all');

  const {
    posts,
    postCounts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProfilePosts({
    userId: user?.id,
    actorType,
    actorId,
  });

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter(post => {
      const firstMedia = post.mediaItems?.[0];
      switch (activeFilter) {
        case 'reviews':
          return post.isReview && !!post.review;
        case 'videos':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > LONGFORM_THRESHOLD;
        case 'shorts':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > 0 && (firstMedia?.duration ?? 0) <= LONGFORM_THRESHOLD;
        case 'images':
          return firstMedia?.type === 'image';
        default:
          return true;
      }
    });
  }, [posts, activeFilter]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Filter pills */}
      <div className="px-4 pt-3 pb-1">
        <ContentFilterPills
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={(f) => setActiveFilter(f as PostsFilter)}
        />
      </div>

      <HybridPostsFeed
        posts={filteredPosts}
        userId={user?.id}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        isOwnProfile={isOwnProfile}
        actorName={actorName}
        gridRef={gridRef}
      />
      <PostsAutoplay posts={filteredPosts} gridRef={gridRef} />
    </div>
  );
};

export default PostsTabContent;
