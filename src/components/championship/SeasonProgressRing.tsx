import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { prefersReduced } from '@/lib/ui/motion';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';
import { CheckCircle } from 'lucide-react';

interface SeasonProgressRingProps {
  seasonId: SeasonId;
  progress: number; // 0-1
  daysRemaining: number;
  isLive?: boolean;
  className?: string;
}

/**
 * SeasonProgressRing - Premium SVG ring with animated progress
 * 
 * Specs:
 * - 220px diameter ring (reduced from 240px)
 * - 10px stroke width
 * - Ambient glow pulse animation (6s cycle)
 * - Animated fill on mount (800ms ease-out)
 * - "LIVE" badge for active season
 * - Golf-palette theme colors
 */
export function SeasonProgressRing({ 
  seasonId, 
  progress, 
  daysRemaining, 
  isLive,
  className,
}: SeasonProgressRingProps) {
  const config = getSeasonConfig(seasonId);
  const reducedMotion = prefersReduced();
  
  const size = 220; // Diameter (reduced for better proportions)
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animated progress on mount (800ms ease-out)
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    if (reducedMotion) {
      setAnimatedProgress(progress);
      return;
    }
    
    // Short delay then animate to actual progress
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress, reducedMotion]);
  
  const strokeDashoffset = circumference * (1 - animatedProgress);
  const isComplete = daysRemaining <= 0;

  return (
    <div className={cn('relative', className)}>
      {/* Ambient glow pulse - scales 1 to 1.02 every 6s */}
      {!reducedMotion && isLive && (
        <div 
          className="absolute -inset-4 rounded-full animate-pulse-slow pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${config.themeColor}1A 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* SVG Ring */}
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={Math.round(animatedProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background ring - soft slate */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/60"
        />
        
        {/* Progress ring - 800ms ease-out animation */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.themeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            reducedMotion ? '' : 'transition-[stroke-dashoffset] duration-[800ms] ease-out'
          )}
          style={{
            filter: `drop-shadow(0 0 8px ${config.themeColor}40)`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Live badge */}
        {isLive && !isComplete && (
          <div className="absolute top-6 right-6 flex items-center gap-1">
            <span 
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                !reducedMotion && 'animate-pulse'
              )}
              style={{ backgroundColor: config.themeColor }}
            />
            <span 
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: config.themeColor }}
            >
              Live
            </span>
          </div>
        )}
        
        {isComplete ? (
          // Season complete state
          <div className="flex flex-col items-center justify-center gap-1">
            <CheckCircle 
              className="w-8 h-8" 
              style={{ color: config.themeColor }} 
            />
            <span 
              className="text-sm font-medium"
              style={{ color: config.themeColor }}
            >
              Season Complete
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Next season begins soon
            </span>
          </div>
        ) : (
          // Normal display
          <>
            {/* Season name */}
            <span className="text-xs font-medium text-muted-foreground mb-0.5 uppercase tracking-wide">
              {config.label}
            </span>
            
            {/* Days remaining - hero number */}
            <span 
              className="text-5xl font-bold tracking-tight font-display"
              style={{ color: config.themeColor }}
            >
              {daysRemaining}
            </span>
            
            {/* Label */}
            <span className="text-sm text-muted-foreground">
              days left
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default SeasonProgressRing;
