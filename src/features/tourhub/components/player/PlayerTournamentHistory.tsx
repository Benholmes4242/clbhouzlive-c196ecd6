/**
 * PlayerTournamentHistory - Clean editorial list layout.
 * No card container — content sits directly on page background.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
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

  const INITIAL_LIMIT = 8;
  const results = showAll ? allResults : allResults?.slice(0, INITIAL_LIMIT);
  const hasMore = (allResults?.length ?? 0) > INITIAL_LIMIT;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-muted-foreground" />
        Recent Tournaments
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <>
          <div>
            {results.map((result) => {
              const pos = formatPosition(result.position, result.position_tied, result.status);
              const score = result.score;
              const scoreStr = formatScore(result.score);
              const isWin = pos === '1st' || pos === 'T1st';

              return (
                <Link
                  key={result.id}
                  to={`/tourhub/tournament/${result.tournament_id}`}
                  className="flex items-center py-3 border-b border-border gap-3 group active:scale-[0.98] transition-transform"
                >
                  {/* Position */}
                  <span className={cn(
                    "text-sm font-bold font-mono tabular-nums w-[50px] shrink-0",
                    isWin ? "text-amber-500" : "text-foreground"
                  )}>
                    {isWin ? <Trophy className="w-4 h-4 text-amber-500 inline" /> : pos}
                  </span>

                  {/* Tournament name */}
                  <span className="text-sm text-foreground flex-1 min-w-0 truncate group-hover:text-primary transition-colors">
                    {result.tournament_name}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {result.tournament_end_date
                      ? format(new Date(result.tournament_end_date), 'MMM d')
                      : '—'}
                  </span>

                  {/* Score */}
                  <span
                    className="text-sm font-semibold font-mono tabular-nums w-[40px] text-right shrink-0"
                    style={{
                      color: score !== null && score < 0
                        ? TOUR_COLORS.scoreUnderPar
                        : score !== null && score > 0
                          ? TOUR_COLORS.scoreOverPar
                          : TOUR_COLORS.scoreEven,
                    }}
                  >
                    {scoreStr}
                  </span>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all"
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
          <p className="text-muted-foreground font-medium">No tournament results yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Results will appear as tournaments are completed
          </p>
        </div>
      )}
    </div>
  );
}
