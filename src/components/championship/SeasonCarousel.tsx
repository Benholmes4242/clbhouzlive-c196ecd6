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
    <div className={cn('flex justify-center gap-2', className)}>
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
              'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200',
              isShaking && 'animate-shake',
              isSelected && !isLocked && 'bg-slate-100/80',
              !isSelected && !isLocked && 'hover:bg-slate-100/50',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isLocked}
            aria-selected={isSelected}
            aria-disabled={isLocked}
          >
            {/* Season label */}
            <span 
              className={cn(
                'text-xs font-medium transition-colors',
                isSelected ? 'text-foreground' : 'text-muted-foreground',
                isLocked && 'text-muted-foreground/60'
              )}
            >
              {config.label}
            </span>
            
            {/* Lock icon for locked seasons */}
            {isLocked && (
              <Lock className="w-3 h-3 text-muted-foreground/60" />
            )}
            
            {/* Active indicator dot */}
            {isSelected && !isLocked && (
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all"
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
