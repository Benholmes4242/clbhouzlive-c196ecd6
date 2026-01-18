/**
 * VideoLoadingSpinner - Loading indicator for paused video mode
 * Shows while first frame is loading (before video can display)
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface VideoLoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
} as const;

const borderClasses = {
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-[3px]',
} as const;

export const VideoLoadingSpinner: React.FC<VideoLoadingSpinnerProps> = ({
  className,
  size = 'md',
  showText = false,
}) => {
  return (
    <div 
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20',
        className
      )}
      role="status"
      aria-label="Loading video"
    >
      {/* Spinner */}
      <div
        className={cn(
          'animate-spin rounded-full border-white/30 border-t-white/80',
          sizeClasses[size],
          borderClasses[size]
        )}
      />
      
      {/* Optional loading text */}
      {showText && (
        <span className="mt-3 text-xs text-white/70 font-medium">
          Loading video...
        </span>
      )}
    </div>
  );
};

export default VideoLoadingSpinner;
