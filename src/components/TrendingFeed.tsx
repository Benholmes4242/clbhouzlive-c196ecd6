
import React from 'react';
import PostCard from './feed/PostCard';
import UserPost from './posts/UserPost';
import LoadingSkeleton from './feed/LoadingSkeleton';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { sortContentByTime } from '@/utils/contentSorting';
import { VideoPost, UserPostWithType } from './feed/types';

const TrendingFeed = () => {
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();

  if (userPostsLoading || externalVideosLoading) {
    return <LoadingSkeleton />;
  }

  // Convert user posts to the correct type
  const userPostsWithType: UserPostWithType[] = userPosts.map(post => ({
    ...post,
    type: 'user_post' as const
  }));

  // Only include real friend videos - no example/mock data
  const realFriendVideos = externalVideos.filter(video => 
    video.type === 'friend' &&
    // Filter out any remaining example posts by username or name
    video.user.username !== '@mikej_golf' && 
    video.user.username !== '@sarahgolf' &&
    !video.user.name.includes('Mike Johnson') &&
    !video.user.name.includes('Sarah Chen') &&
    !video.content.description.includes('Hole in one at my local course') &&
    !video.content.description.includes('Working on my swing at the driving range')
  );

  // Combine only real content: user posts and verified friend videos
  const allContent: (VideoPost | UserPostWithType)[] = [
    ...userPostsWithType,
    ...realFriendVideos
  ];

  const sortedContent = sortContentByTime(allContent);

  if (sortedContent.length === 0) {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No posts from friends yet.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Connect with friends to see their posts here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {sortedContent.map((item) => (
        item.type === 'user_post' ? (
          <UserPost 
            key={item.id} 
            post={item} 
            onPostUpdated={refetchUserPosts}
            onPostDeleted={refetchUserPosts}
          />
        ) : (
          <PostCard key={item.id} post={item} />
        )
      ))}
    </div>
  );
};

export default TrendingFeed;
