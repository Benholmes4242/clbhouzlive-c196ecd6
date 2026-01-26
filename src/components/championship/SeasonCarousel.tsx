import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { SEASON_CONFIG, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';

interface SeasonCarouselProps {
  activeSeason: SeasonId;
  seasonData: Record<SeasonId, { daysUntilAvailable?: number; isCompleted?: boolean }>;
  onSeasonSelect?: (seasonId: SeasonId) => void;
  className?: string;
}

/**
 * SeasonCarousel - Horizontal season selector
 * 
 * Specs:
 * - Flat, glassy, system-level aesthetic
 * - Active season has filled background and dot indicator
 * - Locked seasons show lock icon and are greyed out
 * - Tapping locked season triggers shake + toast
 */
export function SeasonCarousel({ 
  activeSeason, 
  seasonData,
  onSeasonSelect,
  className,
}: SeasonCarouselProps) {
  const [shakeId, setShakeId] = useState<SeasonId | null>(null);

  const handleSeasonClick = (seasonId: SeasonId) => {
    const data = seasonData[seasonId];
    const isLocked = data?.daysUntilAvailable && data.daysUntilAvailable > 0;
    
    if (isLocked) {
      // Trigger shake animation
      setShakeId(seasonId);
      setTimeout(() => setShakeId(null), 500);
      
      // Show toast
      toast(`Unlocks in ${data.daysUntilAvailable} days`, {
        icon: <Lock className="w-4 h-4 text-muted-foreground" />,
        duration: 2000,
      });
      return;
    }
    
    onSeasonSelect?.(seasonId);
  };

  return (
    <div className={cn('flex justify-center gap-3', className)}>
      {SEASON_ORDER.map((seasonId) => {
        const config = SEASON_CONFIG[seasonId];
        const data = seasonData[seasonId] || {};
        const isSelected = seasonId === activeSeason;
        const isLocked = data?.daysUntilAvailable && data.daysUntilAvailable > 0;
        const isShaking = shakeId === seasonId;
        
        return (
          <button
            key={seasonId}
            onClick={() => handleSeasonClick(seasonId)}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-full transition-all duration-200',
              // Active: larger pill with filled background
              isSelected && !isLocked && 'px-4 py-2',
              // Inactive: smaller
              !isSelected && 'px-3 py-1.5',
              // Shake animation
              isShaking && 'animate-shake',
              // Locked styling
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
            style={isSelected && !isLocked ? {
              backgroundColor: `${config.themeColor}1A`, // 10% opacity
            } : undefined}
            disabled={isLocked}
            aria-selected={isSelected}
            aria-disabled={isLocked}
          >
            {/* Season label */}
            <span 
              className={cn(
                'font-medium transition-colors whitespace-nowrap',
                isSelected ? 'text-[13px] text-foreground' : 'text-xs text-muted-foreground',
                isLocked && 'text-muted-foreground/60'
              )}
            >
              {config.label}
            </span>
            
            {/* Lock icon for locked seasons */}
            {isLocked && (
              <Lock className="w-3 h-3 text-muted-foreground/60" />
            )}
            
            {/* Active indicator dot - beneath the pill */}
            {isSelected && !isLocked && (
              <div 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: config.themeColor }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SeasonCarousel;
