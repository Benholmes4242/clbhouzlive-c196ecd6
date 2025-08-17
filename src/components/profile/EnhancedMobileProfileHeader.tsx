import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Circle, CircleDot } from 'lucide-react';
import { useProfileMedia } from '@/hooks/useProfileMedia';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface EnhancedMobileProfileHeaderProps {
  userId: string;
  displayName: string;
  username?: string;
  homeClub?: string;
  children?: React.ReactNode;
}

const EnhancedMobileProfileHeader: React.FC<EnhancedMobileProfileHeaderProps> = ({
  userId,
  displayName,
  username,
  homeClub,
  children
}) => {
  const isMobile = useIsMobile();
  const {
    mediaItems,
    currentMedia,
    currentIndex,
    headerImageUrl,
    fallbackHeaderUrl,
    isHeaderReady,
    nextMedia,
    prevMedia,
    goToMedia,
    hasMedia
  } = useProfileMedia(userId);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [fallbackImageLoaded, setFallbackImageLoaded] = useState(false);

  // Reset image loading states when media changes
  useEffect(() => {
    setImageLoaded(false);
    setFallbackImageLoaded(false);
  }, [currentIndex]);

  // Preload header image
  useEffect(() => {
    if (headerImageUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = headerImageUrl;
    }
  }, [headerImageUrl]);

  // Preload fallback image
  useEffect(() => {
    if (fallbackHeaderUrl) {
      const img = new Image();
      img.onload = () => setFallbackImageLoaded(true);
      img.src = fallbackHeaderUrl;
    }
  }, [fallbackHeaderUrl]);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  // No media - show default background
  if (!hasMedia) {
    return (
      <div className="relative w-full h-[60vh] bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {displayName}
          </h1>
          {username && (
            <p className="text-lg text-muted-foreground mb-1">
              @{username}
            </p>
          )}
          {homeClub && (
            <p className="text-sm text-muted-foreground">
              {homeClub}
            </p>
          )}
        </div>

        {children}
      </div>
    );
  }

  // Determine which image to show
  const showHeaderImage = isHeaderReady && imageLoaded;
  const showFallbackImage = !showHeaderImage && fallbackImageLoaded;
  
  const backgroundImage = showHeaderImage 
    ? headerImageUrl 
    : showFallbackImage 
    ? fallbackHeaderUrl 
    : undefined;

  const backgroundStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: showHeaderImage ? 'cover' : 'cover',
    backgroundPosition: showHeaderImage ? 'center' : 'center top',
    backgroundRepeat: 'no-repeat'
  } : {};

  // Apply blur effect for fallback
  const imageFilter = !showHeaderImage && showFallbackImage ? 'blur(8px) saturate(1.1)' : 'none';

  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          ...backgroundStyle,
          filter: imageFilter,
          transform: !showHeaderImage ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.5s ease-out, filter 0.5s ease-out'
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/90" />

      {/* Media Navigation - Top */}
      {mediaItems.length > 1 && (
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-between items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMedia}
            className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToMedia(index)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {index === currentIndex ? (
                  <CircleDot className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextMedia}
            className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Processing Status Indicator */}
      {currentMedia && !isHeaderReady && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {currentMedia.header_processing_status === 'processing' ? '✨ Enhancing...' : 
             currentMedia.header_processing_status === 'pending' ? '⏳ Queued' : 
             currentMedia.header_processing_status === 'error' ? '⚠️ Fallback' : ''}
          </div>
        </div>
      )}

      {/* Profile Info - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {displayName}
        </h1>
        {username && (
          <p className="text-lg text-muted-foreground mb-1">
            @{username}
          </p>
        )}
        {homeClub && (
          <p className="text-sm text-muted-foreground">
            {homeClub}
          </p>
        )}
      </div>

      {/* Media Info - Bottom Right */}
      {currentMedia && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {currentMedia.media_type === 'video' ? '📹' : '📸'} {currentIndex + 1}/{mediaItems.length}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default EnhancedMobileProfileHeader;