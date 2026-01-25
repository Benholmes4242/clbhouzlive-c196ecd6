import React from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getSeasonConfig, getChipIcon, type SeasonId, type SeasonChipStatus } from '@/lib/seasonConfig';

interface SeasonChipProps {
  seasonId: SeasonId;
  status: SeasonChipStatus;
  daysUntilAvailable?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * SeasonChip - Individual chip for season navigation (v1.1)
 * 
 * States:
 * - Locked: Neutral bg, muted text, lock icon
 * - Upcoming: Neutral + highlight bg, normal text, "Next" label
 * - Completed: Neutral bg, muted text, checkmark icon
 * 
 * Specs (v1.1):
 * - ~52px height (for 2 lines + icon)
 * - 12px radius
 * - Stacked two-line layout: Icon left, "Major" + "Season" stacked right
 * - 24x24 icon in 28x28 coloured circle
 * - 44px minimum tap target
 * - 8px gap between chips
 */
export const SeasonChip: React.FC<SeasonChipProps> = ({
  seasonId,
  status,
  daysUntilAvailable,
  onClick,
  className,
}) => {
  const config = getSeasonConfig(seasonId);
  const StatusIcon = getChipIcon(status);
  const SeasonIcon = config.Icon;
  
  // Split label for stacked layout (e.g., "Off-Season" → ["Off-", "Season"])
  const getStackedLabel = () => {
    switch (seasonId) {
      case 'preseason':
        return ['Pre-', 'Season'];
      case 'major':
        return ['Major', 'Season'];
      case 'summer':
        return ['Summer', 'Season'];
      case 'offseason':
        return ['Off-', 'Season'];
      default:
        return [config.label, ''];
    }
  };
  
  const [line1, line2] = getStackedLabel();
  
  const handleClick = () => {
    if (status === 'locked') {
      // Show toast and shake animation
      toast.info(`Locked - available in ${daysUntilAvailable || '?'} days`, {
        duration: 2000,
      });
      return;
    }
    
    if (status === 'completed') {
      // TODO: Open Season Summary modal
      toast.info(`${config.label} season summary coming soon!`, {
        duration: 2000,
      });
      return;
    }
    
    onClick?.();
  };
  
  // Determine styling based on status
  const getChipStyles = () => {
    switch (status) {
      case 'upcoming':
        return {
          bg: 'bg-muted/80 border border-border',
          text: 'text-foreground',
        };
      case 'completed':
        return {
          bg: 'bg-muted/50',
          text: 'text-muted-foreground',
        };
      case 'locked':
      default:
        return {
          bg: 'bg-muted/40',
          text: 'text-muted-foreground',
        };
    }
  };
  
  const styles = getChipStyles();

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 min-w-[100px]',
        'rounded-xl transition-all',
        'active:scale-95',
        styles.bg,
        styles.text,
        status === 'locked' && 'active:animate-shake',
        className
      )}
      style={{ minHeight: '52px' }} // Spec: ~52px for 2 lines + icon
    >
      {/* Icon container: 28x28 coloured circle with 24x24 icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${config.themeColor}20` }}
      >
        <SeasonIcon
          className="w-4 h-4"
          style={{ color: config.themeColor }}
        />
      </div>
      
      {/* Stacked text layout */}
      <div className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold">{line1}</span>
        {line2 && <span className="text-sm font-semibold">{line2}</span>}
      </div>
      
      {/* Status indicator */}
      <div className="ml-auto shrink-0">
        {StatusIcon && (
          <StatusIcon className="w-3.5 h-3.5" />
        )}
        {status === 'upcoming' && (
          <span className="text-[10px] font-bold text-primary">Next</span>
        )}
      </div>
    </button>
  );
};

export default SeasonChip;
