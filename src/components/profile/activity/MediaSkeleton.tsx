import React from 'react';
import { cn } from '@/lib/utils';

interface MediaSkeletonProps {
  aspectRatio?: 'portrait' | 'square' | 'landscape';
  className?: string;
}

/**
 * Premium shimmer skeleton for loading media
 * Matches the aspect ratio of the eventual content
 */
const MediaSkeleton: React.FC<MediaSkeletonProps> = ({ 
  aspectRatio = 'square',
  className 
}) => {
  const aspectClass = aspectRatio === 'portrait' 
    ? 'aspect-[3/4]' 
    : aspectRatio === 'landscape' 
      ? 'aspect-[16/9]' 
      : 'aspect-square';

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted/30",
        aspectClass,
        className
      )}
    >
      <div className="absolute inset-0 animate-pulse">
        <div 
          className="h-full w-full"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)/0.3) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}
        />
      </div>
    </div>
  );
};

export default MediaSkeleton;
