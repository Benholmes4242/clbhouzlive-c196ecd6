import React, { useCallback, useEffect, useState, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
  isActive?: boolean;
  onDoubleTapLike?: () => void;
}

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
  isActive = false,
  onDoubleTapLike,
}: FeedImageCarouselProps) {
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
    setCurrentSlide(0);
  }, [feedIndex, setCarouselPosition]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, mediaItems.length - 1));
    setCurrentSlide(clamped);
    setCarouselPosition(feedIndex, clamped);
  }, [feedIndex, mediaItems.length, setCarouselPosition]);

  // Listen for programmatic carousel-goto events from the action rail
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.feedIndex === feedIndex) {
        goTo(detail.mediaIndex);
      }
    };
    window.addEventListener('carousel-goto', handler);
    return () => window.removeEventListener('carousel-goto', handler);
  }, [feedIndex, goTo]);

  return (
    <div className="absolute inset-0" style={{ touchAction: 'pan-y' }}>
      {mediaItems.map((item, idx) => {
        const isVisible = currentSlide === idx;

        if (item.type === 'video') {
          return (
            <div
              key={item.id || idx}
              className="absolute inset-0"
              style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none' }}
            >
              <SnapVideoPlayer
                hlsUrl={item.hlsUrl || ''}
                mp4Url={item.mp4Url}
                thumbnailUrl={item.thumbnailUrl}
                width={item.width}
                height={item.height}
                duration={item.duration}
                isActive={isActive && isVisible}
                feedIndex={feedIndex}
                isSuggestedFeed={isSuggestedFeed}
                onDoubleTapLike={onDoubleTapLike}
              />
            </div>
          );
        }

        // Image slide
        const isLandscape = (item.width ?? 0) > (item.height ?? 1);
        const objectFit = isLandscape ? 'contain' : 'cover';
        const imgSrc = item.imageUrl || item.thumbnailUrl || '';
        return (
          <div
            key={item.id || idx}
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none' }}
          >
            {/* Blurred background for letterboxing */}
            <img
              src={imgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
              draggable={false}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/55" />
            {/* Main image */}
            <img
              src={imgSrc}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit, position: 'relative', zIndex: 1 }}
              loading={idx === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
});

export default FeedImageCarousel;
