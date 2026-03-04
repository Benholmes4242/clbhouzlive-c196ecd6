
import React, { useState, useMemo, useCallback } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import BadgeCarousel from '../badges/BadgeCarousel';
import { ReviewMediaItem } from '@/components/posts/FullscreenReviewPost';
import { ReviewPostViewer } from '@/components/posts/ReviewPostViewer';
import { ReviewBottomPanel } from '@/components/posts/ReviewBottomPanel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { isReviewPost as checkIsReviewPost, extractReviewData, extractUserData } from '@/lib/postHelpers';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';


const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName,
  userType = 'individual'
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const [selectedReviewPost, setSelectedReviewPost] = useState<ActivityPost | null>(null);

  // Unified fullscreen for regular (non-review) posts
  const { openFullscreen } = useUnifiedFullscreen('profile', {
    allowLandscape: true,
    onLike: (itemId) => {
      console.log('Like:', itemId);
    },
    onComment: (itemId) => {
      console.log('Comment:', itemId);
    },
    onShare: (itemId) => {
      console.log('Share:', itemId);
    },
  });

  // Filter to only media posts for the unified player
  const mediaPosts = useMemo(() => 
    posts.filter(p => p.post_media && p.post_media.length > 0),
    [posts]
  );

  const handlePostClick = useCallback((post: ActivityPost) => {
    // Check if this is a review post
    const isReview = checkIsReviewPost(post);
    
    if (isReview) {
      // Review posts use the dedicated ReviewPostViewer
      setSelectedReviewPost(post);
    } else {
      // Regular posts use the unified fullscreen player
      const postIndex = mediaPosts.findIndex(p => p.id === post.id);
      if (postIndex >= 0) {
        openFullscreen(mediaPosts, postIndex);
      }
    }
  }, [mediaPosts, openFullscreen]);

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

      {/* Review post viewer - only for review posts */}
      {selectedReviewPost && (() => {
        const reviewData = extractReviewData(selectedReviewPost);
        const userData = extractUserData(selectedReviewPost);
        
        const reviewMedia: ReviewMediaItem[] = (selectedReviewPost.post_media || []).map(media => ({
          id: media.id,
          media_type: media.media_type,
          media_url: media.media_url,
          poster_url: media.poster_url,
        }));

        return (
          <Dialog open={!!selectedReviewPost} onOpenChange={() => setSelectedReviewPost(null)}>
            <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-black [&>button]:hidden">
              <ReviewPostViewer
                mode="live"
                courseId={reviewData?.courseId || ''}
                courseName={reviewData?.courseName || 'Course'}
                heroSubtitle={reviewData?.courseLocation}
                rating={reviewData?.rating ?? 0}
                reviewText={selectedReviewPost.content}
                media={reviewMedia}
                initialIndex={0}
                onBack={() => setSelectedReviewPost(null)}
                sourceReviewId={reviewData?.sourceReviewId || ''}
                creator={{
                  id: userData.id,
                  name: userData.name,
                  username: userData.username,
                  avatar: userData.avatar,
                }}
                showReviewCapsule={false}
                renderMedia={true}
              >
                <ReviewBottomPanel
                  user={{
                    id: userData.id,
                    name: userData.name,
                    username: userData.username,
                    avatar: userData.avatar,
                  }}
                  courseId={reviewData?.courseId || ''}
                  rating={reviewData?.rating ?? 0}
                />
              </ReviewPostViewer>

            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
};

export default SocialActivity;
