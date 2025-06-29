
import React, { useState } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  const handlePostClick = (post: ActivityPost) => {
    // Click functionality removed - posts are no longer clickable
    console.log('Post clicked but modal functionality removed:', post.id);
  };

  const handlePostUpdated = () => {
    fetchUserPosts();
  };

  const handlePostDeleted = () => {
    fetchUserPosts();
  };

  // Get the correct attribution text
  const getPostAttribution = () => {
    if (isOwnProfile) {
      return "You posted this";
    } else {
      const firstName = profileDisplayName?.split(' ')[0] || 'User';
      return `${firstName} posted this`;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="mt-10 px-2">
        <ActivityHeader 
          postsCount={0}
          isOwnProfile={isOwnProfile}
          onPostCreated={fetchUserPosts}
        />
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 px-2">
      <ActivityHeader 
        postsCount={posts.length}
        isOwnProfile={isOwnProfile}
        onPostCreated={fetchUserPosts}
      />

      {/* Grid layout for square posts */}
      <div className="grid grid-cols-3 gap-1 mt-4">
        {posts.map((post) => (
          <ActivityPostCard
            key={post.id}
            post={post}
            attributionText={getPostAttribution()}
            onClick={handlePostClick}
          />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet.</p>
        </div>
      )}
    </div>
  );
};

export default SocialActivity;
