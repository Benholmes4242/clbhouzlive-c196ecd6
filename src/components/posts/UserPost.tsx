import React, { memo, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  DesktopUserPost, 
  MobileUserPost, 
  IndexFeedPost,
  useUserPostLogic,
  UserPostData
} from './user-post';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

interface UserPostProps {
  post: UserPostData;
  allUserPosts?: UserPostData[];
  source?: 'profile' | 'index';
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const UserPost = ({ post, allUserPosts = [], source = 'profile', onPostUpdated, onPostDeleted }: UserPostProps) => {
  const isMobile = useIsMobile();
  
  const {
    displayName,
    timeAgo,
    isOwnPost,
    golfCourse,
    golfCourses,
    rawCourseId,
    handleDeletePost,
    handleProfileClick,
  } = useUserPostLogic({
    post,
    allUserPosts,
    source,
    onPostDeleted
  });

  // Unified fullscreen for posts
  const { openFullscreen } = useUnifiedFullscreen('profile', {
    allowLandscape: true,
    onLike: (itemId) => console.log('Like:', itemId),
    onComment: (itemId) => console.log('Comment:', itemId),
    onShare: (itemId) => console.log('Share:', itemId),
  });

  // Filter posts with media for the unified player
  const postsWithMedia = useMemo(() => 
    allUserPosts.filter(p => p.post_media && p.post_media.length > 0),
    [allUserPosts]
  );

  const handleMediaClick = useCallback((mediaUrl: string, mediaType: 'image' | 'video', currentIndex: number = 0) => {
    // On mobile or profile source, use unified fullscreen
    if (isMobile || source === 'profile') {
      const postIndex = postsWithMedia.findIndex(p => p.id === post.id);
      if (postIndex >= 0) {
        openFullscreen(postsWithMedia, postIndex);
      }
    } else {
      // For index feed, also use unified fullscreen
      const postIndex = postsWithMedia.findIndex(p => p.id === post.id);
      if (postIndex >= 0) {
        openFullscreen(postsWithMedia, postIndex);
      }
    }
  }, [isMobile, source, postsWithMedia, post.id, openFullscreen]);

  return (
    <>
      {source === 'index' ? (
        <IndexFeedPost
          post={post}
          displayName={displayName}
          timeAgo={timeAgo}
          golfCourse={golfCourse}
          courses={golfCourses}
          onProfileClick={handleProfileClick}
          onMediaClick={handleMediaClick}
          onDeletePost={handleDeletePost}
        />
      ) : isMobile ? (
        <MobileUserPost
          post={post}
          displayName={displayName}
          timeAgo={timeAgo}
          golfCourse={golfCourse}
          courses={golfCourses}
          rawCourseId={rawCourseId}
          onProfileClick={handleProfileClick}
          onMediaClick={handleMediaClick}
          onDeletePost={handleDeletePost}
        />
      ) : (
        <DesktopUserPost
          post={post}
          displayName={displayName}
          timeAgo={timeAgo}
          isOwnPost={isOwnPost}
          golfCourse={golfCourse}
          courses={golfCourses}
          rawCourseId={rawCourseId}
          onProfileClick={handleProfileClick}
          onDeletePost={handleDeletePost}
          onPostUpdated={onPostUpdated}
          onMediaClick={handleMediaClick}
        />
      )}
    </>
  );
};

export default memo(UserPost);
