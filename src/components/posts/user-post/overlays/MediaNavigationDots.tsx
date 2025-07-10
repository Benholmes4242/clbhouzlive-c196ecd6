import React from 'react';

interface MediaNavigationDotsProps {
  mediaCount: number;
  currentIndex: number;
  onDotClick?: (index: number) => void;
}

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex,
  onDotClick
}) => {
  if (mediaCount <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
      {Array.from({ length: mediaCount }).map((_, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onDotClick?.(index);
          }}
          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
            index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-40'
          }`}
          aria-label={`Go to media ${index + 1}`}
        />
      ))}
    </div>
  );
};