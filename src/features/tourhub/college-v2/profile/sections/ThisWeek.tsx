/**
 * ThisWeek — leads with alumni playing / just-played this week.
 *
 * Right-side lockup per the 2026-07-17 brief:
 *   - has a score  → position pill (green if live, neutral if final) +
 *                    to-par 17/800 tabular (red when negative) + micro-caps
 *                    "THRU {n}" / "FINAL" beneath.
 *   - no score yet → tee-time 13/700 + "TEE TIME" micro-caps.
 * Event subline is muted 12/500 — no position/thru duplication.
 *
 * Self-hides entirely when there are zero week rows (roster leads instead).
 * Row tap navigates to the tournament page.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { tournamentRoute } from '@/features/tourhub/routes';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatTimeHm } from '@/i18n/format';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useThisWeekAlumni, type WeekAlumnusRow } from '../data/useThisWeekAlumni';

interface Props {
  slug: string;
  collegeName: string;
}

const NEG_RED = '#D2222D';
const PILL_LIVE_BG = 'rgba(34,197,94,0.10)';
const PILL_LIVE_FG = '#16A34A';
const PILL_FINAL_BG = 'rgba(15,23,42,0.05)';
const PILL_FINAL_FG = 'rgba(15,23,42,0.55)';

function formatPos(row: WeekAlumnusRow): string | null {
  if (row.position == null) return null;
  return `${row.positionTied ? 'T' : ''}${row.position}`;
}

function fmtScore(n: number | null): string | null {
  if (n == null) return null;
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

function formatTee(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return formatTimeHm(new Date(iso)).toUpperCase();
  } catch {
    return null;
  }
}

export function ThisWeek({ slug, collegeName }: Props) {
  const { data } = useThisWeekAlumni(slug);
  const rows = data ?? [];
  const show = rows.length > 0;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          key="this-week"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: SURFACE, fontFamily: FONT, overflow: 'hidden' }}
        >
      <header style={{ padding: '16px 16px 8px' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_FAINT,
          }}
        >
          This Week
        </div>
      </header>
      {rows.map((row) => {
        const pos = formatPos(row);
        const scoreVal = row.today ?? row.score;
        const scoreStr = fmtScore(scoreVal);
        const hasScore = scoreStr != null;
        const isNeg = typeof scoreVal === 'number' && scoreVal < 0;
        const isFinal = !row.isLive && hasScore;
        const teeStr = !hasScore ? formatTee(row.teeTime) : null;
        const microThru = row.isLive
          ? (row.thru != null ? `THRU ${row.thru >= 18 ? 'F' : row.thru}` : null)
          : (isFinal ? 'FINAL' : null);

        return (
          <Link
            key={`${row.playerId}-${row.tournamentId}`}
            {...tournamentRoute(row.tournamentId, { kind: 'college', collegeName })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderTop: `0.5px solid ${HAIRLINE_INK_10}`,
              textDecoration: 'none',
              color: 'inherit',
            }}
            className="active:bg-black/[0.02]"
          >
            <SquircleAvatar
              size={30}
              srcCandidates={getPlayerHeadshotCandidates(row.fullName, row.tourCodes?.[0] ?? 'pga')}
              alt={row.fullName}
              hairlineRing
              ringColor="rgba(15,23,42,0.12)"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.fullName}
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  color: INK_MUTE,
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.tournamentName}
              </div>
            </div>

            {/* Right-side lockup */}
            {hasScore ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {pos && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 999,
                        background: row.isLive ? PILL_LIVE_BG : PILL_FINAL_BG,
                        color: row.isLive ? PILL_LIVE_FG : PILL_FINAL_FG,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {pos}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: isNeg ? NEG_RED : INK,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {scoreStr}
                  </span>
                </div>
                {microThru && (
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: row.isLive ? STATUS_LIVE : INK_FAINT,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {microThru}
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {teeStr ?? 'TBD'}
                </span>
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: INK_FAINT,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Tee Time
                </span>
              </div>
            )}
          </Link>
        );
      })}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
