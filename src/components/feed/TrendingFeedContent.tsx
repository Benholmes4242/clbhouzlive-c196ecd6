import React from 'react';
import PostCard from './PostCard';
import UserPost from '../posts/UserPost';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import { UserPostWithType, VideoPost } from './types';

interface TrendingFeedContentProps {
  sortedContent: (VideoPost | UserPostWithType)[];
  optimisticPosts: any[];
  refetchUserPosts: () => void;
  refetchFollowedPosts: () => void;
}

const TrendingFeedContent: React.FC<TrendingFeedContentProps> = ({
  sortedContent,
  optimisticPosts,
  refetchUserPosts,
  refetchFollowedPosts
}) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Show optimistic posts first */}
      {optimisticPosts.map((optimisticPost) => (
        <OptimisticPostCard 
          key={optimisticPost.id} 
          post={optimisticPost}
          onRetry={() => {
            // Handle retry logic here if needed
          }}
        />
      ))}
      
      {/* Show actual posts */}
      {sortedContent.map((item) => (
        item.type === 'user_post' ? (
          <UserPost 
            key={item.id} 
            post={item} 
            source="index"
            onPostUpdated={() => {
              refetchUserPosts();
              refetchFollowedPosts();
            }}
            onPostDeleted={() => {
              refetchUserPosts();
              refetchFollowedPosts();
            }}
          />
        ) : (
          <PostCard 
            key={item.id} 
            post={{
              ...item,
              golfClubTags: item.golfClubTags || []
            }} 
          />
        )
      ))}
    </div>
  );
};

export default TrendingFeedContent;