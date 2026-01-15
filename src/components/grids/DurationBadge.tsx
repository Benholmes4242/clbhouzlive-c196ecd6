/**
 * DurationBadge - Displays video duration in HH:MM:SS or MM:SS format
 */

import { cn } from '@/lib/utils';

interface DurationBadgeProps {
  seconds: number;
  className?: string;
}

export function DurationBadge({ seconds, className }: DurationBadgeProps) {
  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = Math.floor(secs % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      className={cn(
        "px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium tabular-nums",
        className
      )}
    >
      {formatDuration(seconds)}
    </div>
  );
}
