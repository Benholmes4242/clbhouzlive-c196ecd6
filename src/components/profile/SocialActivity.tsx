
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
import { resolveGolfCourse } from '@/utils/resolveGolfCourse';
import { ReviewMediaItem } from '@/components/posts/FullscreenReviewPost';
import { ReviewPostViewer } from '@/components/posts/ReviewPostViewer';
import { Dialog, DialogContent } from '@/components/ui/dialog';


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
    setSelectedPost(post);
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


      {/* Grid layout for square posts - straight edge corners with thin border gutter */}
      <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] px-1 mt-4">
        <div className="grid grid-cols-3 gap-[2px]">
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
      </div>

      {posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet.</p>
        </div>
      )}

      {/* Fullscreen viewer for posts */}
      {selectedPost && (() => {
        // Check if this is a review post
        const isReviewPost = selectedPost.isReview || 
          selectedPost.categories?.includes('review') || 
          !!selectedPost.source_review_id;

        // Format location for review posts
        const formatLocation = (course?: ActivityPost['course']) => {
          if (!course) return '';
          const parts = [course.sub_country || course.region, course.country].filter(Boolean);
          return parts.join(', ');
        };

        // Review post: use FullscreenReviewPost
        if (isReviewPost) {
          const reviewMedia: ReviewMediaItem[] = (selectedPost.post_media || []).map(media => ({
            id: media.id,
            media_type: media.media_type,
            media_url: media.media_url,
            poster_url: media.poster_url,
          }));

          return (
            <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
              <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-black [&>button]:hidden">
                <ReviewPostViewer
                  mode="live"
                  courseId={selectedPost.course?.id || selectedPost.course_id || ''}
                  courseName={selectedPost.course?.name || 'Course'}
                  heroSubtitle={formatLocation(selectedPost.course)}
                  rating={selectedPost.rating ?? 0}
                  reviewText={selectedPost.content}
                  media={reviewMedia}
                  initialIndex={0}
                  onBack={() => setSelectedPost(null)}
                  sourceReviewId={selectedPost.source_review_id || ''}
                  creator={{
                    id: selectedPost.user?.id || '',
                    name: selectedPost.user?.display_name || selectedPost.user?.username || 'Golfer',
                    username: selectedPost.user?.username || undefined,
                    avatar: selectedPost.user?.profile_photo_url || undefined,
                  }}
                  showReviewCapsule={true}
                  renderMedia={true}
                />
              </DialogContent>
            </Dialog>
          );
        }

        // Regular post: use existing FullscreenMediaModal
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
        
        // Extract studioEdits for FullscreenMediaModal
        const studioEdits = (selectedPost.post_media || []).map(media => 
          media.studio_edits || null
        );
        

        return (
          <FullscreenMediaModal
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
            mediaUrl={mediaItems.map(m => m.url)}
            mediaType={mediaItems.map(m => m.type)}
            filterIds={filterIds}
            studioEdits={studioEdits}
            initialIndex={0}
            alt={`Post media`}
            golfCourse={(() => {
              // Use canonical resolver
              const resolved = resolveGolfCourse(selectedPost);
              if (resolved) {
                return {
                  id: resolved.id,
                  name: resolved.name,
                  country: resolved.country || ''
                };
              }
              // Fallback to content extraction for very old posts
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
