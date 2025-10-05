import React from 'react';

interface MediaNavigationDotsProps {
  mediaCount: number;
  currentIndex: number;
}

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex
}) => {
  if (mediaCount <= 1) return null;

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 flex space-x-1.5 z-30"
      style={{ bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 10px)' }}
      aria-hidden="true"
    >
      {Array.from({ length: mediaCount }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            index === currentIndex 
              ? 'bg-white/90 scale-110' 
              : 'bg-white/40'
          }`}
        />
      ))}
    </div>
  );
};