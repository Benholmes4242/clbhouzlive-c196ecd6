import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
}

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
}: FeedImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
    setCurrentIndex(0);
  }, [feedIndex, setCarouselPosition]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, mediaItems.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setCurrentIndex(clamped);
    setCarouselPosition(feedIndex, clamped);
  }, [feedIndex, mediaItems.length, setCarouselPosition]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const showPrev = currentIndex > 0;
  const showNext = currentIndex < mediaItems.length - 1;

  return (
    <div className="absolute inset-0" style={{ touchAction: 'pan-y' }}>
      {/* Scroll container — no touch scrolling, programmatic only */}
      <div
        ref={scrollRef}
        className="absolute inset-0 flex"
        style={{
          overflowX: 'hidden',
          pointerEvents: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {mediaItems.map((item, idx) => {
          const isLandscape = (item.width ?? 0) > (item.height ?? 1);
          const objectFit = isSuggestedFeed ? 'cover' : (isLandscape ? 'contain' : 'cover');
          return (
            <div
              key={item.id || idx}
              className="flex-shrink-0 w-full h-full relative"
            >
              <img
                src={item.imageUrl || item.thumbnailUrl || ''}
                alt=""
                className="w-full h-full"
                style={{ objectFit, background: '#000' }}
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* Left chevron */}
      {showPrev && (
        <button
          type="button"
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            touchAction: 'manipulation',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Right chevron */}
      {showNext && (
        <button
          type="button"
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            touchAction: 'manipulation',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default FeedImageCarousel;
