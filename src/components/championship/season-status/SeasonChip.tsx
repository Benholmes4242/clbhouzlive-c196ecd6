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
 * SeasonChip - Individual chip for season navigation
 * 
 * States:
 * - Locked: Neutral bg, muted text, lock icon
 * - Upcoming: Neutral + highlight bg, normal text, "Next" label
 * - Completed: Neutral bg, muted text, checkmark icon
 * 
 * Specs:
 * - 36px visual height, 44px tap target
 * - 18px radius (fully rounded)
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
  const ChipIcon = getChipIcon(status);
  
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
        'flex items-center justify-center gap-1.5 px-4 min-w-[80px]',
        'h-9 rounded-full transition-all',
        'active:scale-95',
        styles.bg,
        styles.text,
        status === 'locked' && 'active:animate-shake',
        className
      )}
      style={{ minHeight: '44px' }} // Touch target
    >
      <span className="text-sm font-medium whitespace-nowrap">
        {config.label}
      </span>
      {ChipIcon && (
        <ChipIcon className="w-3.5 h-3.5 shrink-0" />
      )}
      {status === 'upcoming' && (
        <span className="text-[10px] font-semibold text-primary">Next</span>
      )}
    </button>
  );
};

export default SeasonChip;
