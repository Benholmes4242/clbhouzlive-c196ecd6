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
 * - 240px diameter ring
 * - 12px stroke width
 * - Ambient glow pulse animation
 * - Animated fill on mount
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
  
  const size = 200; // Diameter (slightly smaller for mobile)
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animated progress on mount
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    if (reducedMotion) {
      setAnimatedProgress(progress);
      return;
    }
    
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress, reducedMotion]);
  
  const strokeDashoffset = circumference * (1 - animatedProgress);
  const isComplete = daysRemaining <= 0;

  return (
    <div className={cn('relative', className)}>
      {/* Ambient glow pulse */}
      {!reducedMotion && isLive && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse-slow"
          style={{
            background: `radial-gradient(circle, ${config.themeColor}15 0%, transparent 70%)`,
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
        
        {/* Progress ring */}
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
            reducedMotion ? '' : 'transition-all duration-1000 ease-out'
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
