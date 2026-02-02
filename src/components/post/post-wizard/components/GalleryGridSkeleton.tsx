import React from 'react';
import { cn } from '@/lib/utils';

interface GalleryGridSkeletonProps {
  count?: number;
}

export function GalleryGridSkeleton({ count = 12 }: GalleryGridSkeletonProps) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'aspect-square bg-muted',
            'animate-pulse'
          )}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}
