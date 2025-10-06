import React from 'react';

interface MediaNavigationDotsProps {
  mediaCount: number;
  currentIndex: number;
  onJump?: (index: number) => void;
}

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex,
  onJump
}) => {
  if (mediaCount <= 1) return null;

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-auto"
      style={{ bottom: 'calc(var(--bottom-nav-height) + 4px)' }}
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
                ? 'w-5 bg-white dark:bg-white' 
                : 'w-1.5 bg-white/60 dark:bg-white/50'
            }`}
          />
        );
      })}
    </div>
  );
};
