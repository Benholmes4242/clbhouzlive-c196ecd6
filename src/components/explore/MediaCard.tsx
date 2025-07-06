
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { ExploreContentItem } from './types';

import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import VideoPlayer from '@/components/ui/video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const { isOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: true,
    threshold: 0.5
  });

  if (item.type === 'cta') return null;

  // Removed excessive logging for performance

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(item.id);
  };

  const handleMediaClick = () => {
    // Only open media for image and video types, not CTA
    if (!isInvalidSrc && (item.type === 'image' || item.type === 'video')) {
      console.log('MediaCard handleMediaClick - item.golfCourse:', item.golfCourse);
      // Call the onMediaClick prop instead of opening the fullscreen modal
      if (props.onMediaClick) {
        props.onMediaClick(item);
      } else {
        openMedia(imageError ? fallbackImage : item.src, item.type, item.title, item.golfCourse);
      }
    }
  };

  const handleImageError = () => {
    console.log('Image load error for item:', {
      id: item.id, 
      src: item.src,
      errorType: 'IMAGE_LOAD_FAILED'
    });
    setImageError(true);
  };

  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  // Enhanced validation for invalid src
  const isInvalidSrc = !item.src || 
                      item.src.trim() === '' || 
                      item.src === 'null' || 
                      item.src === 'undefined' ||
                      item.src === '[object Object]' ||
                      typeof item.src !== 'string';

  if (isInvalidSrc) {
    console.log('Invalid src detected, using fallback:', {
      id: item.id,
      originalSrc: item.src,
      reason: 'INVALID_SRC_VALUE',
      fallbackUsed: fallbackImage
    });
    
    return (
      <>
        <div 
          ref={autoplayRef}
          className="relative group bg-white rounded-lg shadow-sm border overflow-hidden h-full cursor-pointer"
          onClick={handleMediaClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={fallbackImage}
              alt={item.title || 'Content'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => console.log('Fallback image loaded for:', item.id)}
              onError={() => console.log('Even fallback image failed for:', item.id)}
            />
          </div>
        </div>

        <FullscreenMediaModal
          isOpen={isOpen}
          onClose={closeMedia}
          mediaUrl={currentMedia?.url || ''}
          mediaType={currentMedia?.type || 'image'}
          alt={currentMedia?.alt}
        />
      </>
    );
  }

  return (
    <>
      <div 
        ref={autoplayRef}
        className="relative group bg-white rounded-lg shadow-sm border overflow-hidden h-full cursor-pointer"
        onClick={handleMediaClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Square Media Container */}
        <div className="relative w-full h-full overflow-hidden">
          {item.type === 'video' ? (
            <VideoPlayer
              src={item.src}
              autoplay={shouldAutoplay}
              muted={true}
              loop={true}
              className="w-full h-full"
              showVideoIcon={true}
              showOverlayControls={false}
              videoId={`explore-${item.id}`}
            />
          ) : (
            <img
              src={imageError ? fallbackImage : item.src}
              alt={item.title || 'Content'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
            />
          )}

          {/* Like button overlay - hidden on mobile */}
          <div className="absolute bottom-2 left-2 hidden md:block">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full hover:bg-opacity-80 transition-all duration-200 text-sm"
            >
              <Heart className="h-3 w-3" />
              <span className="font-medium">{item.likes}</span>
            </button>
          </div>

          {/* User info overlay - hidden on mobile */}
          {item.user && (
            <div className="absolute top-2 left-2 flex items-center space-x-2 hidden md:flex">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="w-6 h-6 rounded-full border border-white/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                }}
              />
              <span className="text-white text-xs font-medium bg-black bg-opacity-60 px-2 py-1 rounded-full">
                {item.user.name}
              </span>
              {item.user.verified && (
                <span className="text-blue-400 text-xs">✓</span>
              )}
            </div>
          )}
        </div>
      </div>

      <FullscreenMediaModal
        isOpen={isOpen}
        onClose={closeMedia}
        mediaUrl={currentMedia?.url || ''}
        mediaType={currentMedia?.type || 'image'}
        alt={currentMedia?.alt}
        golfCourse={currentMedia?.golfCourse}
      />
    </>
  );
};

export default MediaCard;
