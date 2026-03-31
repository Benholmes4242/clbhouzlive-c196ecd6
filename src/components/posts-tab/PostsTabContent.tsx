import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfilePosts } from './hooks/useProfilePosts';

import { HybridPostsFeed } from './HybridPostsFeed';
import { PostsAutoplay } from './PostsAutoplay';

type PostsFilter = 'all' | 'videos' | 'shorts' | 'images' | 'reviews';

const LONGFORM_THRESHOLD = 180; // 3 min — matches classifyPost in HybridPostsFeed

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
      {/* Filter dropdown — only show if there are posts */}
      {posts.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative w-fit">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as PostsFilter)}
              className="appearance-none h-9 pl-3 pr-8 text-sm font-semibold rounded-xl border border-border bg-background text-foreground cursor-pointer focus:outline-none"
              style={{ backgroundImage: 'none' }}
            >
              <option value="all">All Posts</option>
              <option value="videos">Videos</option>
              <option value="shorts">Shorts</option>
              <option value="images">Images</option>
              <option value="reviews">Reviews</option>
            </select>
            {/* Chevron icon */}
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      )}

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
