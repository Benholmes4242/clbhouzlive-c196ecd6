/**
 * PlayerTournamentHistory - Recent tournaments with show more,
 * PGA score colors, tap feedback, and font-mono scores.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePlayerResults, formatPosition, formatScore, formatMoney } from '../../hooks/usePlayerResults';
import { TOUR_COLORS } from '../../constants/colors';

interface PlayerTournamentHistoryProps {
  playerId: string;
}

export function PlayerTournamentHistory({ playerId }: PlayerTournamentHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: allResults, isLoading } = usePlayerResults(playerId, 30);

  const INITIAL_LIMIT = 5;
  const results = showAll ? allResults : allResults?.slice(0, INITIAL_LIMIT);
  const hasMore = (allResults?.length ?? 0) > INITIAL_LIMIT;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 pl-3 border-l-3 border-primary">
        <Activity className="w-5 h-5 text-primary" />
        Recent Tournaments
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <>
          <div className="space-y-2">
            {results.map((result) => {
              const pos = formatPosition(result.position, result.position_tied, result.status);
              const score = result.score;
              const scoreStr = formatScore(result.score);
              const isWin = pos === '1st' || pos === 'T1st';
              const isTop10 = !isWin && (result.position !== null && result.position <= 10);
              const isCut = pos === 'MC' || pos === 'WD' || pos === 'DQ';

              return (
                <Link
                  key={result.id}
                  to={`/tourhub/tournament/${result.tournament_id}`}
                  className={cn(
                    "flex items-center gap-4 py-3 px-3 rounded-lg",
                    "bg-card/50 border border-border/30",
                    "hover:border-primary/40 hover:bg-card transition-all duration-200",
                    "active:scale-[0.98] group"
                  )}
                >
                  {/* Position badge */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold font-mono shrink-0",
                    isWin ? "bg-amber-500/20 text-amber-500" :
                    isTop10 ? "bg-emerald-500/10 text-emerald-500" :
                    isCut ? "bg-muted/50 text-muted-foreground" :
                    "bg-muted/30 text-foreground"
                  )}>
                    {pos}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {result.tournament_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.tournament_end_date
                        ? format(new Date(result.tournament_end_date), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold font-mono"
                      style={{
                        color: score !== null && score < 0
                          ? TOUR_COLORS.scoreUnderPar
                          : score !== null && score > 0
                            ? TOUR_COLORS.scoreOverPar
                            : TOUR_COLORS.scoreEven,
                      }}
                    >
                      {scoreStr}
                    </p>
                    {result.money !== null && result.money > 0 && (
                      <p className="text-xs text-emerald-500 font-mono mt-0.5">
                        {formatMoney(result.money)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary hover:text-primary/80 active:scale-[0.97] transition-all rounded-lg border border-border/30 hover:border-primary/30"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>View All Results <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⛳</span>
          </div>
          <p className="text-muted-foreground font-medium">No tournament results yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Results will appear as tournaments are completed
          </p>
        </div>
      )}
    </div>
  );
}
