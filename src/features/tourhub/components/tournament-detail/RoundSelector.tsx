/**
 * RoundSelector — flat pill row, centered. Active = filled INK, inactive = muted.
 */

import { cn } from '@/lib/utils';
import { INK, INK_MUTE, INK_TINT_07, SURFACE } from '../../_shared/tokens';

interface RoundSelectorProps {
  rounds: string[];
  activeRound: string;
  onRoundChange: (round: string) => void;
  className?: string;
}

export function RoundSelector({ rounds, activeRound, onRoundChange, className }: RoundSelectorProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-1.5', className)}
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
            className="active:scale-[0.96] transition-transform"
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              background: isActive ? INK : 'transparent',
              color: isActive ? SURFACE : INK_MUTE,
              border: `1px solid ${isActive ? INK : INK_TINT_07}`,
              cursor: 'pointer',
            }}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
