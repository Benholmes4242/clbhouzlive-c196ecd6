import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export const VideoSkeleton: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`relative w-full aspect-[4/5] bg-muted animate-pulse ${className}`}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      {/* User profile overlay skeleton */}
      <div className="absolute top-3 left-2.5 z-20">
        <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5 flex items-center space-x-2 max-w-[140px]">
          {/* Profile picture skeleton */}
          <div className="w-6 h-6 rounded-full bg-muted-foreground/30 animate-pulse" />
          
          {/* Username/details skeleton */}
          <div className="min-w-0 space-y-1">
            <div className="h-3 bg-muted-foreground/30 rounded w-16 animate-pulse" />
            <div className="h-2 bg-muted-foreground/20 rounded w-12 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Engagement buttons skeleton */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-3 z-20">
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm animate-pulse" />
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
};

export const PostSkeleton: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`bg-background p-4 border-b animate-pulse ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        {/* Profile picture skeleton */}
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        
        {/* Username and caption skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          <div className="h-3 bg-muted rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
};