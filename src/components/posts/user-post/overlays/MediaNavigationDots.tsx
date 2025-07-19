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
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
      {Array.from({ length: mediaCount }).map((_, index) => (
        <span
          key={index}
          className={`text-white text-sm transition-all ${
            index === currentIndex ? 'font-bold' : 'font-normal opacity-60'
          }`}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
};