import React from 'react';
import { cn } from '@/lib/utils';

interface DurationBadgeProps {
  /** Duration in seconds */
  durationSeconds: number;
  /** Badge size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats duration for badge display
 * Under 60 seconds: 8s, 24s, 59s
 * 60 seconds or more: 1:03, 2:45
 * Always rounded to nearest second
 */
function formatBadgeDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  
  if (s < 60) {
    return `${s}s`;
  }
  
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Standardized duration badge used across:
 * - Trending Today Hero
 * - Watch grid portrait tiles (3:4)
 * - Watch grid landscape tiles (16:9)
 * - Shorts fullscreen player
 * 
 * Non-interactive, always sits above gradients and media
 */
const DurationBadge: React.FC<DurationBadgeProps> = ({
  durationSeconds,
  size = 'sm',
  className,
}) => {
  // Only render for valid positive durations
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null;
  }

  const label = formatBadgeDuration(durationSeconds);

  return (
    <div
      className={cn(
        // Non-interactive
        "pointer-events-none",
        // Glass style - dark translucent with subtle blur
        "flex items-center rounded-full bg-black/70 backdrop-blur-sm shadow-sm",
        // Size variants
        size === 'sm' && "px-2 py-1",
        size === 'md' && "px-3 py-1.5",
        className
      )}
    >
      <span
        className={cn(
          "leading-none font-semibold text-white",
          size === 'sm' && "text-[10px]",
          size === 'md' && "text-xs"
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default DurationBadge;
