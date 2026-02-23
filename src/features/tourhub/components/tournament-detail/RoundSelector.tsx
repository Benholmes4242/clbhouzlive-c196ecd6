/**
 * RoundSelector - Pill-style round filter matching canonical pill tab pattern
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
      className={cn("rounded-xl bg-muted/30 border border-border/50 p-1 flex mb-4", className)}
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
              "flex-1 px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.95]",
              isActive
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "bg-transparent text-muted-foreground font-medium"
            )}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
