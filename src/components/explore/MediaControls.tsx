import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';

interface MediaControlsProps {
  hasMultipleMedia: boolean;
  mediaCount: number;
  currentIndex: number;
  isHovered: boolean;
  isMobile: boolean;
  onPrevMedia: (e: React.MouseEvent) => void;
  onNextMedia: (e: React.MouseEvent) => void;
}

const MediaControls: React.FC<MediaControlsProps> = ({
  hasMultipleMedia,
  mediaCount,
  currentIndex,
  isHovered,
  isMobile,
  onPrevMedia,
  onNextMedia
}) => {
  if (!hasMultipleMedia) return null;

  return (
    <>
      {/* Navigation Dots - Bottom Center */}
      <MediaNavigationDots
        mediaCount={mediaCount}
        currentIndex={currentIndex}
      />

      {/* Desktop Navigation Arrows */}
      {!isMobile && isHovered && (
        <>
          {/* Previous Button */}
          <button
            onClick={onPrevMedia}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous media"
          >
            <ChevronLeft className="w-6 h-6 drop-shadow-lg" />
          </button>

          {/* Next Button */}
          <button
            onClick={onNextMedia}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next media"
          >
            <ChevronRight className="w-6 h-6 drop-shadow-lg" />
          </button>
        </>
      )}
    </>
  );
};

export default MediaControls;