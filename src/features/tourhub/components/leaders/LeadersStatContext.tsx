/**
 * LeadersStatContext — Stat description card with tour average + leader value.
 * Helps users understand what the stat means.
 */

import type { LeaderCategory } from './constants';

interface LeadersStatContextProps {
  category: LeaderCategory;
  leaderValue?: string;
}

export function LeadersStatContext({ category, leaderValue }: LeadersStatContextProps) {
  return (
    <div className="bg-muted/20 border border-border/30 rounded-xl px-4 py-3">
      <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
        {category.description}
      </p>
      {(category.tourAverage !== '—' || leaderValue) && (
        <div className="flex items-center gap-4 mt-2">
          {category.tourAverage !== '—' && (
            <span className="text-[11px] text-muted-foreground/60">
              Tour avg: <span className="font-mono font-semibold text-foreground tabular-nums">{category.tourAverage}</span>
            </span>
          )}
          {leaderValue && (
            <span className="text-[11px] text-muted-foreground/60">
              Leader: <span className="font-mono font-semibold text-foreground tabular-nums">{leaderValue}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
