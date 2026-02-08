import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import { ProgressRing } from '@/components/leaderboards/ProgressRing';
import { Lock } from 'lucide-react';

interface SeasonData {
  daysUntilAvailable?: number;
}

interface ActiveSeasonCardProps {
  seasonId: SeasonId;
  daysRemaining: number;
  progressPercent: number;
  seasonData?: Record<SeasonId, SeasonData>;
  onSeasonSelect?: (seasonId: SeasonId) => void;
  className?: string;
}

/**
 * ActiveSeasonCard - Hero card with integrated season selector footer
 */
export const ActiveSeasonCard: React.FC<ActiveSeasonCardProps> = ({
  seasonId,
  daysRemaining,
  progressPercent,
  seasonData = {},
  onSeasonSelect,
  className,
}) => {
  const config = getSeasonConfig(seasonId);
  const Icon = config.Icon;
  
  // Animated progress
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // Get season state for each chip
  const getSeasonState = (id: SeasonId): 'active' | 'completed' | 'locked' => {
    const currentIndex = SEASON_ORDER.indexOf(seasonId);
    const targetIndex = SEASON_ORDER.indexOf(id);
    
    if (id === seasonId) return 'active';
    if (targetIndex < currentIndex) return 'completed';
    return 'locked';
  };

  // Short names for the footer tabs
  const getShortName = (id: SeasonId): string => {
    switch (id) {
      case 'preseason': return 'Pre-Season';
      case 'major': return 'Major';
      case 'summer': return 'Summer';
      case 'offseason': return 'Off-Season';
      default: return id;
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-card shadow-sm border border-border overflow-hidden',
        className
      )}
    >
      {/* Main content area */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <ProgressRing 
              progress={animatedProgress} 
              size={56} 
              strokeWidth={4} 
              daysLeft={daysRemaining}
              color={config.themeColor}
            />
          </div>
          
          {/* Season Info */}
          <div className="flex-1 min-w-0">
            {/* Top row: Label + Active badge */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Season
              </span>
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: config.themeColor }}
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active
                </span>
              </div>
            </div>
            
            {/* Season name */}
            <h3 className="text-base font-semibold text-foreground leading-tight">
              {config.title}
            </h3>
            
            {/* Tagline */}
            <p className="text-sm text-muted-foreground mt-0.5">
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>
      
      {/* Integrated Season Selector */}
      <div className="border-t border-border bg-muted/50">
        <div className="flex">
          {SEASON_ORDER.map((id, index) => {
            const seasonConfig = getSeasonConfig(id);
            const SeasonIcon = seasonConfig.Icon;
            const state = getSeasonState(id);
            const isLocked = state === 'locked';
            const isActive = state === 'active';
            
            return (
              <button
                key={id}
                onClick={() => !isLocked && onSeasonSelect?.(id)}
                disabled={isLocked}
                className={cn(
                  'flex-1 py-3 px-2 flex flex-col items-center gap-1.5',
                  'transition-all duration-200 active:scale-[0.97]',
                  index !== SEASON_ORDER.length - 1 && 'border-r border-border',
                  isLocked && 'cursor-not-allowed',
                  !isLocked && !isActive && 'hover:bg-muted/50'
                )}
                style={{
                  backgroundColor: isActive ? `${seasonConfig.themeColor}15` : undefined
                }}
              >
                {/* Season Icon */}
                <SeasonIcon 
                  className={cn('w-5 h-5', isLocked && 'opacity-30')}
                  style={{ color: isActive ? seasonConfig.themeColor : isLocked ? 'hsl(var(--muted-foreground) / 0.4)' : 'hsl(var(--muted-foreground))' }}
                />
                
                {/* Season Label */}
                <span 
                  className={cn(
                    'text-[10px] font-medium leading-tight text-center',
                    isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground'
                  )}
                  style={{ 
                    color: isActive ? seasonConfig.themeColor : undefined 
                  }}
                >
                  {getShortName(id)}
                </span>
                
                {/* Lock icon for locked seasons */}
                {isLocked && (
                  <Lock className="w-3 h-3 text-muted-foreground/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActiveSeasonCard;