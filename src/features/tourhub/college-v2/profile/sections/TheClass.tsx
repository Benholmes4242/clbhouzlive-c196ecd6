/**
 * TheClass — full alumni roster.
 *
 * Column header PLAYER · W · EARNINGS. Rows ranked by earnings desc.
 * Star rule ported verbatim from the old AlumniDepthChart classifier:
 *   (world_ranking > 0 && world_ranking <= 50) || wins >= 1  → STAR
 * Stars carry the amber row wash rgba(247,147,30,0.045) + amber earnings
 * + name weight 800. Live dot uses useLivePlayerIds. Rows link to the
 * player profile via playerRoute.
 *
 * Compare CTA in the header uses collegeH2HRoute(slug) — the existing
 * /tourhub/college-golf/compare?c1= route contract.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { countryFlag, countryFallback } from '@/features/tourhub/leaderboard/countryFlag';
import { playerRoute } from '@/features/tourhub/routes';
import { useLivePlayerIds } from '@/features/tourhub/players-v2/data/useLivePlayerIds';
import {
  AMBER,
  FONT,
  GOLD,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useCollegeRoster, type RosterAlumnus } from '../data/useCollegeRoster';

const AMBER_WASH = 'rgba(247,147,30,0.045)';
const AMBER_DEEP = '#c97a10';

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
  const { data: roster = [], isLoading } = useCollegeRoster(slug);
  const { data: liveMap = {} } = useLivePlayerIds();

  const sorted = [...roster].sort((a, b) => {
    const sa = isStar(a) ? 1 : 0;
    const sb = isStar(b) ? 1 : 0;
    if (sa !== sb) return sb - sa;
    return b.earnings - a.earnings;
  });

  return (
    <section style={{ background: SURFACE, fontFamily: FONT }}>
      {/* Section head + compare action */}
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
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: AMBER,
          }}
        >
          The Class
        </div>
      </header>

      {/* Column header */}
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
        <span style={{ width: 22, fontSize: 8, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          #
        </span>
        <span style={{ flex: 1, marginLeft: 8, fontSize: 8, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Player
        </span>
        <span style={{ width: 28, textAlign: 'center', fontSize: 8, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          W
        </span>
        <span style={{ width: 78, textAlign: 'right', fontSize: 8, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
              <div style={{ width: 22, height: 12, background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ width: 34, height: 34, borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ flex: 1, height: 12, background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ width: 28, height: 12, background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ width: 78, height: 12, background: 'rgba(15,23,42,0.06)' }} />
            </div>
          ))}
        </>
      )}

      {/* Rows */}
      {!isLoading && sorted.length === 0 && (
        <div style={{ padding: '32px 16px', fontSize: 12, fontWeight: 600, color: INK_FAINT, textAlign: 'center' }}>
          No alumni found for this program.
        </div>
      )}

      {!isLoading &&
        sorted.map((a, idx) => {
          const star = isStar(a);
          const live = liveMap[a.id];
          const hasWins = (a.wins ?? 0) > 0;
          const hasEarnings = (a.earnings ?? 0) > 0;
          const flag = countryFlag(a.country) ?? (a.country ? countryFallback(a.country) : null);
          const posLabel = live
            ? `${live.positionTied ? 'T' : ''}${live.position ?? ''}`.trim()
            : null;

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
                background: star ? AMBER_WASH : 'transparent',
                textDecoration: 'none',
                color: 'inherit',
              }}
              className="active:bg-black/[0.02]"
            >
              <span
                style={{
                  width: 22,
                  fontSize: 14,
                  fontWeight: 200,
                  color: INK,
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
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
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
                </div>
                {live && (
                  <div
                    style={{
                      marginTop: 1,
                      fontSize: 10,
                      fontWeight: 700,
                      color: STATUS_LIVE,
                      letterSpacing: '0.02em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {posLabel ? `${posLabel} \u00B7 ${live.tournamentName}` : live.tournamentName}
                  </div>
                )}
              </div>

              <span
                style={{
                  width: 28,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: hasWins ? GOLD : INK_FAINT,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {hasWins ? a.wins : '\u2014'}
              </span>

              <span
                style={{
                  width: 78,
                  textAlign: 'right',
                  fontSize: 12.5,
                  fontWeight: star ? 800 : 200,
                  color: hasEarnings ? (star ? AMBER_DEEP : INK) : INK_FAINT,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.005em',
                  flexShrink: 0,
                }}
              >
                {hasEarnings ? formatCurrency(a.earnings) : '\u2014'}
              </span>

              <ChevronRight size={14} strokeWidth={2} color={INK_FAINT} />
            </Link>
          );
        })}
      {/* Silence unused-var noise (kept for future variants). */}
      <span style={{ display: 'none' }} aria-hidden data-a={AMBER} />
    </section>
  );
}
