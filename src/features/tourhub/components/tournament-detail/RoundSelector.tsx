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
              "px-3 py-1.5 text-[13px] whitespace-nowrap transition-all active:scale-[0.95] font-semibold",
              isActive
                ? "text-white"
                : "text-muted-foreground"
            )}
            style={{
              borderRadius: 20,
              backgroundColor: isActive ? '#475569' : 'transparent',
            }}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
