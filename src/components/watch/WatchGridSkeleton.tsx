import React from 'react';

const WatchGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-[2px] px-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] rounded-[4px] animate-[shimmer_1.5s_infinite]"
          style={{
            background: 'linear-gradient(90deg, hsl(214 32% 91%) 25%, hsl(216 33% 94%) 50%, hsl(214 32% 91%) 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
};

export default WatchGridSkeleton;
