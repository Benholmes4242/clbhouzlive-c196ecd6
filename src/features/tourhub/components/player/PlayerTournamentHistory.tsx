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
      {/* Section header — 22px / 700 */}
      <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Recent Tournaments
        </h2>
      </div>

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
                  className="flex items-center gap-3 group active:scale-[0.98] transition-transform"
                  style={{ padding: '12px 0', borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
                >
                  {/* Position — 14px, weight 700 */}
                  <span
                    className="shrink-0"
                    style={{
                      width: '52px',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: isWin ? '#f59e0b' : 'hsl(var(--foreground))',
                    }}
                  >
                    {isWin ? <Trophy className="w-4 h-4 inline" style={{ color: '#f59e0b' }} /> : pos}
                  </span>

                  {/* Tournament name — 14px, weight 500 */}
                  <span className="text-foreground flex-1 min-w-0 truncate group-hover:text-primary transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
                    {result.tournament_name}
                  </span>

                  {/* Date — 12px, weight 500 */}
                  <span className="text-muted-foreground shrink-0" style={{ fontSize: '12px', fontWeight: 500, width: '56px', textAlign: 'right' }}>
                    {result.tournament_end_date
                      ? format(new Date(result.tournament_end_date), 'MMM d')
                      : '—'}
                  </span>

                  {/* Score — 14px, weight 700 */}
                  <span
                    className="shrink-0"
                    style={{
                      width: '40px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: score !== null && score < 0
                        ? '#f59e0b'
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
              className="mt-4 w-full flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all min-h-[44px]"
              style={{ fontSize: '14px', fontWeight: 600 }}
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