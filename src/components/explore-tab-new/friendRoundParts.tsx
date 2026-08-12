import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChartNoAxesColumn } from 'lucide-react';
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

/**
 * INSIGHT LINE TYPE (BRIEF_FRIENDS_CARD_HEIGHT_AND_ROW).
 * One source for the size/leading so the two-line reserve is COMPUTED from the
 * type rather than guessed in px, and the card and the sheet row agree.
 */
export const INSIGHT_FONT_SIZE = 11.5;
export const INSIGHT_LINE_HEIGHT = 1.3;
export const INSIGHT_TWO_LINE_RESERVE = INSIGHT_FONT_SIZE * INSIGHT_LINE_HEIGHT * 2;

/** Two-line clamp for the insight text — the third line is dropped by design. */
export const INSIGHT_CLAMP = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

/**
 * The insight line's CATEGORY MARKER — a single small inline glyph, one for
 * every insight kind. Not decoration and not a golf motif: the row's other
 * lines are WHO and WHERE, this one is the analytical line and says so.
 */
export function InsightGlyph() {
  return (
    <ChartNoAxesColumn
      size={10}
      strokeWidth={2.5}
      aria-hidden
      // Aligned to the first line's CAP HEIGHT, not its baseline: a glyph on the
      // baseline of a 600-weight line sits visually low.
      style={{ flexShrink: 0, color: A.DIM, marginRight: 6, display: 'inline-block', verticalAlign: '-0.5px', transform: 'translateY(-0.5px)' }}
    />
  );
}


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
      <span style={{ ...FIGS, fontSize: 12.5, fontWeight: 700, color: mv.tone }}>
        {mv.arrow}{mv.figure}
      </span>
      <span
        style={{
          fontSize: 6.5,
          fontWeight: 700,
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

// ===========================================================================
// THE INSIGHT SET (BRIEF_FRIENDS_INSIGHT_SET)
//
// One line per round, chosen from eleven states in strict precedence: the
// rarest true thing wins. Every state is a claim we can prove from the round's
// own stats or the friend's history at that course — nothing is inferred, and a
// state that cannot be proven is skipped rather than softened.
//
// DEDUPLICATION. A rail of five cards all saying "Their best here" reads like a
// template, so each kind may appear at most twice down one rail; a third
// occurrence falls through to the next state that resolves. Precedence is
// unchanged — only repetition is capped.
// ===========================================================================

export type InsightKind =
  | 'record'
  | 'ace'
  | 'albatross'
  | 'first_sub_80'
  | 'best_here'
  | 'nines'
  | 'bogey_free'
  | 'run'
  | 'haul'
  | 'vs_avg'
  | 'first_here';

export interface RoundInsight {
  kind: InsightKind;
  text: string;
}

type T = (k: string, o?: Record<string, unknown>) => string;

/** Max appearances of one kind down a single rail / sheet. */
const KIND_CAP = 2;

/** The two nines must differ by this many shots before the split is a story. */
const NINES_MIN_SPREAD = 4;

const BIRDIE_RUN_MIN = 3;
const PAR_RUN_MIN = 9;

/** "7th", "3rd" — English ordinals for hole numbers inside the copy. */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "Level" / "2 under" / "3 over" — the nine fragment. */
function nineFragment(toPar: number, t: T): string {
  if (toPar === 0) return t('discover.friendsRail.insight.parLevel', { defaultValue: 'Level' });
  return toPar < 0
    ? t('discover.friendsRail.insight.parUnder', { defaultValue: '{{n}} under', n: Math.abs(toPar) })
    : t('discover.friendsRail.insight.parOver', { defaultValue: '{{n}} over', n: toPar });
}

/** Ordered candidate list for one round; the caller picks the first allowed. */
function candidatesFor(row: FriendRoundRow, t: T): RoundInsight[] {
  const out: RoundInsight[] = [];
  const push = (kind: InsightKind, text: string) => out.push({ kind, text });

  // 1. A guarded, current course record.
  if (row.is_course_record) {
    push('record', t('discover.friendsRail.insight.record', { defaultValue: 'A new course record here' }));
  }

  // 2. Hole in one — with the hole when the card tells us which.
  if (Number(row.holes_in_one ?? 0) >= 1) {
    push(
      'ace',
      row.ace_hole != null
        ? t('discover.friendsRail.insight.aceAtHole', {
            defaultValue: 'A hole in one at the {{hole}}',
            hole: ordinal(row.ace_hole),
          })
        : t('discover.friendsRail.insight.ace', { defaultValue: 'A hole in one' }),
    );
  }

  // 3. Albatross.
  if (Number(row.albatrosses ?? 0) >= 1) {
    push(
      'albatross',
      row.albatross_hole != null
        ? t('discover.friendsRail.insight.albatrossAtHole', {
            defaultValue: 'An albatross at the {{hole}}',
            hole: ordinal(row.albatross_hole),
          })
        : t('discover.friendsRail.insight.albatross', { defaultValue: 'An albatross' }),
    );
  }

  // 4. Their first round under 80, ever.
  if (row.is_first_sub_80) {
    push('first_sub_80', t('discover.friendsRail.insight.firstSub80', {
      defaultValue: 'Their first round under 80',
    }));
  }

  // 5. Their best at this course — needs a history to be best OF.
  if (
    row.gross != null &&
    row.best_here != null &&
    row.rounds_here != null &&
    row.rounds_here > 1 &&
    row.gross <= row.best_here
  ) {
    push('best_here', t('discover.friendsRail.bestHere', {
      defaultValue: 'Their best here, of {{count}} rounds',
      count: row.rounds_here,
    }));
  }

  // 6. Two different nines. Only when the spread is wide enough to be a story.
  if (row.front_nine_to_par != null && row.back_nine_to_par != null) {
    const spread = Math.abs(row.front_nine_to_par - row.back_nine_to_par);
    if (spread >= NINES_MIN_SPREAD) {
      push('nines', t('discover.friendsRail.insight.nines', {
        defaultValue: '{{front}} after nine, then {{back}} coming home',
        front: nineFragment(row.front_nine_to_par, t),
        back: nineFragment(row.back_nine_to_par, t).toLowerCase(),
      }));
    }
  }

  // 7. Bogey free.
  if (row.clean_card === true) {
    push('bogey_free', t('discover.friendsRail.insight.bogeyFree', { defaultValue: 'A bogey-free card' }));
  }

  // 8. A run — birdies first, then a long stretch of par or better.
  const birdieRun = Number(row.longest_birdie_run ?? 0);
  const parRun = Number(row.longest_par_or_better_run ?? 0);
  if (birdieRun >= BIRDIE_RUN_MIN) {
    push('run', t('discover.friendsRail.insight.birdieRun', {
      defaultValue: '{{count}} birdies in a row',
      count: birdieRun,
    }));
  } else if (parRun >= PAR_RUN_MIN) {
    push('run', t('discover.friendsRail.insight.parRun', {
      defaultValue: '{{count}} holes in par or better',
      count: parRun,
    }));
  }

  // 9. A haul — eagles outrank birdies.
  const eagles = Number(row.eagles ?? 0);
  const birdies = Number(row.birdies ?? 0);
  if (eagles >= 1) {
    push('haul', t('discover.friendsRail.insight.eagles', {
      defaultValue: '{{count}} eagles',
      count: eagles,
    }));
  } else if (birdies >= 4) {
    push('haul', t('discover.friendsRail.insight.birdies', {
      defaultValue: '{{count}} birdies',
      count: birdies,
    }));
  }

  // 10. Against their own average here.
  if (row.gross != null && row.avg_gross_here != null && (row.rounds_here ?? 0) > 1) {
    const d = Math.round((row.avg_gross_here - row.gross) * 10) / 10;
    if (Math.abs(d) >= 0.05) {
      const figure = Math.abs(d).toFixed(1);
      push(
        'vs_avg',
        d > 0
          ? t('discover.friendsRail.betterThanAvg', {
              defaultValue: '{{figure}} better than their average here',
              figure,
            })
          : t('discover.friendsRail.worseThanAvg', {
              defaultValue: '{{figure}} worse than their average here',
              figure,
            }),
      );
    }
  }

  // 11. Their first visit.
  if (row.rounds_here === 1) {
    push('first_here', t('discover.friendsRail.firstHere', { defaultValue: 'Their first round here' }));
  }

  return out;
}

/**
 * Resolve one insight per round across a list, applying the repetition cap in
 * list order. Rounds with nothing true get no line at all — the caller renders
 * nothing rather than a dash.
 */
export function buildInsightMap(
  rows: FriendRoundRow[],
  t: T,
): Map<string, RoundInsight> {
  const used = new Map<InsightKind, number>();
  const out = new Map<string, RoundInsight>();
  for (const row of rows) {
    const candidates = candidatesFor(row, t);
    let chosen = candidates.find((c) => (used.get(c.kind) ?? 0) < KIND_CAP);
    // Everything this round can say is already saturated — say the rarest
    // anyway rather than leaving the card mute.
    if (!chosen && candidates.length > 0) chosen = candidates[0];
    if (!chosen) continue;
    used.set(chosen.kind, (used.get(chosen.kind) ?? 0) + 1);
    out.set(row.round_id, chosen);
  }
  return out;
}

/** Single-row resolution, for surfaces that render one card in isolation. */
export function insightFor(row: FriendRoundRow, t: T): RoundInsight | null {
  return candidatesFor(row, t)[0] ?? null;
}
