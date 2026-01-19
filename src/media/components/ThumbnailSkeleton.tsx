/**
 * ThumbnailSkeleton
 * Loading placeholder for thumbnail components with shimmer effect
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { AspectRatio } from '../types';

export interface ThumbnailSkeletonProps {
  aspectRatio?: AspectRatio;
  showDuration?: boolean;
  className?: string;
}

/** Map aspect ratio strings to CSS values */
const ratioMap: Record<string, string> = {
  '3:4': '3/4',
  '4:3': '4/3',
  '16:9': '16/9',
  '9:16': '9/16',
  '1:1': '1/1',
  '21:9': '21/9',
};

export const ThumbnailSkeleton: React.FC<ThumbnailSkeletonProps> = ({
  aspectRatio = '16:9',
  showDuration = true,
  className,
}) => {
  const aspectRatioStyle = aspectRatio !== 'auto'
    ? { aspectRatio: ratioMap[aspectRatio] || aspectRatio }
    : {};

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-muted',
        className
      )}
      style={aspectRatioStyle}
    >
      {/* Shimmer animation overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Duration skeleton badge */}
      {showDuration && (
        <div className="absolute bottom-2 right-2 h-5 w-12 rounded bg-muted-foreground/20" />
      )}
    </div>
  );
};

export default ThumbnailSkeleton;
