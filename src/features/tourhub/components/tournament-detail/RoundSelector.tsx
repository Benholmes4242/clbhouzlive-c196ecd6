/**
 * RoundSelector - Pill-style round filter (secondary navigation)
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
    <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide mb-4", className)}>
      {rounds.map((round) => {
        const isActive = activeRound === round;
        return (
          <button
            key={round}
            onClick={() => onRoundChange(round)}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.95]",
              isActive
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground font-medium hover:text-foreground"
            )}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
