
import React, { useState } from 'react';
import { Heart, Play } from 'lucide-react';
import { ExploreContentItem } from './types';
import VideoPreview from '../posts/VideoPreview';
import MediaModal from './MediaModal';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (item.type === 'cta') return null;

  console.log('MediaCard rendering:', {
    id: item.id,
    type: item.type,
    src: item.src,
    title: item.title,
    hasValidSrc: !!item.src && item.src.length > 0
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(item.id);
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleImageError = () => {
    console.log('Image load error for item:', {
      id: item.id, 
      src: item.src,
      errorType: 'IMAGE_LOAD_FAILED'
    });
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', {
      id: item.id,
      src: item.src,
      type: item.type
    });
    setImageLoaded(true);
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
          className="relative group cursor-pointer bg-white rounded-lg shadow-sm border overflow-hidden h-full"
          onClick={handleCardClick}
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
        <MediaModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={{ ...item, src: fallbackImage }}
        />
      </>
    );
  }

  return (
    <>
      <div 
        className="relative group cursor-pointer bg-white rounded-lg shadow-sm border overflow-hidden h-full"
        onClick={handleCardClick}
      >
        {/* Square Media Container */}
        <div className="relative w-full h-full overflow-hidden">
          {item.type === 'video' ? (
            <VideoPreview
              src={item.src}
              videoId={item.id}
              className="w-full h-full"
              isGridThumbnail={true}
              onFullscreen={handleCardClick}
            />
          ) : (
            <>
              {/* Loading placeholder */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-300 rounded animate-spin"></div>
                </div>
              )}
              
              <img
                src={imageError ? fallbackImage : item.src}
                alt={item.title || 'Content'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ display: imageLoaded || imageError ? 'block' : 'none' }}
              />
            </>
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

      <MediaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={item}
      />
    </>
  );
};

export default MediaCard;
