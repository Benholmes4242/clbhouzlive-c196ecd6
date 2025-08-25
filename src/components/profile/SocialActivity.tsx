
import React, { useState } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import PostViewerModal from '../posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';
import BadgeCarousel from '../badges/BadgeCarousel';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName,
  userType = 'individual'
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  const handlePostClick = (post: ActivityPost) => {
    // Helper function to extract golf course from post tags or content
    const extractGolfCourse = (postTags: any[], content: string | null) => {
      // First try to extract from post tags
      const golfCourseTag = postTags?.find(tag => 
        tag.tagged_entity?.entity_type === 'golf_club' || tag.entity_type === 'golf_club'
      );
      
      if (golfCourseTag) {
        // Handle both tag formats
        if (golfCourseTag.entity_type === 'golf_club') {
          return {
            id: golfCourseTag.entity_id,
            name: golfCourseTag.name,
            country: '',
            region: ''
          };
        } else if (golfCourseTag.tagged_entity) {
          return {
            id: golfCourseTag.tagged_entity.entity_id,
            name: golfCourseTag.tagged_entity.name,
            country: '',
            region: ''
          };
        }
      }
      
      // If not found in tags, try to extract from content
      const courseFromContent = extractGolfCourseFromContent(content);
      if (courseFromContent) {
        return courseFromContent;
      }
      
      return undefined;
    };

    // Transform ActivityPost to PostData format
    const transformedPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      user: post.user,
      post_media: post.post_media || [],
      post_tags: post.post_tags || [],
      golfCourse: extractGolfCourse(post.post_tags || [], post.content)
    };
    
    // Transform all posts
    const transformedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      user: p.user,
      post_media: p.post_media || [],
      post_tags: p.post_tags || [],
      golfCourse: extractGolfCourse(p.post_tags || [], p.content)
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
      <div className="mt-10 px-0">
        <ActivityHeader 
          postsCount={0}
          isOwnProfile={isOwnProfile}
          onPostCreated={fetchUserPosts}
          onAchievementsClick={() => {}} // Empty function for loading state
        />
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 px-0">
      <ActivityHeader 
        postsCount={posts.length}
        isOwnProfile={isOwnProfile}
        onPostCreated={fetchUserPosts}
        onAchievementsClick={() => {}} // Empty function as SocialActivity doesn't handle tab switching
      />


      {/* Grid layout for square posts - increased rounded corners */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {posts.map((post, index) => {
          // Check if this is the first video post
          const isFirstVideo = index === 0 && post.post_media?.[0]?.media_type === 'video';
          
          return (
            <ActivityPostCard
              key={post.id}
              post={post}
              attributionText={getPostAttribution()}
              isFirstVideo={isFirstVideo}
              onClick={handlePostClick}
            />
          );
        })}
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
