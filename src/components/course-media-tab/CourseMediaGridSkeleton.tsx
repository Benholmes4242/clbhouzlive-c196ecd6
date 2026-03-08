import React from 'react';

export const CourseMediaGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {/* 9 portrait shimmer tiles */}
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={`tile-${i}`}
          className="aspect-[4/5] rounded-[4px] bg-muted animate-pulse"
        />
      ))}
      {/* 1 landscape shimmer spanning all columns */}
      <div
        className="col-span-3 aspect-video bg-muted animate-pulse"
      />
    </div>
  );
};
