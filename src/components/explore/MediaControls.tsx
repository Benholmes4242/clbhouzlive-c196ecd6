import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { CarouselDots } from '@/components/media/CarouselDots';

interface MediaControlsProps {
  hasMultipleMedia: boolean;
  mediaCount: number;
  currentIndex: number;
  isHovered: boolean;
  isMobile: boolean;
  onPrevMedia: (e?: React.MouseEvent) => void;
  onNextMedia: (e?: React.MouseEvent) => void;
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onNextMedia(),
    onSwipedRight: () => onPrevMedia(),
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  return (
    <div {...swipeHandlers} className="absolute inset-0">
      {/* Carousel dots — top-right */}
      <div
        className="absolute pointer-events-none"
        style={{ top: 8, right: 8, zIndex: 25, minWidth: 60 }}
      >
        <CarouselDots
          count={mediaCount}
          active={currentIndex}
          variant="elongated"
        />
      </div>

      {/* Navigation Arrows */}
      {((!isMobile && isHovered) || isMobile) && (
        <>
          {/* Previous Button */}
          <button
            onClick={onPrevMedia}
            className={`absolute ${isMobile ? '-left-2' : 'left-0'} top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200 ${!isMobile ? 'opacity-0 group-hover:opacity-100' : 'opacity-70'}`}
            aria-label="Previous media"
          >
            <ChevronLeft className="w-6 h-6 drop-shadow-lg" />
          </button>

          {/* Next Button */}
          <button
            onClick={onNextMedia}
            className={`absolute ${isMobile ? '-right-2' : 'right-0'} top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200 ${!isMobile ? 'opacity-0 group-hover:opacity-100' : 'opacity-70'}`}
            aria-label="Next media"
          >
            <ChevronRight className="w-6 h-6 drop-shadow-lg" />
          </button>
        </>
      )}
    </div>
  );
};

export default MediaControls;