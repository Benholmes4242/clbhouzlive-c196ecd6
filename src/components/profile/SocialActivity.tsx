
import React, { useState } from 'react';
import PostModal from '@/components/posts/PostModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostClick = (post: ActivityPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handlePostUpdated = () => {
    fetchUserPosts();
  };

  const handlePostDeleted = () => {
    fetchUserPosts();
    handleCloseModal();
  };

  // If this is not the user's own profile and activity is not visible, don't render anything
  if (!isOwnProfile && !activityVisible) {
    return null;
  }

  // Get the correct attribution text
  const getPostAttribution = () => {
    if (isOwnProfile) {
      return "You posted this";
    } else {
      const firstName = profileDisplayName?.split(' ')[0] || 'User';
      return `${firstName} posted this`;
    }
  };

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

      {posts.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet.</p>
        </div>
      )}

      <PostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
        isOwnPost={isOwnProfile}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
    </div>
  );
};

export default SocialActivity;
