import React, { memo, useState } from 'react';
import { Heart, Play } from 'lucide-react';
import { ExploreContentItem } from './types';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';

interface EnhancedMediaCardProps {
  item: ExploreContentItem;
  onMediaClick: (item: ExploreContentItem) => void;
}

const EnhancedMediaCard: React.FC<EnhancedMediaCardProps> = ({ item, onMediaClick }) => {
  const [imageError, setImageError] = useState(false);
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: true,
    threshold: 0.3
  });

  const handleMediaClick = () => {
    onMediaClick(item);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (item.type === 'cta') return null;

  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  // Enhanced validation for invalid src
  const isInvalidSrc = !item.src || 
                      item.src.trim() === '' || 
                      item.src === 'null' || 
                      item.src === 'undefined' ||
                      item.src === '[object Object]' ||
                      typeof item.src !== 'string';

  const displaySrc = isInvalidSrc ? fallbackImage : item.src;

  return (
    <div 
      ref={autoplayRef}
      className="relative group bg-background rounded-lg overflow-hidden h-full cursor-pointer transition-transform duration-200 hover:scale-105"
      onClick={handleMediaClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media Container */}
      <div className="relative w-full h-full overflow-hidden">
        {item.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={displaySrc}
              className="w-full h-full object-cover"
              autoPlay={shouldAutoplay}
              muted
              loop
              playsInline
              onError={() => setImageError(true)}
            />
            {/* Video Play Icon - Bottom Right */}
            <div className="absolute bottom-2 right-2">
              <div className="flex items-center justify-center w-8 h-8 bg-black/60 text-white rounded-full">
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              </div>
            </div>
            {imageError && (
              <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-xs text-muted-foreground">Video unavailable</div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={imageError ? fallbackImage : displaySrc}
              alt={item.title || 'Image'}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            {imageError && (
              <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-xs text-muted-foreground">Image unavailable</div>
              </div>
            )}
          </div>
        )}

        {/* User Info - Top Left */}
        {item.user && (
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-6 h-6 rounded-full border-2 border-white/80"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
            <div className="flex items-center space-x-1">
              <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">
                {item.user.name}
              </span>
              {item.user.verified && (
                <span className="text-blue-400 text-xs">✓</span>
              )}
            </div>
          </div>
        )}

        {/* Like Count - Bottom Left */}
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center space-x-1 bg-black/60 text-white px-2 py-1 rounded-full">
            <Heart className="h-3 w-3" />
            <span className="text-xs font-medium">{item.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(EnhancedMediaCard);