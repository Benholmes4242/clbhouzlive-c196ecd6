import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse bg-muted rounded ${className}`} />
      ))}
    </>
  );
};

export const PostSkeleton: React.FC = () => (
  <div className="bg-card rounded-lg border border-border p-4 space-y-4">
    <div className="flex items-center space-x-3">
      <SkeletonLoader className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <SkeletonLoader className="h-4 w-24" />
        <SkeletonLoader className="h-3 w-16" />
      </div>
    </div>
    <SkeletonLoader className="h-4 w-full" />
    <SkeletonLoader className="h-4 w-3/4" />
    <SkeletonLoader className="h-80 w-full rounded-lg" />
    <div className="flex items-center space-x-4">
      <SkeletonLoader className="h-8 w-16" />
      <SkeletonLoader className="h-8 w-20" />
      <SkeletonLoader className="h-8 w-16" />
    </div>
  </div>
);

export const StorySkeleton: React.FC = () => (
  <div className="flex items-center space-x-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center space-y-1">
        <SkeletonLoader className="w-20 h-20 rounded-[18px]" />
        <SkeletonLoader className="h-3 w-16" />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;