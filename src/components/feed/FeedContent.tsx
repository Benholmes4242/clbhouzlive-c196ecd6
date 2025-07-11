import React from 'react';
import PostCard from './PostCard';
import UserPost from '../posts/UserPost';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import { VideoPost, UserPostWithType } from './types';

interface FeedContentProps {
  optimisticPosts: any[];
  sortedContent: (VideoPost | UserPostWithType)[];
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

const FeedContent: React.FC<FeedContentProps> = ({
  optimisticPosts,
  sortedContent,
  onPostUpdated,
  onPostDeleted
}) => {
  return (
    <div className="index-feed space-y-6 pb-20">
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
            onPostUpdated={onPostUpdated}
            onPostDeleted={onPostDeleted}
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

export default FeedContent;