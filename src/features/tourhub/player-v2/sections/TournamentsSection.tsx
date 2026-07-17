/**
 * TournamentsSection — season history rows in schedule grammar.
 *
 * Date block (day 18/200 over month 7.5/800; gold when isAnyMajor),
 * event name 12.5/700 + WIN gold chip + LIVE green chip; right rail:
 * result 12.5/800 + total to-par 11/700. Tap → tournament page with
 * player referrer state. Initial cap = 8 rows (ported from the old
 * PlayerTournamentHistory table), tap to expand to the full 30-row
 * window that usePlayerResults returns.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatMonthShort } from '@/i18n/format';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { tournamentRoute } from '../../routes';
import { isAnyMajor } from '../../utils/majorScope';
import {
  AMBER,
  GOLD_DEEP,
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  INK_MUTE,
  INK_TINT_07,
  LIVE_DOT,
  TOPAR_OVER_LIGHT,
  TOPAR_UNDER_LIGHT,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

interface TournamentsSectionProps {
  results: PlayerTournamentResult[];
  playerName: string;
  liveTournamentId: string | null;
}

const INITIAL_LIMIT = 8;

function fmtPosition(r: PlayerTournamentResult, t: TFunction): string {
  const st = r.status?.toUpperCase();
  if (st === 'CUT' || st === 'MC') return t('player.tournaments.status.mc');
  if (st === 'WD') return t('player.tournaments.status.wd');
  if (st === 'DQ') return t('player.tournaments.status.dq');
  if (r.position === null) return t('player.tournaments.status.noResult');
  if (r.position === 1) return '1';
  return `${r.position_tied ? 'T' : ''}${r.position}`;
}

function fmtScore(s: number | null): string {
  if (s === null) return '';
  if (s === 0) return 'E';
  return s > 0 ? `+${s}` : String(s);
}

export function TournamentsSection({
  results,
  playerName,
  liveTournamentId,
}: TournamentsSectionProps) {
  const { t } = useTranslation('tourhub');
  const [expanded, setExpanded] = useState(false);
  if (results.length === 0) return null;

  const visible = expanded ? results : results.slice(0, INITIAL_LIMIT);
  const canExpand = results.length > INITIAL_LIMIT;

  return (
    <section
      style={{
        background: SURFACE,
        borderTop: `0.5px solid ${INK_TINT_07}`,
        padding: '16px 0 6px',
      }}
    >
      <p
        style={{
          margin: '0 16px 12px',
          fontSize: 10,
          fontWeight: 800,
          color: INK_FAINT,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {t('player.tournaments.eyebrow')}
      </p>

      <div>
        {visible.map((r) => {
          const target = tournamentRoute(r.tournament_id, {
            kind: 'player',
            playerName,
          });
          const status = r.status?.toUpperCase();
          const isMissed = status === 'WD' || status === 'CUT' || status === 'MC' || status === 'DQ';
          const isWin = r.position === 1 && !isMissed;
          const isMajor = r.tournament_name ? isAnyMajor(r.tournament_name) : false;
          const isLive = liveTournamentId === r.tournament_id;
          const pos = fmtPosition(r);
          const dt = r.tournament_end_date ? new Date(r.tournament_end_date) : null;
          const day = dt ? String(dt.getDate()) : '';
          const month = dt ? formatMonthShort(dt).toUpperCase() : '';
          const scoreStr = fmtScore(r.score);
          const scoreColor = isMissed
            ? INK_FAINT
            : typeof r.score === 'number' && r.score < 0
            ? TOPAR_UNDER_LIGHT
            : typeof r.score === 'number' && r.score > 0
            ? TOPAR_OVER_LIGHT
            : INK_MUTE;

          return (
            <Link
              key={r.id}
              to={target.to}
              state={target.state}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderTop: `0.5px solid ${HAIRLINE_INK_8}`,
                textDecoration: 'none',
                color: INK,
              }}
              className="active:bg-black/[0.02] transition-colors"
            >
              {/* Date block */}
              <div style={{ width: 40, flexShrink: 0, textAlign: 'center' as const }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 200,
                    letterSpacing: '-0.02em',
                    color: isMajor ? GOLD_DEEP : INK,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {day}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 7.5,
                    fontWeight: 800,
                    color: isMajor ? GOLD_DEEP : INK_FAINT,
                    letterSpacing: '0.14em',
                  }}
                >
                  {month}
                </div>
              </div>

              {/* Name + chips */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      minWidth: 0,
                    }}
                  >
                    {r.tournament_name}
                  </span>
                  {isWin && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${AMBER}22`,
                        color: GOLD_DEEP,
                        fontSize: 8.5,
                        fontWeight: 800,
                        letterSpacing: '0.10em',
                      }}
                    >
                      WIN
                    </span>
                  )}
                  {isLive && (
                    <span
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(34,197,94,0.12)',
                        color: LIVE_DOT,
                        fontSize: 8.5,
                        fontWeight: 800,
                        letterSpacing: '0.10em',
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Right rail */}
              <div style={{ textAlign: 'right' as const, flexShrink: 0, minWidth: 44 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: isWin ? GOLD_DEEP : isMissed ? INK_FAINT : INK,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {pos}
                </div>
                {scoreStr && (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 11,
                      fontWeight: 700,
                      color: scoreColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {scoreStr}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {canExpand && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            width: '100%',
            padding: '12px 0',
            marginTop: 0,
            fontSize: 11.5,
            fontWeight: 800,
            color: INK,
            background: SLATE_50,
            border: 'none',
            borderTop: `0.5px solid ${HAIRLINE_INK_8}`,
            cursor: 'pointer',
            letterSpacing: '-0.005em',
          }}
          className="active:opacity-60 transition-opacity"
        >
          Full season ›
        </button>
      )}
    </section>
  );
}
