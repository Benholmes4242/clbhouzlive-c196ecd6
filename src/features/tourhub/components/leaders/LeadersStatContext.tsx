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
    <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {category.description}
      </p>
      {(category.tourAverage !== '—' || leaderValue) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {category.tourAverage !== '—' && (
            <span>
              Tour avg: <span className="font-mono font-semibold text-foreground">{category.tourAverage}</span>
            </span>
          )}
          {leaderValue && (
            <span>
              Leader: <span className="font-mono font-semibold text-foreground">{leaderValue}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
