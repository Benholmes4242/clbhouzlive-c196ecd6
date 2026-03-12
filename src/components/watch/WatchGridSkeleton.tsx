import React from 'react';

const WatchGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-[2px] px-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-[4px] animate-[shimmer_1.5s_infinite]"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
};

export default WatchGridSkeleton;