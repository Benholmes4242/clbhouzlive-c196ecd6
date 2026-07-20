/**
 * TheClass — full alumni roster.
 *
 * Column header row: # · PLAYER · EARNINGS (W column removed 2026-07-17).
 * Rows ranked by earnings desc. Star rule (amber row wash + name weight
 * 800 + amber earnings) ported verbatim from the old AlumniDepthChart:
 *   (world_ranking > 0 && world_ranking <= 50) || wins >= 1  → STAR
 *
 * Subline always renders: {pos} · {event} when in a field this week (from
 * useThisWeekAlumni — same source as ThisWeek), otherwise "Off this week"
 * at 38% ink. Crown chip appears beside the name when wins > 0. Earnings
 * column shows SEASON micro-caps; null earnings collapse to a tour tag
 * chip drawn from the player's tour_codes.
 *
 * Rank 1 gains the champion tint (linear-gradient) and an amber rank
 * numeral; live dot preserved via useLivePlayerIds.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { countryFlag, countryFallback } from '@/features/tourhub/leaderboard/countryFlag';
import { playerRoute } from '@/features/tourhub/routes';
import { useLivePlayerIds } from '@/features/tourhub/players-v2/data/useLivePlayerIds';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useCollegeRoster, type RosterAlumnus } from '../data/useCollegeRoster';
import { useThisWeekAlumni } from '../data/useThisWeekAlumni';
import { Skeleton } from '@/components/ui/skeleton';

const AMBER_WASH = 'rgba(247,147,30,0.045)';
const AMBER_DEEP = '#c97a10';
const CHAMPION_TINT = 'linear-gradient(100deg, rgba(255,255,255,0.5), #fff6e8)';
const CROWN_BG = 'rgba(232,181,48,0.16)';
const CROWN_BORDER = 'rgba(232,181,48,0.35)';
const CROWN_INK = '#8A6400';
const TAG_BG = 'rgba(15,23,42,0.05)';
const OFF_INK = 'rgba(15,23,42,0.38)';

function isStar(a: RosterAlumnus): boolean {
  const rank = a.worldRanking ?? 0;
  const wins = a.wins ?? 0;
  if (rank > 0 && rank <= 50) return true;
  if (wins >= 1) return true;
  return false;
}

interface Props {
  slug: string;
  collegeName: string;
}

export function TheClass({ slug, collegeName }: Props) {
  const { data: roster = [], isLoading, isError, refetch } = useCollegeRoster(slug);
  const { data: liveMap = {} } = useLivePlayerIds();
  const { data: weekRows = [] } = useThisWeekAlumni(slug);

  // Index this-week rows by playerId (first entry wins — sorted live-first).
  const weekByPlayer = useMemo(() => {
    const m = new Map<string, (typeof weekRows)[number]>();
    for (const r of weekRows) {
      if (!m.has(r.playerId)) m.set(r.playerId, r);
    }
    return m;
  }, [weekRows]);

  const sorted = [...roster].sort((a, b) => {
    const sa = isStar(a) ? 1 : 0;
    const sb = isStar(b) ? 1 : 0;
    if (sa !== sb) return sb - sa;
    return b.earnings - a.earnings;
  });

  return (
    <section style={{ background: SURFACE, fontFamily: FONT }}>
      {/* Section head */}
      <header
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_FAINT,
          }}
        >
          The Class
        </div>
      </header>

      {/* Column header (W column removed) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          borderTop: `0.5px solid ${HAIRLINE_INK_10}`,
          borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
          background: 'rgba(15,23,42,0.02)',
        }}
      >
        <span style={{ width: 22, fontSize: 10, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          #
        </span>
        <span style={{ flex: 1, marginLeft: 8, fontSize: 10, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Player
        </span>
        <span style={{ width: 78, textAlign: 'right', fontSize: 10, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Earnings
        </span>
        <span style={{ width: 14 }} />
      </div>

      {/* Skeleton */}
      {isLoading && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
              }}
            >
              <Skeleton style={{ width: 22, height: 12, borderRadius: 3 }} />
              <Skeleton style={{ width: 34, height: 34, borderRadius: '34%' }} />
              <Skeleton style={{ flex: 1, height: 12, borderRadius: 3 }} />
              <Skeleton style={{ width: 78, height: 12, borderRadius: 3 }} />
            </div>
          ))}
        </>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK_FAINT, marginBottom: 10 }}>
            Couldn't load the roster.
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            style={{ background: INK, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div style={{ padding: '32px 16px', fontSize: 12, fontWeight: 600, color: INK_FAINT, textAlign: 'center' }}>
          No alumni found for this program.
        </div>
      )}

      {!isLoading && !isError &&
        sorted.map((a, idx) => {
          const star = isStar(a);
          const isChampion = idx === 0;
          const live = liveMap[a.id];
          const week = weekByPlayer.get(a.id);
          const hasWins = (a.wins ?? 0) > 0;
          const hasEarnings = (a.earnings ?? 0) > 0;
          const flag = countryFlag(a.country) ?? (a.country ? countryFallback(a.country) : null);
          const tourTag = (a.tourCodes?.[0] ?? '').toUpperCase();

          // Subline: live > this-week entry > "Off this week"
          let subline: React.ReactNode = null;
          let sublineColor = OFF_INK;
          if (live) {
            const posLabel = `${live.positionTied ? 'T' : ''}${live.position ?? ''}`.trim();
            subline = posLabel
              ? `${posLabel} \u00B7 ${live.tournamentName}`
              : live.tournamentName;
            sublineColor = STATUS_LIVE;
          } else if (week) {
            const posLabel =
              week.position != null
                ? `${week.positionTied ? 'T' : ''}${week.position}`
                : null;
            subline = posLabel
              ? `${posLabel} \u00B7 ${week.tournamentName}`
              : week.tournamentName;
            sublineColor = INK_MUTE;
          } else {
            subline = 'Off this week';
            sublineColor = OFF_INK;
          }

          const rowBg = isChampion
            ? CHAMPION_TINT
            : star
            ? AMBER_WASH
            : 'transparent';

          return (
            <Link
              key={a.id}
              {...playerRoute(a.id, { kind: 'college', collegeName })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                background: rowBg,
                textDecoration: 'none',
                color: 'inherit',
              }}
              className="active:bg-black/[0.02]"
            >
              <span
                style={{
                  width: 22,
                  fontSize: 14,
                  fontWeight: isChampion ? 800 : 200,
                  color: isChampion ? AMBER : INK,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {idx + 1}
              </span>

              {/* Avatar + live dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <SquircleAvatar
                  size={34}
                  srcCandidates={getPlayerHeadshotCandidates(a.fullName, a.tourCodes?.[0] ?? 'pga')}
                  alt={a.fullName}
                  hairlineRing
                  ringColor="rgba(15,23,42,0.12)"
                />
                {live && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_LIVE,
                      boxShadow: '0 0 0 1.5px #FFFFFF',
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: star ? 800 : 700,
                    color: INK,
                    letterSpacing: '-0.005em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {a.fullName}
                  </span>
                  {flag && (
                    <span style={{ fontSize: 11, lineHeight: 1, flexShrink: 0 }} aria-hidden>
                      {flag}
                    </span>
                  )}
                  {hasWins && (
                    <span
                      aria-label={`${a.wins} win${a.wins === 1 ? '' : 's'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '1.5px 5px',
                        borderRadius: 999,
                        background: CROWN_BG,
                        border: `0.5px solid ${CROWN_BORDER}`,
                        color: CROWN_INK,
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      <Crown size={9} strokeWidth={2.4} />
                      {a.wins}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 1,
                    fontSize: 10,
                    fontWeight: live ? 700 : 600,
                    color: sublineColor,
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {subline}
                </div>
              </div>

              {/* Earnings / tour tag */}
              <div
                style={{
                  width: 78,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                {hasEarnings ? (
                  <>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: star ? AMBER_DEEP : INK,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {formatCurrency(a.earnings)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: INK_FAINT,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Season
                    </span>
                  </>
                ) : tourTag ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: TAG_BG,
                      color: INK_MUTE,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tourTag}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: TAG_BG,
                      color: INK_MUTE,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Tour
                  </span>
                )}
              </div>

              <ChevronRight size={14} strokeWidth={2} color={INK_FAINT} />
            </Link>
          );
        })}
    </section>
  );
}
