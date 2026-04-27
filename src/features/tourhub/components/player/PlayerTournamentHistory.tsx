/**
 * PlayerTournamentHistory - Dispatch-style flat ruled table.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { usePlayerResults, formatPosition, formatScore, formatMoney } from '../../hooks/usePlayerResults';

interface PlayerTournamentHistoryProps {
  playerId: string;
}

export function PlayerTournamentHistory({ playerId }: PlayerTournamentHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: allResults, isLoading } = usePlayerResults(playerId, 30);

  const INITIAL_LIMIT = 8;
  const results = showAll ? allResults : allResults?.slice(0, INITIAL_LIMIT);
  const hasMore = (allResults?.length ?? 0) > INITIAL_LIMIT;

  // Rule 26 — honest data: omit the entire section when not loading and no results.
  if (!isLoading && (!allResults || allResults.length === 0)) {
    return null;
  }

  return (
    <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Recent Tournaments
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', borderTop: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.02)' }}>
            <span style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', width: '44px', flexShrink: 0 }}>POS</span>
            <span style={{ flex: 1, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em' }}>TOURNAMENT</span>
            <span style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', width: '40px', textAlign: 'right' as const, flexShrink: 0 }}>DATE</span>
            <span style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', width: '36px', textAlign: 'right' as const, flexShrink: 0 }}>SCORE</span>
          </div>

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
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                    borderLeft: isWin ? '3px solid #F7931E' : '3px solid transparent',
                    background: isWin ? 'rgba(247,147,30,0.03)' : 'transparent',
                    textDecoration: 'none',
                  }}
                  className="active:bg-black/[0.02] transition-colors"
                >
                  {/* Position */}
                  <span style={{ width: '44px', flexShrink: 0, fontSize: '12px', fontWeight: 900, color: isWin ? '#F7931E' : '#64748B', display: 'flex', alignItems: 'center' }}>
                    {isWin ? <Trophy style={{ width: 14, height: 14, color: '#F7931E' }} /> : pos}
                  </span>

                  {/* Tournament name */}
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: isWin ? 700 : 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {result.tournament_name}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '10px', color: '#94A3B8', width: '40px', textAlign: 'right' as const, flexShrink: 0 }}>
                    {result.tournament_end_date
                      ? format(new Date(result.tournament_end_date), 'MMM d')
                      : '—'}
                  </span>

                  {/* Score */}
                  <span style={{
                    fontSize: '13px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    width: '36px', textAlign: 'right' as const, flexShrink: 0,
                    color: score !== null && score < 0 ? '#F7931E' : score !== null && score > 0 ? '#DC2626' : '#94A3B8',
                  }}>
                    {scoreStr}
                  </span>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              style={{ width: '100%', padding: '12px 0', fontSize: '12px', fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
              className="active:opacity-70 transition-opacity"
            >
              {showAll ? 'Show Less' : 'View All Results ›'}
            </button>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p style={{ fontWeight: 500, color: '#64748B' }}>No tournament results yet</p>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Results will appear as tournaments are completed
          </p>
        </div>
      )}
    </div>
  );
}
