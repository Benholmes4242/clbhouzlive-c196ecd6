import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import PostViewerModal from './PostViewerModal';
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
  source?: 'clubhouse' | 'profile' | 'index';
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const UserPost = ({ post, allUserPosts = [], source = 'clubhouse', onPostUpdated, onPostDeleted }: UserPostProps) => {
  const isMobile = useIsMobile();
  
  const {
    displayName,
    timeAgo,
    isOwnPost,
    golfCourse,
    handleDeletePost,
    handleProfileClick,
    handlePostClick,
    isPostViewerOpen,
    currentPost,
    viewerPosts,
    closePostViewer,
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

  const handleMediaClick = (mediaUrl: string, mediaType: 'image' | 'video') => {
    // On mobile, always use post viewer for tap-to-expand functionality
    if (isMobile) {
      handlePostClick();
    } else if (source === 'clubhouse' || source === 'profile') {
      handlePostClick();
    } else {
      openMedia(
        mediaUrl, 
        mediaType, 
        undefined, 
        golfCourse ? { id: golfCourse.id, name: golfCourse.name, country: golfCourse.country } : undefined,
        post.user,
        displayName,
        post.content,
        post.post_tags
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

      {/* Post Viewer Modal for clubhouse, profile, and index sources */}
      {(source === 'clubhouse' || source === 'profile' || source === 'index') && currentPost && (
        <PostViewerModal
          isOpen={isPostViewerOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts}
        />
      )}

      {/* Fallback fullscreen modal for other sources */}
      <FullscreenMediaModal
        isOpen={isFullscreenOpen}
        onClose={closeMedia}
        mediaUrl={currentMedia?.url || ''}
        mediaType={currentMedia?.type || 'image'}
        alt={currentMedia?.alt}
        golfCourse={currentMedia?.golfCourse}
        user={currentMedia?.user}
        displayName={currentMedia?.displayName}
        content={currentMedia?.content}
        postTags={currentMedia?.postTags}
      />
    </>
  );
};

export default memo(UserPost);
