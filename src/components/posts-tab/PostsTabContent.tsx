import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfilePosts } from './hooks/useProfilePosts';

import { HybridPostsFeed } from './HybridPostsFeed';
import { PostsAutoplay } from './PostsAutoplay';

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

  return (
    <div className="flex flex-col min-h-0">
      
      <HybridPostsFeed
        posts={posts}
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
      <PostsAutoplay posts={posts} gridRef={gridRef} />
    </div>
  );
};

export default PostsTabContent;
