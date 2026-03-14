/**
 * RoundSelector - Tier 2 sub-tab pills
 * Uses the canonical secondary tab style: bg-[#475569] active, bg-muted inactive
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
      className={cn("flex items-center gap-1.5 mb-4", className)}
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
              "px-4 min-h-[36px] text-sm whitespace-nowrap transition-all active:scale-[0.97] font-semibold",
              isActive
                ? "text-white"
                : "text-muted-foreground bg-muted"
            )}
            style={{
              borderRadius: 20,
              ...(isActive ? { backgroundColor: '#475569' } : {}),
            }}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
