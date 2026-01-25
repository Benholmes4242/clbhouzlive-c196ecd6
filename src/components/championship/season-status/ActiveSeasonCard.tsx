import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSeasonConfig } from '@/lib/seasonConfig';

interface ActiveSeasonCardProps {
  seasonId: string;
  daysRemaining: number;
  progressPercent: number;
  className?: string;
}

/**
 * ActiveSeasonCard - Current season display (no card container)
 * 
 * Specs:
 * - No card/border/shadow/radius - content floats on page background
 * - 3px left accent strip in season theme color
 * - "Current Season" label above bordered content
 * - 44x44px icon container with soft colored circle
 * - 8px progress bar with animated fill
 * - "X days left" and "● ACTIVE" status row
 */
export const ActiveSeasonCard: React.FC<ActiveSeasonCardProps> = ({
  seasonId,
  daysRemaining,
  progressPercent,
  className,
}) => {
  const config = getSeasonConfig(seasonId);
  const Icon = config.Icon;
  
  // Animated progress bar
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <div className={cn('px-4', className)}>
      {/* "Current Season" label - sits above the bordered content */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Current Season
      </p>
      
      {/* Content area with left accent strip */}
      <div
        className="border-l-[3px] pl-3"
        style={{ borderLeftColor: config.themeColor }}
      >
        {/* Main content row: Icon + Text */}
        <div className="flex items-center gap-3 mb-4">
          {/* Icon container: 44x44px soft colored circle */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${config.themeColor}20` }}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: config.themeColor }}
            />
          </div>
          
          {/* Text stack */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {config.subtitle}
            </p>
          </div>
        </div>
        
        {/* Progress bar section */}
        <div className="mb-3">
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-[450ms] ease-out"
              style={{
                width: `${animatedProgress}%`,
                backgroundColor: config.themeColor,
              }}
            />
          </div>
        </div>
        
        {/* Status row: Days left (left) | ACTIVE badge (right) */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {daysRemaining} days left
          </span>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: config.themeColor }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.themeColor }} />
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActiveSeasonCard;
