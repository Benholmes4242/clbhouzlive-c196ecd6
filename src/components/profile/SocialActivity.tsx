
import React, { useState } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import BadgeCarousel from '../badges/BadgeCarousel';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName,
  userType = 'individual'
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  const handlePostClick = (post: ActivityPost) => {
    console.log('🔍 SocialActivity - Post clicked:', {
      postId: post.id,
      hasMedia: !!post.post_media?.length,
      mediaUrl: post.post_media?.[0]?.media_url,
      mediaType: post.post_media?.[0]?.media_type,
      userId: post.user?.id,
      currentUserId: userId
    });

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
    
    // This function is now simplified - posts handle their own modals
    console.log('🔍 SocialActivity - Setting selectedPost:', post);
    setSelectedPost(post);
  };

  // Add logging for selectedPost changes
  React.useEffect(() => {
    console.log('🔍 SocialActivity - selectedPost changed:', {
      hasSelectedPost: !!selectedPost,
      selectedPostId: selectedPost?.id,
      shouldRenderModal: !!selectedPost
    });
  }, [selectedPost]);

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

      {/* FullscreenMediaModal for posts */}
      {selectedPost && (
        <FullscreenMediaModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          mediaUrl={selectedPost.post_media?.[0]?.media_url || ''}
          mediaType={selectedPost.post_media?.[0]?.media_type as 'image' | 'video' || 'image'}
          alt={`Post media`}
          golfCourse={(() => {
            console.log('🔍 SocialActivity - Rendering FullscreenMediaModal:', {
              selectedPostId: selectedPost.id,
              mediaUrl: selectedPost.post_media?.[0]?.media_url,
              mediaType: selectedPost.post_media?.[0]?.media_type,
              userFromPost: selectedPost.user,
              postId: selectedPost.id,
              hasCallbacks: {
                onPostDeleted: !!handlePostDeleted,
                onPostEdit: true
              }
            });
            
            // Extract golf course data from post tags or content
            const golfCourseTag = selectedPost.post_tags?.find(tag => 
              tag.tagged_entity?.entity_type === 'golf_club' || tag.entity_type === 'golf_club'
            );
            
            if (golfCourseTag) {
              // Handle both tag formats
              if (golfCourseTag.entity_type === 'golf_club') {
                return {
                  id: golfCourseTag.entity_id,
                  name: golfCourseTag.name,
                  country: ''
                };
              } else if (golfCourseTag.tagged_entity) {
                return {
                  id: golfCourseTag.tagged_entity.entity_id,
                  name: golfCourseTag.tagged_entity.name,
                  country: ''
                };
              }
            }
            
            // Fallback to content extraction
            const courseFromContent = extractGolfCourseFromContent(selectedPost.content);
            return courseFromContent;
          })()}
          user={selectedPost.user}
          displayName={selectedPost.user?.display_name || 'User'}
          content={selectedPost.content}
          postTags={selectedPost.post_tags}
          postId={selectedPost.id}
          onPostDeleted={handlePostDeleted}
          onPostEdit={(postId) => {
            console.log('Edit post:', postId);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
};

export default SocialActivity;
