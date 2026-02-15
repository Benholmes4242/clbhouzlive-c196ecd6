/**
 * PlayerTournamentHistory - Timeline layout with position badges,
 * vertical line, color-coded results, glass card treatment.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePlayerResults, formatPosition, formatScore, formatMoney } from '../../hooks/usePlayerResults';
import { TOUR_COLORS } from '../../constants/colors';

const CARD_CLASS = "rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]";

function getPositionStyle(pos: string, position: number | null) {
  const isWin = pos === '1st' || pos === 'T1st';
  const isTop5 = !isWin && position !== null && position <= 5;
  const isTop10 = !isWin && !isTop5 && position !== null && position <= 10;
  const isTop25 = !isWin && !isTop5 && !isTop10 && position !== null && position <= 25;
  const isCut = pos === 'MC' || pos === 'WD' || pos === 'DQ';

  if (isWin) return 'bg-amber-500/20 text-amber-600';
  if (isTop5) return 'bg-emerald-500/10 text-emerald-600';
  if (isTop10) return 'bg-blue-500/10 text-blue-600';
  if (isCut) return 'bg-red-500/8 text-red-500';
  if (isTop25) return 'bg-muted text-muted-foreground';
  return 'bg-muted/30 text-foreground';
}

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
    <div className={cn(CARD_CLASS, "p-5")}>
      <h2 className="text-[16px] font-semibold text-foreground mb-4 flex items-center gap-2 pl-3 border-l-3 border-primary">
        <Activity className="w-4.5 h-4.5 text-primary" />
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
          <div className="space-y-0">
            {results.map((result, index) => {
              const pos = formatPosition(result.position, result.position_tied, result.status);
              const score = result.score;
              const scoreStr = formatScore(result.score);
              const isWin = pos === '1st' || pos === 'T1st';
              const isLast = index === results.length - 1;

              return (
                <Link
                  key={result.id}
                  to={`/tourhub/tournament/${result.tournament_id}`}
                  className="flex gap-3 group active:scale-[0.98] transition-transform"
                >
                  {/* Left: Position badge + vertical line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold font-mono shrink-0 tabular-nums",
                      getPositionStyle(pos, result.position)
                    )}>
                      {isWin ? <Trophy className="w-4 h-4 text-amber-500" /> : pos}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border/50 mt-2 mb-1" />
                    )}
                  </div>

                  {/* Right: Tournament info */}
                  <div className="flex-1 min-w-0 pb-4">
                    <p className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {result.tournament_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {result.tournament_end_date
                        ? format(new Date(result.tournament_end_date), 'MMM d, yyyy')
                        : '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-[14px] font-bold font-mono tabular-nums"
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
                      {result.money !== null && result.money > 0 && (
                        <span className="text-[11px] text-emerald-500 font-mono tabular-nums">
                          {formatMoney(result.money)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary hover:text-primary/80 active:scale-[0.97] transition-all rounded-xl border border-border/40 bg-card shadow-sm hover:border-primary/30"
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
            <Activity className="w-7 h-7 text-muted-foreground" />
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