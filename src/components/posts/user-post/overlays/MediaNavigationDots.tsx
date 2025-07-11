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
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
      {Array.from({ length: mediaCount }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all ${
            index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-40'
          }`}
        />
      ))}
    </div>
  );
};