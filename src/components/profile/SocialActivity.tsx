import React, { useMemo, useCallback } from 'react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost, SocialActivityProps } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { mapActivityPostToFeedPost } from '@/lib/activityPostMapper';

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName,
  userType = 'individual'
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);

  // Filter to only media posts for the unified player
  const mediaPosts = useMemo(
    () => posts.filter(p => p.post_media && p.post_media.length > 0),
    [posts]
  );

  const handlePostClick = useCallback((post: ActivityPost) => {
    const postIndex = mediaPosts.findIndex(p => p.id === post.id);
    if (postIndex < 0) return;

    // Map all media posts to FeedPost shape (handles both regular and review posts)
    const feedPosts = mediaPosts.map(mapActivityPostToFeedPost);

    // Open the unified fullscreen viewer
    useFullscreenFeedStore.getState().open(feedPosts, postIndex);
  }, [mediaPosts]);

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
          onAchievementsClick={() => {}}
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
        onAchievementsClick={() => {}}
      />

      {/* Grid layout for square posts - straight edge corners with thin border gutter */}
      <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] px-1 mt-4">
        <div className="grid grid-cols-3 gap-[2px]">
          {posts.map((post, index) => {
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
    </div>
  );
};

export default SocialActivity;
