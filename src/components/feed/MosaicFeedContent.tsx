/**
 * MosaicFeedContent - Feed grid with visibility-based autoplay
 * 
 * UNIFIED WITH CLUBHOUSE: Uses IntersectionObserver for autoplay
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import FeedVideoPlayer, { FeedVideoPlayerRef } from './FeedVideoPlayer';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useNavigate } from 'react-router-dom';
import { VideoPost, UserPostWithType } from './types';
import { useFullscreenVideoModal } from '@/hooks/useFullscreenVideoModal';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import Masonry from 'react-masonry-css';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

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

  const handleMaximizeClick = (item: VideoPost | UserPostWithType, mediaIndex?: number) => {
    const modalData = getMediaDataForModal(item);
    const idx = mediaIndex ?? currentMediaIndex[item.id] ?? 0;
    
    // Use the currently displayed media index for fullscreen
    const mediaUrl = Array.isArray(modalData.mediaUrl) ? modalData.mediaUrl[idx] : modalData.mediaUrl;
    const studioEdit = Array.isArray(modalData.studioEdits) ? modalData.studioEdits[idx] : modalData.studioEdits;
    
    modalManager.openModal({
      src: mediaUrl,
      user: modalData.user,
      content: modalData.content,
      studioEdit  // Single object, not array
    });
  };

  const getMediaDataForModal = (item: VideoPost | UserPostWithType) => {
    const isUserPost = item.type === 'user_post';
    
    if (isUserPost) {
      const userPost = item as UserPostWithType;
      const media = userPost.post_media;
      
      // Extract studioEdits from post_media
      const studioEdits = media.map((m: any) => m.studio_edits ?? null);
      
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
        studioEdits,
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
        studioEdits: undefined,
        initialIndex: 0
      };
    }
  };

  // MediaTile Component - using unified media system
  const MediaTile: React.FC<{ item: VideoPost | UserPostWithType; index: number }> = ({ item, index }) => {
    const isUserPost = item.type === 'user_post';
    const media = isUserPost 
      ? (item as UserPostWithType).post_media.map(pm => ({ 
          media_url: pm.media_url, 
          media_type: pm.media_type,
          studio_edits: (pm as any).studio_edits,
          trim_start: (pm as any).trim_start as number | null,
          trim_end: (pm as any).trim_end as number | null,
        }))
      : [{ media_url: (item as VideoPost).content.videoUrl || (item as VideoPost).content.image || '', media_type: (item as VideoPost).content.type, studio_edits: null, trim_start: null as number | null, trim_end: null as number | null }];
    const currentIndex = currentMediaIndex[item.id] || 0;
    const hasMultipleMedia = media.length > 1;
    
    // Detect music from studioEdits
    const { postHasMusic, activeMusic } = useMemo(() => {
      const hasMusic = media.some(m => {
        const music = (m.studio_edits as any)?.music;
        return !!(music?.url || music?.r2Key);
      });
      const music = media
        .map(m => (m.studio_edits as any)?.music)
        .find(m => m?.url || m?.r2Key) ?? null;
      return { postHasMusic: hasMusic, activeMusic: music };
    }, [media]);
    
    // Check if this item has video
    const hasVideo = media.some(m => m.media_type === 'video');
    
    // Visibility-based autoplay (40% threshold)
    const tileRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      if (!hasVideo) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setIsVisible(entry.intersectionRatio >= 0.4);
        },
        { threshold: [0, 0.4, 0.5, 1.0] }
      );
      
      if (tileRef.current) {
        observer.observe(tileRef.current);
      }
      
      return () => observer.disconnect();
    }, [hasVideo]);
    
    const shouldShowPlayIcon = hasVideo && !isVisible;

    // Get user info
    const username = isUserPost ? (item as UserPostWithType).user.username : (item as VideoPost).user.username;
    const displayName = isUserPost ? (item as UserPostWithType).user.display_name : (item as VideoPost).user.name;
    const caption = isUserPost ? (item as UserPostWithType).content : (item as VideoPost).content.description;

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
      // Always open fullscreen modal when clicking on tile, passing current media index
      handleMaximizeClick(item, currentIndex);
    };

    return (
      <div ref={tileRef} className="mosaic-tile group relative overflow-hidden bg-card">
        {/* Media Container */}
        <div className={`relative w-full overflow-hidden ${aspectRatio}`} onClick={handleTileClick}>
          {hasMultipleMedia ? (
            // Carousel for multiple media
            <div className="relative w-full h-full">
              <div 
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {media.map((mediaItem, idx) => {
                  const studioEdits = mediaItem.studio_edits as any;
                  const filterClass = getFilterClass(studioEdits?.filter);
                  const cropClass = getCropWrapperClass(studioEdits?.crop);
                  const pixelStyle = getPixelLayerStyle(studioEdits);
                  
                  return (
                    <div key={idx} className="flex-shrink-0 w-full h-full relative">
                      <div className={cn("w-full h-full", cropClass)}>
                      <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                          {mediaItem.media_type === 'video' ? (
                            <FeedVideoPlayer
                              src={mediaItem.media_url}
                              className="w-full h-full object-cover rounded-lg"
                              muted={true}
                              loop={true}
                              autoplay={idx === currentIndex && isVisible}
                              onClick={handleTileClick}
                              trimStart={mediaItem.trim_start}
                              trimEnd={mediaItem.trim_end}
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
                      </div>
                      {/* Text overlays from studio_edits */}
                      {studioEdits?.textOverlays?.length > 0 && (
                        <TextOverlayRenderer
                          textOverlays={studioEdits.textOverlays}
                          isEditable={false}
                        />
                      )}
                    </div>
                  );
                })}
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
                    {media.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentIndex ? 'bg-black' : 'bg-black/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single media
            <div className="w-full h-full relative">
              {(() => {
                const studioEdits = media[0]?.studio_edits as any;
                const filterClass = getFilterClass(studioEdits?.filter);
                const cropClass = getCropWrapperClass(studioEdits?.crop);
                const pixelStyle = getPixelLayerStyle(studioEdits);
                
                return (
                  <div className={cn("w-full h-full", cropClass)}>
                    <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                      {media[0]?.media_type === 'video' ? (
                        <FeedVideoPlayer
                          src={media[0].media_url}
                          className="w-full h-full object-cover rounded-lg"
                          muted={true}
                          loop={true}
                          autoplay={isVisible}
                          onClick={handleTileClick}
                          trimStart={media[0].trim_start}
                          trimEnd={media[0].trim_end}
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
                  </div>
                );
              })()}
              {/* Text overlays from studio_edits */}
              {(media[0]?.studio_edits as any)?.textOverlays?.length > 0 && (
                <TextOverlayRenderer
                  textOverlays={(media[0].studio_edits as any).textOverlays}
                  isEditable={false}
                />
              )}
            </div>
          )}
          
          {/* Play button - top left (shows when video is paused) */}
          {shouldShowPlayIcon && (
            <div className="absolute top-2 left-2 z-20">
              <button 
                onClick={(e) => e.stopPropagation()}
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
                    <SquircleAvatar
                      src={isUserPost ? (item as UserPostWithType).user.profile_photo_url || null : (item as VideoPost).user.avatar || null}
                      alt={displayName || 'Golfer'}
                      userId={isUserPost ? (item as UserPostWithType).user.id ?? null : ((item as VideoPost).user as any)?.id ?? null}
                      size={48}
                    />
                    <p className="text-white font-bold text-base truncate">
                      {displayName || 'Golfer'}
                    </p>
                  </div>
                   {caption && (() => {
                    const filteredCaption = caption
                      .replace(/\s*Played at[^.]*\.?\s*/gi, '')
                      .replace(/\s+/g, ' ')
                      .trim();

                    const surfaceTags = isUserPost ? ((item as UserPostWithType).post_tags || []) : [];

                    return filteredCaption ? (
                      <PostContentWithTags
                        content={filteredCaption}
                        tags={surfaceTags}
                        className="text-white/90 text-sm mt-1 line-clamp-2"
                      />
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
          
          {/* SoundtrackStrip for music posts */}
          {activeMusic && (
            <div className="absolute bottom-3 left-2 z-30 max-w-[140px]">
              <SoundtrackStrip 
                music={{
                  trackId: activeMusic.trackId || '',
                  title: activeMusic.title || 'Unknown Track',
                  artist: activeMusic.artist,
                  r2Key: activeMusic.r2Key,
                  url: activeMusic.url,
                  startAt: activeMusic.startAt,
                  volume: activeMusic.volume
                }}
                variant="published"
              />
            </div>
          )}
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
