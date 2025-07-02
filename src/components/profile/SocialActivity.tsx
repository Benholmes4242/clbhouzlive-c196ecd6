
import React, { useState } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import PostViewerModal from '../posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  const handlePostClick = (post: ActivityPost) => {
    // Transform ActivityPost to PostData format
    const transformedPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      user: post.user,
      post_media: post.post_media || [],
      post_tags: post.post_tags || [],
      golfCourse: undefined // Golf course data would need to be fetched if needed
    };
    
    // Transform all posts
    const transformedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      user: p.user,
      post_media: p.post_media || [],
      post_tags: p.post_tags || [],
      golfCourse: undefined
    }));
    
    openPostViewer(transformedPost, transformedPosts);
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

      {/* Post Viewer Modal */}
      {currentPost && (
        <PostViewerModal
          isOpen={isOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts}
        />
      )}
    </div>
  );
};

export default SocialActivity;
