import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { 
  DesktopUserPost, 
  MobileUserPost, 
  IndexFeedPost,
  useUserPostLogic,
  UserPostData
} from './user-post';

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
    handleDeletePost,
    handleProfileClick,
    handlePostClick,
    isFullscreenOpen,
    currentMedia,
    openMedia,
    closeMedia
  } = useUserPostLogic({
    post,
    allUserPosts,
    source,
    onPostDeleted
  });

  const handleMediaClick = (mediaUrl: string, mediaType: 'image' | 'video', currentIndex: number = 0) => {
    // On mobile, always use post viewer for tap-to-expand functionality
    if (isMobile) {
      handlePostClick();
    } else if (source === 'profile') {
      handlePostClick();
    } else {
      // For index feed posts, pass all media items to fullscreen modal
      const mediaUrls = post.post_media.map(media => media.media_url);
      const mediaTypes = post.post_media.map(media => media.media_type as 'image' | 'video');
      
      openMedia(
        mediaUrls, 
        mediaTypes, 
        undefined, 
        golfCourse ? { id: golfCourse.id, name: golfCourse.name, country: golfCourse.country } : undefined,
        post.user,
        displayName,
        post.content,
        post.post_tags,
        currentIndex
      );
    }
  };

  return (
    <>
      {source === 'index' ? (
        <IndexFeedPost
          post={post}
          displayName={displayName}
          timeAgo={timeAgo}
          golfCourse={golfCourse}
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
          onProfileClick={handleProfileClick}
          onDeletePost={handleDeletePost}
          onPostUpdated={onPostUpdated}
          onMediaClick={handleMediaClick}
        />
      )}

      {/* Remove FullscreenMediaModal for profile and index sources - now handled elsewhere */}

      {/* Fallback fullscreen modal for other sources */}
      <FullscreenMediaModal
        isOpen={isFullscreenOpen}
        onClose={closeMedia}
        mediaUrl={currentMedia?.mediaUrls || []}
        mediaType={currentMedia?.mediaTypes || []}
        alt={currentMedia?.items?.[currentMedia?.initialIndex ?? 0]?.alt}
        golfCourse={currentMedia?.golfCourse}
        user={currentMedia?.user}
        displayName={currentMedia?.displayName}
        content={currentMedia?.content}
        postTags={currentMedia?.postTags}
        initialIndex={currentMedia?.initialIndex || 0}
      />
    </>
  );
};

export default memo(UserPost);
