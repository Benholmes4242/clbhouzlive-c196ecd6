/**
 * RoundSelector - Shared segmented round filter
 * Matches IntelligenceTabSwitcher styling
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
    <div className={cn("flex p-1 rounded-[14px] bg-muted/60 border border-border", className)}>
      {rounds.map((round) => {
        const isActive = activeRound === round;
        return (
          <button
            key={round}
            onClick={() => onRoundChange(round)}
            className={cn(
              "flex-1 py-2.5 text-sm text-center rounded-[11px] transition-all duration-300 active:scale-[0.95]",
              isActive
                ? "bg-card shadow-sm border border-border/60 font-semibold text-foreground"
                : "bg-transparent text-muted-foreground font-medium border border-transparent"
            )}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
