import React, { useMemo } from 'react';

interface FeedCarouselDotsProps {
  count: number;
  activeIndex: number;
}

const MAX_VISIBLE = 5;

export const FeedCarouselDots: React.FC<FeedCarouselDotsProps> = ({ count, activeIndex }) => {
  const dots = useMemo(() => {
    if (count <= MAX_VISIBLE) {
      return Array.from({ length: count }, (_, i) => ({ realIndex: i, isEdge: false }));
    }
    const half = Math.floor(MAX_VISIBLE / 2);
    const start = Math.min(Math.max(activeIndex - half, 0), count - MAX_VISIBLE);
    return Array.from({ length: MAX_VISIBLE }, (_, slot) => ({
      realIndex: start + slot,
      isEdge: slot === 0 || slot === MAX_VISIBLE - 1,
    }));
  }, [count, activeIndex]);

  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Media pagination">
      {dots.map(({ realIndex, isEdge }) => {
        const isActive = realIndex === activeIndex;
        return (
          <div
            key={realIndex}
            role="tab"
            aria-selected={isActive}
            className={`rounded-full transition-all duration-200 ease-out ${
              isActive
                ? 'w-4 h-0.5 bg-white/90'
                : isEdge
                  ? 'w-1 h-0.5 bg-white/30'
                  : 'w-[5px] h-0.5 bg-white/30'
            }`}
          />
          />
        );
      })}
    </div>
  );
};
