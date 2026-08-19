/**
 * BRIEF_CLUB_ANALYTICS_TAB §3 — THE VERDICT. This is the product.
 *
 * The rules encoded here:
 *   - IT MUST BE ABLE TO SAY THE CARD IS RIGHT (§3.2). A tool that only ever
 *     finds fault is a tool nobody trusts the second time, and on Sundridge —
 *     our best-data course — "your card holds up" is the true answer.
 *   - IT NAMES ONE HOLE (§3.3), the largest disagreement. Not a list. One
 *     sentence a club secretary can forward.
 *   - IT NEVER SAYS THE CLUB IS WRONG (§3.5). "It plays as your 2nd hardest
 *     hole", never "your stroke index is incorrect".
 *   - BELOW THE FLOOR THE VERB SOFTENS (§5b) — "it looks like" — and the
 *     supporting line calls it a signal rather than a finding.
 */
import type { ClubAnalyticsHole } from './types';
import { EARLY_DATA_FLOOR, SOUND_MAX_DRIFT } from './constants';

export interface HoleDrift extends ClubAnalyticsHole {
  /** |declared - measured|, or null when the hole carries no stroke index. */
  drift: number | null;
}

export type VerdictKind = 'sound' | 'drift' | 'no_index';

export interface Verdict {
  kind: VerdictKind;
  /** The named hole (§3.3). Null for `sound` and `no_index`. */
  hole: HoleDrift | null;
  headline: string;
  support: string;
  /** True below the early-data floor: the verb has been softened. */
  early: boolean;
}

const ORDINALS = [
  '', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th',
  '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th',
];

export function ordinal(n: number): string {
  if (n >= 1 && n < ORDINALS.length) return ORDINALS[n];
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** Attach |declared - measured| to every hole. Holes without a declared index
 *  carry a null drift and are excluded from the verdict — a missing index is
 *  "not measured", not a disagreement of zero. */
export function withDrift(holes: ClubAnalyticsHole[]): HoleDrift[] {
  return holes.map((h) => ({
    ...h,
    drift: h.stroke_index == null ? null : Math.abs(h.stroke_index - h.measured_rank),
  }));
}

export function buildVerdict(holes: ClubAnalyticsHole[], rounds: number): Verdict {
  const early = rounds < EARLY_DATA_FLOOR;
  const rated = withDrift(holes).filter((h) => h.drift != null) as (HoleDrift & { drift: number })[];

  if (rated.length === 0) {
    return {
      kind: 'no_index',
      hole: null,
      early,
      headline: 'No stroke index on the rounds we hold',
      support:
        'The rounds played here have not carried a stroke index, so there is nothing to set the measured ranking against yet. Everything below still stands on its own.',
    };
  }

  const worst = rated.reduce((a, b) => (b.drift > a.drift ? b : a));

  if (worst.drift <= SOUND_MAX_DRIFT) {
    return {
      kind: 'sound',
      hole: null,
      early,
      headline: 'Your card holds up',
      support: early
        ? `On the rounds we hold so far, no hole sits more than ${worst.drift} ${worst.drift === 1 ? 'place' : 'places'} from where your stroke index puts it. Treat that as a signal rather than a finding until more rounds land.`
        : `Across ${rounds.toLocaleString()} measured rounds, no hole sits more than ${worst.drift} ${worst.drift === 1 ? 'place' : 'places'} from where your stroke index puts it. Your ranking matches how the course is actually playing.`,
    };
  }

  // §3.5 — state what the data shows. The club draws the conclusion.
  const verb = early ? 'it looks like' : 'it plays as';
  const declared = worst.stroke_index as number;
  return {
    kind: 'drift',
    hole: worst,
    early,
    headline: `Your ${ordinal(worst.hole_no)} is your stroke index ${declared}, and ${verb} your ${ordinal(worst.measured_rank)} hardest hole.`,
    support: early
      ? `That is drawn from ${worst.rounds.toLocaleString()} played rows on this hole. Treat it as a signal rather than a finding until more rounds land.`
      : `That is the largest disagreement on the course, drawn from ${worst.rounds.toLocaleString()} played rows on this hole.`,
  };
}
