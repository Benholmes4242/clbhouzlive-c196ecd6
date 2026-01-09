import React from 'react';
import { ChevronRight, Grid2X2 } from 'lucide-react';

export interface YourGamesGradientCTAProps {
  countBadge?: number;
  onPress: () => void;
}

/**
 * YourGamesGradientCTA
 * - Wide, subtle orange gradient (no image).
 * - Tap opens Games Hub → Yours.
 */
export function YourGamesGradientCTA({ countBadge, onPress }: YourGamesGradientCTAProps) {
  return (
    <button type="button" className="yourGamesCta" onClick={onPress}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="yourGamesCta__icon">
            <Grid2X2 className="h-5 w-5 text-black/70" />
          </div>

          <div className="min-w-0">
            <div className="text-base font-semibold text-black/85">Your Games</div>
            <div className="text-sm text-black/50 mt-0.5 truncate">
              View invites, hosts, and your upcoming rounds
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof countBadge === 'number' && (
            <div className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-black/70">
              {countBadge}
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-black/55" />
        </div>
      </div>
    </button>
  );
}
