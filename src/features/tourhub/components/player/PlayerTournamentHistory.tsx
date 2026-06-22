/**
 * PlayerTournamentHistory - Dispatch-style flat ruled table.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { usePlayerResults, formatPositionShort, formatScore, formatMoney } from '../../hooks/usePlayerResults';
import { tournamentRoute } from '../../routes';
import {
  AMBER,
  AMBER_SOFT_BG,
  INK,
  INK_FAINT,
  INK_MUTE,
  INK_TINT_07,
  SCORE_OVER_PAR_LIGHT,
  SURFACE,
} from '../../_shared/tokens';

interface PlayerTournamentHistoryProps {
  playerId: string;
  /** Player full name — drives the "Back to {Player}" label on the tournament page. */
  playerName: string;
}

export function PlayerTournamentHistory({ playerId, playerName }: PlayerTournamentHistoryProps) {
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
    <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
      {/* Section eyebrow — canonical §6 slate-caps */}
      <div style={{ padding: '14px 16px 8px' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Recent Tournaments
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <>
          {/* Column headers — de-boxed */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', width: '44px', flexShrink: 0 }}>POS</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em' }}>TOURNAMENT</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', width: '40px', textAlign: 'right' as const, flexShrink: 0 }}>DATE</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', width: '36px', textAlign: 'right' as const, flexShrink: 0 }}>SCORE</span>
          </div>

          <div>
            {results.map((result) => {
              const status = result.status?.toUpperCase();
              const isMissed = status === 'WD' || status === 'CUT' || status === 'MC' || status === 'DQ';
              // P7 — win detection is numeric, not string-match against the formatter output.
              // (Rule 28: format changes are interface changes — never string-match formatter output.)
              const isWin = result.position === 1 && !isMissed;
              const pos = formatPositionShort(result.position, result.position_tied, result.status);
              const score = result.score;
              const scoreStr = formatScore(score);
              const displayScore = isMissed ? '—' : scoreStr;
              const scoreColor = isMissed ? INK_FAINT : (typeof score === 'number' && score < 0 ? SCORE_OVER_PAR_LIGHT : INK);

              const navTarget = tournamentRoute(result.tournament_id, {
                kind: 'player',
                playerName,
              });

              return (
                <Link
                  key={result.id}
                  to={navTarget.to}
                  state={navTarget.state}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: `0.5px solid ${INK_TINT_07}`,
                    background: isWin ? AMBER_SOFT_BG : 'transparent',
                    textDecoration: 'none',
                  }}
                  className="active:bg-black/[0.02] transition-colors"
                >
                  {/* Position */}
                  <span style={{ width: '44px', flexShrink: 0, fontSize: '12px', fontWeight: 900, color: isWin ? AMBER : INK, display: 'flex', alignItems: 'center' }}>
                    {isWin ? <Trophy style={{ width: 14, height: 14, color: AMBER }} /> : pos}
                  </span>

                  {/* Tournament name */}
                  <span style={{
                    flex: 1, fontSize: '13px',
                    fontWeight: isWin ? 800 : 600,
                    letterSpacing: isWin ? '-0.01em' : 'normal',
                    color: INK,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {result.tournament_name}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '10px', color: INK_FAINT, width: '40px', textAlign: 'right' as const, flexShrink: 0 }}>
                    {result.tournament_end_date
                      ? format(new Date(result.tournament_end_date), 'MMM d')
                      : '—'}
                  </span>

                  {/* Score */}
                  <span style={{
                    fontSize: '13px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    width: '36px', textAlign: 'right' as const, flexShrink: 0,
                    color: scoreColor,
                  }}>
                    {displayScore}
                  </span>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              style={{ width: '100%', padding: '12px 0', fontSize: '12px', fontWeight: 700, color: INK, background: 'transparent', border: 'none', borderTop: `0.5px solid ${INK_TINT_07}`, cursor: 'pointer' }}
              className="active:opacity-70 transition-opacity"
            >
              {showAll ? 'Show Less' : 'View All Results ›'}
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}
