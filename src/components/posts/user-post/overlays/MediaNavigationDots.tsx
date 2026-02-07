import React from 'react';

interface MediaNavigationDotsProps {
  mediaCount: number;
  currentIndex: number;
  onJump?: (index: number) => void;
  bottomOffset?: number | string; // allows overriding default bottom positioning
  className?: string; // optional className to override z-index or other styles
}

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex,
  onJump,
  bottomOffset,
  className
}) => {
  if (mediaCount <= 1) return null;

  return (
    <div 
      className={`absolute z-30 pointer-events-none chrome-follow-bottom ${className ?? ''}`}
      style={{ bottom: bottomOffset ?? 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 8px)', left: 0, right: 0 }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
        role="tablist"
        aria-label="Media pagination"
      >
      {Array.from({ length: mediaCount }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <button
            key={index}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to media ${index + 1}`}
            onClick={() => onJump?.(index)}
            className={`h-1.5 rounded-full transition-all duration-200 ease-out relative after:content-[''] after:absolute after:-inset-2 ${
              isActive 
                ? 'w-5 bg-white' 
                : 'w-1.5 bg-white/60'
            }`}
          />
        );
      })}
      </div>
    </div>
  );
};
