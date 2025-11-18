
import React, { useState } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import BadgeCarousel from '../badges/BadgeCarousel';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';

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
      {selectedPost && (() => {
        // Transform post_media to MediaItem[] with proper poster URLs
        const mediaItems: MediaItem[] = (selectedPost.post_media || []).map(media => {
          if (media.media_type === 'video') {
            const streamId = getStreamIdFromUrl(media.media_url);
            return {
              id: media.id,
              type: 'video' as const,
              url: media.media_url,
              streamId,
              posterUrl: getStreamPoster(media.media_url, '1s') ?? undefined,
              alt: 'Video'
            };
          }
          return {
            id: media.id,
            type: 'image' as const,
            url: media.media_url,
            alt: 'Photo'
          };
        });

        // Extract filter IDs for FullscreenMediaModal
        const filterIds = (selectedPost.post_media || []).map(media => 
          media.filter_id || (media.studio_edits as any)?.filter || null
        );

        console.log('🚨 SOCIAL ACTIVITY MODAL RENDERING!', {
          postId: selectedPost.id,
          mediaCount: mediaItems.length,
          mediaUrls: mediaItems.map(m => m.url),
          mediaTypes: mediaItems.map(m => m.type)
        });

        return (
          <FullscreenMediaModal
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
            mediaUrl={mediaItems.map(m => m.url)}
            mediaType={mediaItems.map(m => m.type)}
            filterIds={filterIds}
            initialIndex={0}
            alt={`Post media`}
            golfCourse={(() => {
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
              return extractGolfCourseFromContent(selectedPost.content);
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
        );
      })()}
    </div>
  );
};

export default SocialActivity;
