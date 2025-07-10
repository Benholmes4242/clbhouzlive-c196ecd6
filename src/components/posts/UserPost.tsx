import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import PostViewerModal from './PostViewerModal';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import IndexFeedPostModal from './IndexFeedPostModal';
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
    } else if (source === 'index') {
      // For index feed, use the new full-screen modal with only posts from same user
      handlePostClick();
    } else {
      openMedia(mediaUrl, mediaType, undefined, golfCourse ? { id: golfCourse.id, name: golfCourse.name, country: golfCourse.country } : undefined);
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

      {/* Index Feed Post Modal */}
      {source === 'index' && currentPost && (
        <IndexFeedPostModal
          isOpen={isPostViewerOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts.filter(p => p.user.id === currentPost.user.id)}
        />
      )}

      {/* Post Viewer Modal for clubhouse and profile sources */}
      {(source === 'clubhouse' || source === 'profile') && currentPost && (
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
      />
    </>
  );
};

export default UserPost;
