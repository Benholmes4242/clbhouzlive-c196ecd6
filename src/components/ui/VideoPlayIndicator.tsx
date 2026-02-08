/**
 * VideoPlayIndicator - Unified play icon for video thumbnails
 * Matches the Create Moment modal thumbnail carousel style
 * 
 * Usage:
 * - Bottom-left positioned inside thumbnail container
 * - Configurable sizes: sm (16px), md (20px), lg (28px)
 * - Black/60 background with backdrop blur
 * - White filled play icon
 */
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { container: 'w-4 h-4', icon: 'w-2 h-2' },
  md: { container: 'w-5 h-5', icon: 'w-2.5 h-2.5' },
  lg: { container: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
};

export const VideoPlayIndicator = ({ 
  className,
  size = 'sm'
}: VideoPlayIndicatorProps) => {
  const classes = sizeClasses[size];

  return (
    <div 
      className={cn(
        "absolute bottom-1 left-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-10",
        classes.container,
        className
      )}
    >
      <Play className={cn("text-white fill-white", classes.icon)} />
    </div>
  );
};

export default VideoPlayIndicator;