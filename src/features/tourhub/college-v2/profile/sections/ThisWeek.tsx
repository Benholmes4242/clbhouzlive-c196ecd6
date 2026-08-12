/**
 * ThisWeek - leads with alumni playing / just-played this week.
 *
 * Analytical grammar (BRIEF_TOUR_COLLEGE_PROFILE):
 *   - INK kicker (eyebrows are never amber) with a right-hand sample-size aside.
 *   - Position is plain neutral text in a fixed 44px column, thru label
 *     beneath it in the LABEL token, same colour live or final.
 *   - Score sits in a fixed 46px column and is coloured by the canonical
 *     getScoreColor helper (under RED, level MUTED, over INK).
 *   - No pills, no row hairlines. Separation is whitespace and the grid.
 *
 * Self-hides entirely when there are zero week rows (roster leads instead).
 * Row tap navigates to the tournament page.
 *
 * NOTE: framer-motion is retained deliberately (height animation on a
 * self-hiding section). Flagged for a separate decision.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { tournamentRoute } from '@/features/tourhub/routes';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatTimeHm } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import {
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useThisWeekAlumni, type WeekAlumnusRow } from '../data/useThisWeekAlumni';

interface Props {
  slug: string;
  collegeName: string;
}

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: INK_FAINT,
  fontVariantNumeric: 'tabular-nums lining',
};

function formatPos(row: WeekAlumnusRow): string | null {
  if (row.position == null) return null;
  return `${row.positionTied ? 'T' : ''}${row.position}`;
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
  const { t } = useTranslation('tourhub');
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
          <header
            style={{
              padding: '16px 16px 8px',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={KICKER_STYLE}>{t('college.profile.thisWeek')}</div>
            <div style={LABEL_STYLE}>
              {t('college.profile.thisWeekAside', { count: rows.length })}
            </div>
          </header>

          {rows.map((row) => {
            const pos = formatPos(row);
            const scoreVal = row.today ?? row.score;
            const hasScore = scoreVal != null;
            const scoreStr = hasScore ? fmtScore(scoreVal) : null;
            const isFinal = !row.isLive && hasScore;
            const teeStr = !hasScore ? formatTee(row.teeTime) : null;
            const microThru = row.isLive
              ? row.thru != null
                ? t('college.profile.thru', { n: row.thru >= 18 ? 'F' : row.thru })
                : null
              : isFinal
              ? t('college.profile.final')
              : null;

            return (
              <Link
                key={`${row.playerId}-${row.tournamentId}`}
                {...tournamentRoute(row.tournamentId, { kind: 'college', collegeName })}
                onClick={() => {
                  analyticsEvents.track('tour_college_week_row_tapped', {
                    slug,
                    player_id: row.playerId,
                    tournament_id: row.tournamentId,
                    is_live: !!row.isLive,
                    position: row.position ?? null,
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
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
                      fontSize: 13,
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
                      fontSize: 11.5,
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

                {/* Fixed position / thru column */}
                <div style={{ width: 44, flex: '0 0 44px', textAlign: 'right' }}>
                  {hasScore ? (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: INK_MUTE,
                          fontVariantNumeric: 'tabular-nums lining',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {pos ?? ''}
                      </div>
                      {microThru && <div style={{ ...LABEL_STYLE, marginTop: 5 }}>{microThru}</div>}
                    </>
                  ) : (
                    <div style={LABEL_STYLE}>{t('college.profile.teeTime')}</div>
                  )}
                </div>

                {/* Fixed score column */}
                <div style={{ width: 46, flex: '0 0 46px', textAlign: 'right' }}>
                  {hasScore ? (
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: getScoreColor(scoreVal, 'light'),
                        fontVariantNumeric: 'tabular-nums lining',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {scoreStr}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        fontVariantNumeric: 'tabular-nums lining',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {teeStr ?? t('college.profile.teeTbd')}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
