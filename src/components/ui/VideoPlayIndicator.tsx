/**
 * VideoPlayIndicator - Unified play icon for video thumbnails
 * Matches the Create Moment modal thumbnail carousel style
 * 
 * Usage:
 * - Bottom-left positioned inside thumbnail container
 * - 16x16 container with 8x8 icon
 * - Black/60 background with backdrop blur
 * - White filled play icon
 */
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayIndicatorProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const VideoPlayIndicator = ({ 
  className,
  size = 'sm'
}: VideoPlayIndicatorProps) => {
  const sizeClasses = size === 'sm' 
    ? 'w-4 h-4' 
    : 'w-5 h-5';
  
  const iconClasses = size === 'sm'
    ? 'w-2 h-2'
    : 'w-2.5 h-2.5';

  return (
    <div 
      className={cn(
        "absolute bottom-1 left-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-10",
        sizeClasses,
        className
      )}
    >
      <Play className={cn("text-white fill-white", iconClasses)} />
    </div>
  );
};

export default VideoPlayIndicator;
