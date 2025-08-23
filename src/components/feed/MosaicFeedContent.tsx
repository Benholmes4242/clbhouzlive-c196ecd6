import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import FeedVideoPlayer from './FeedVideoPlayer';
import { useNavigate } from 'react-router-dom';
import { VideoPost, UserPostWithType } from './types';
import { useVideoPlaybackManager, useFullscreenVideoModal } from '@/hooks/useVideoPlaybackManager';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import Masonry from 'react-masonry-css';

interface MosaicFeedContentProps {
  optimisticPosts: any[];
  sortedContent: (VideoPost | UserPostWithType)[];
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

const MosaicFeedContent: React.FC<MosaicFeedContentProps> = ({
  optimisticPosts,
  sortedContent,
  onPostUpdated,
  onPostDeleted
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{[key: string]: number}>({});
  const navigate = useNavigate();
  const modalManager = useFullscreenVideoModal();

  const handlePrevMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) - 1)
    }));
  };

  const handleNextMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.min(mediaLength - 1, (prev[postId] || 0) + 1)
    }));
  };

  const handleMaximizeClick = (item: VideoPost | UserPostWithType) => {
    const modalData = getMediaDataForModal(item);
    modalManager.openModal({
      src: Array.isArray(modalData.mediaUrl) ? modalData.mediaUrl[0] : modalData.mediaUrl,
      user: modalData.user,
      content: modalData.content
    });
  };

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

  // MediaTile Component - extracted to fix hook usage
  const MediaTile: React.FC<{ item: VideoPost | UserPostWithType; index: number }> = ({ item, index }) => {
    const isUserPost = item.type === 'user_post';
    const media = isUserPost 
      ? (item as UserPostWithType).post_media.map(pm => ({ media_url: pm.media_url, media_type: pm.media_type }))
      : [{ media_url: (item as VideoPost).content.videoUrl || (item as VideoPost).content.image || '', media_type: (item as VideoPost).content.type }];
    const currentIndex = currentMediaIndex[item.id] || 0;
    const hasMultipleMedia = media.length > 1;
    
    // Video playback management for feed section
    const hasVideo = media.some(m => m.media_type === 'video');
    const { videoRef, containerRef, isPlaying, shouldShowPlayIcon, togglePlayPause } = useVideoPlaybackManager({
      section: 'feed',
      videoId: item.id,
      autoplayAllowed: hasVideo,
      priority: index // Use stable index for priority
    });

    // Get user info
    const username = isUserPost ? (item as UserPostWithType).user.username : (item as VideoPost).user.username;
    const displayName = isUserPost ? (item as UserPostWithType).user.display_name : (item as VideoPost).user.name;
    const caption = isUserPost ? (item as UserPostWithType).content : (item as VideoPost).content.description;

    // Removed golf course tag logic

    // Generate three types of cards based on Pinterest style
    const cardTypes = [
      'aspect-[2/3]',       // Tall portrait cards (2:3)
      'aspect-[4/5]',       // Medium cards (4:5) - most common
      'aspect-square',      // Short/square cards
    ];
    
    // Distribute card types with medium being most common
    const getCardType = (index: number) => {
      const random = (index * 7) % 10; // Pseudo-random but consistent
      if (random < 5) return cardTypes[1]; // 50% medium cards
      if (random < 8) return cardTypes[0]; // 30% tall cards  
      return cardTypes[2]; // 20% square cards
    };
    
    const aspectRatio = getCardType(index);

    const handleTileClick = () => {
      // Always open fullscreen modal when clicking on tile
      handleMaximizeClick(item);
    };

    const handlePlayButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      togglePlayPause();
    };

    return (
      <div ref={containerRef} className="mosaic-tile group relative overflow-hidden bg-card">
        {/* Media Container */}
        <div className={`relative w-full overflow-hidden ${aspectRatio}`} onClick={handleTileClick}>
          {hasMultipleMedia ? (
            // Carousel for multiple media
            <div className="relative w-full h-full">
              <div 
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {media.map((mediaItem, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full">
                     {mediaItem.media_type === 'video' ? (
                        <FeedVideoPlayer
                          ref={index === currentIndex && hasVideo ? videoRef : undefined}
                          src={mediaItem.media_url}
                          className="w-full h-full object-cover rounded-lg"
                         muted={true}
                         loop={true}
                         playsInline
                         preload={index === currentIndex ? "metadata" : "none"}
                         onClick={handleTileClick}
                       />
                     ) : (
                       <img
                         src={mediaItem.media_url}
                         alt="Golf content"
                          className="w-full h-full object-cover rounded-lg"
                         loading="lazy"
                       />
                     )}
                  </div>
                ))}
              </div>
              
              {/* Carousel Navigation */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevMedia(item.id, media.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextMedia(item.id, media.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    disabled={currentIndex === media.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                    {media.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-black' : 'bg-black/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single media
            <div className="w-full h-full">
               {media[0]?.media_type === 'video' ? (
                 <FeedVideoPlayer
                   ref={videoRef}
                   src={media[0].media_url}
                    className="w-full h-full object-cover rounded-lg"
                   muted={true}
                   loop={true}
                   playsInline
                   preload="metadata"
                   onClick={handleTileClick}
                 />
               ) : (
                 <img
                   src={media[0]?.media_url}
                   alt="Golf content"
                    className="w-full h-full object-cover rounded-lg"
                   loading="lazy"
                 />
              )}
            </div>
          )}
          
          {/* Play button - top left (shows when video is paused) */}
          {hasVideo && shouldShowPlayIcon && (
            <div className="absolute top-2 left-2 z-20">
              <button 
                onClick={handlePlayButtonClick}
                className="rounded-full p-2 text-white bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Maximize button - top right */}
          <div className="absolute top-2 right-2 z-20">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMaximizeClick(item);
              }}
              className="rounded-full p-2 text-white hover:bg-white/20 transition-colors opacity-100 hover:opacity-100 bg-black/30"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0">
                  <div className="flex items-end gap-2 mb-1">
                    <img
                      src={isUserPost ? (item as UserPostWithType).user.profile_photo_url || '/placeholder.svg' : (item as VideoPost).user.avatar || '/placeholder.svg'}
                      alt={displayName || username || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <p className="text-white font-bold text-base truncate">
                      {displayName || username}
                    </p>
                  </div>
                   {caption && (() => {
                    // Filter out golf club references from caption
                    let filteredCaption = caption;
                    
                    // Remove common golf course patterns
                    filteredCaption = filteredCaption
                      .replace(/\s*Played at[^.]*\.?\s*/gi, '')
                      .replace(/\s*@\s*[^#\s]*\s*/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
                    
                    return filteredCaption ? (
                      <div className="text-white/90 text-sm mt-1">
                        {(() => {
                          const hadIndex = filteredCaption.toLowerCase().indexOf(' had ');
                          if (hadIndex !== -1) {
                            const firstLine = filteredCaption.substring(0, hadIndex + 4); // Include " had"
                            const secondLine = filteredCaption.substring(hadIndex + 4).trim();
                            return (
                              <div>
                                <div className="truncate">{firstLine}</div>
                                {secondLine && (
                                  <div className="truncate">{secondLine}</div>
                                )}
                              </div>
                            );
                          }
                          return <div className="line-clamp-2">{filteredCaption}</div>;
                        })()}
                      </div>
                    ) : null;
                   })()}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-3 mb-1">
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiHandsClapping className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <GoCommentDiscussion className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiShareFat className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
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
      
      {/* Masonry Grid */}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="mosaic-grid"
        columnClassName="mosaic-column"
      >
        {sortedContent.map((item, index) => (
          <MediaTile key={item.id} item={item} index={index} />
        ))}
      </Masonry>

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        isOpen={modalManager.isOpen}
        onClose={modalManager.closeModal}
        videoData={modalManager.videoData}
      />
    </div>
  );
};

export default MosaicFeedContent;