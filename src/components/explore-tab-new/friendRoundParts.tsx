import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, TOPAR_RED, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import type { FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';

/**
 * Shared parts for the Discover friends surfaces (BRIEF_UNDER_PAR_RED, part 2).
 *
 *  - the gross gets a reference point: to-par (coloured by the canonical
 *    convention: under par RED, over par INK, level a muted "E") and PAR n
 *  - the index movement is a MOVEMENT, not a score: arrow + figure coloured
 *    (improved GREEN / drifted RED, per BRIEF_INDEX_DELTA_COLOUR), the word in
 *    LABEL/DIM. No tint, no capsule.
 *  - the personal reference line resolves in priority order, and is OMITTED
 *    rather than dashed when nothing resolves.
 */

export const MOVEMENT_FLOOR = 0.05;

export function toParFor(row: FriendRoundRow): { text: string; tone: string } | null {
  if (row.gross == null || row.course_par == null) return null;
  const d = row.gross - row.course_par;
  if (d > 0) return { text: `+${d}`, tone: A.INK };
  if (d < 0) return { text: `\u2212${Math.abs(d)}`, tone: TOPAR_RED };
  return { text: 'E', tone: A.MUTE };
}

/**
 * Index movement — coloured GREEN when improved, RED when drifted, matching the
 * light analytical index-delta convention (A.IMPROVED / A.DRIFTED, the shared INDEX_DELTA light pair).
 * Null below the 0.05 floor.
 */
export function movementFor(
  row: FriendRoundRow,
): { arrow: string; figure: string; tone: string } | null {
  const d = row.hcp_delta;
  if (d == null || Math.abs(d) < MOVEMENT_FLOOR) return null;
  return {
    arrow: d < 0 ? '\u2193' : '\u2191',
    figure: Math.abs(d).toFixed(1),
    tone: d < 0 ? A.IMPROVED : A.DRIFTED,
  };
}

export function IndexMovement({ row }: { row: FriendRoundRow }) {
  const { t } = useTranslation('courses');
  const mv = movementFor(row);
  if (!mv) return null;
  return (
    <span
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ ...FIGS, fontSize: 12, fontWeight: 800, color: mv.tone }}>
        {mv.arrow} {mv.figure}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: A.DIM,
        }}
      >
        {t('discover.friendsRail.index', 'HCP')}
      </span>
    </span>
  );
}

/**
 * The personal reference sentence, first that resolves:
 *   a. their best here, of n rounds
 *   b. d better / worse than their average here
 *   c. their first round here
 *   d. nothing (caller renders no line)
 */
export function referenceLine(
  row: FriendRoundRow,
  t: (k: string, o?: Record<string, unknown>) => string,
): string | null {
  const { gross, rounds_here, best_here, avg_gross_here } = row;
  if (gross == null || rounds_here == null || rounds_here <= 0) return null;

  if (rounds_here === 1) {
    return t('discover.friendsRail.firstHere', { defaultValue: 'Their first round here' });
  }

  if (best_here != null && gross <= best_here) {
    return t('discover.friendsRail.bestHere', {
      defaultValue: 'Their best here, of {{count}} rounds',
      count: rounds_here,
    });
  }

  if (avg_gross_here != null) {
    const d = Math.round((avg_gross_here - gross) * 10) / 10;
    if (Math.abs(d) >= 0.05) {
      const figure = Math.abs(d).toFixed(1);
      return d > 0
        ? t('discover.friendsRail.betterThanAvg', {
            defaultValue: '{{figure}} better than their average here',
            figure,
          })
        : t('discover.friendsRail.worseThanAvg', {
            defaultValue: '{{figure}} worse than their average here',
            figure,
          });
    }
  }

  return null;
}
