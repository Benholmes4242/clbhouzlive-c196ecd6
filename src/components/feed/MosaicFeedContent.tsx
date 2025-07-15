import React, { useState, useCallback, memo } from 'react';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import { useNavigate } from 'react-router-dom';
import { VideoPost, UserPostWithType } from './types';
import { useFullscreenVideoModal } from '@/hooks/useVideoPlaybackManager';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import MediaTile from './MediaTile';

interface MosaicFeedContentProps {
  optimisticPosts: any[];
  sortedContent: (VideoPost | UserPostWithType)[];
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

const MosaicFeedContent: React.FC<MosaicFeedContentProps> = memo(({
  optimisticPosts,
  sortedContent,
  onPostUpdated,
  onPostDeleted
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{[key: string]: number}>({});
  const navigate = useNavigate();
  const modalManager = useFullscreenVideoModal();

  const handlePrevMedia = useCallback((postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) - 1)
    }));
  }, []);

  const handleNextMedia = useCallback((postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.min(mediaLength - 1, (prev[postId] || 0) + 1)
    }));
  }, []);

  const handleMaximizeClick = useCallback((item: VideoPost | UserPostWithType) => {
    console.log('🔍 Maximize clicked for item:', item);
    const modalData = getMediaDataForModal(item);
    modalManager.openModal({
      src: Array.isArray(modalData.mediaUrl) ? modalData.mediaUrl[0] : modalData.mediaUrl,
      user: modalData.user,
      content: modalData.content
    });
  }, [modalManager]);

  const getMediaDataForModal = (item: VideoPost | UserPostWithType) => {
    const isUserPost = item.type === 'user_post';
    
    if (isUserPost) {
      const userPost = item as UserPostWithType;
      const media = userPost.post_media;
      
      return {
        mediaUrl: media.length === 1 ? media[0].media_url : media.map(m => m.media_url),
        mediaType: media.length === 1 ? media[0].media_type as 'image' | 'video' : media.map(m => m.media_type as 'image' | 'video'),
        user: {
          id: userPost.user.id,
          profile_photo_url: userPost.user.profile_photo_url
        },
        displayName: userPost.user.display_name || userPost.user.username,
        content: userPost.content,
        postTags: userPost.post_tags,
        initialIndex: 0
      };
    } else {
      const videoPost = item as VideoPost;
      const mediaUrl = videoPost.content.videoUrl || videoPost.content.image || '';
      
      return {
        mediaUrl: mediaUrl,
        mediaType: videoPost.content.type as 'image' | 'video',
        user: {
          id: videoPost.id,
          profile_photo_url: videoPost.user.avatar
        },
        displayName: videoPost.user.name,
        content: videoPost.content.description,
        postTags: undefined,
        initialIndex: 0
      };
    }
  };

  return (
    <div className="mosaic-feed-container pb-20">
      {/* Show optimistic posts first */}
      {optimisticPosts.length > 0 && (
        <div className="mb-6">
          {optimisticPosts.map((optimisticPost) => (
            <OptimisticPostCard 
              key={optimisticPost.id} 
              post={optimisticPost}
              onRetry={() => {
                // Handle retry logic here if needed
              }}
            />
          ))}
        </div>
      )}
      
      {/* Mosaic Grid */}
      <div className="mosaic-grid">
        {sortedContent.map((item, index) => (
          <MediaTile
            key={item.id}
            item={item}
            index={index}
            currentMediaIndex={currentMediaIndex}
            onPrevMedia={handlePrevMedia}
            onNextMedia={handleNextMedia}
            onMaximizeClick={handleMaximizeClick}
          />
        ))}
      </div>

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        isOpen={modalManager.isOpen}
        onClose={modalManager.closeModal}
        videoData={modalManager.videoData}
      />
    </div>
  );
});

export default MosaicFeedContent;