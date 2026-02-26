/**
 * RoundSelector - Tier 2 sub-filter round selector
 * TD-06: Added role="tablist" and role="tab" with aria-selected
 */

import { cn } from '@/lib/utils';

interface RoundSelectorProps {
  rounds: string[];
  activeRound: string;
  onRoundChange: (round: string) => void;
  className?: string;
}

export function RoundSelector({ rounds, activeRound, onRoundChange, className }: RoundSelectorProps) {
  return (
    <div
      className={cn("flex items-center gap-1 mb-4", className)}
      role="tablist"
      aria-label="Round Selection"
    >
      {rounds.map((round) => {
        const isActive = activeRound === round;
        return (
          <button
            key={round}
            role="tab"
            aria-selected={isActive}
            onClick={() => onRoundChange(round)}
            className={cn(
              "relative flex-1 px-4 py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97]",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200",
              isActive
                ? "text-foreground font-semibold after:bg-[hsl(var(--tab-orange))]"
                : "text-muted-foreground font-medium hover:text-foreground after:bg-transparent"
            )}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
