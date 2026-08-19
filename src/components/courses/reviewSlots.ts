/**
 * REVIEW SLOTS on the Courses browse (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL).
 *
 * A review is DECISION content: it earns its place where someone is choosing
 * where to play. This module owns the two things that must be deterministic —
 * WHERE a slot goes and WHICH reviews it gets — so both are pure functions of
 * (pool, rows loaded) and nothing here reads a clock or a random source. A list
 * that rearranges itself on every load has no shape a member can learn, and it
 * breaks scroll restoration.
 *
 * The DATA comes from useBrowseReviews (country/region scoped, newest first).
 */

import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

/** The first slot sits after card 2, then every 20 cards, alternating. */
export const FIRST_SLOT_AFTER = 2;
export const SLOT_STRIDE = 20;

/** Prose bars. Below these a slot's typography looks lost, so it is not used. */
export const RAIL_MIN_CHARS = 60;
export const FEATURED_MIN_CHARS = 200;

/** Cards in the rail. Three fits the 244px card at every supported width. */
export const RAIL_COUNT = 3;

export type ReviewSlotKind = 'rail' | 'featured';

export interface ReviewSlot {
  /** Card ordinal this slot renders after (1-based). */
  after: number;
  kind: ReviewSlotKind;
  reviews: LatestReview[];
}

const prose = (r: LatestReview) => String(r.quote ?? '').trim();

export function eligibleForRail(r: LatestReview): boolean {
  return prose(r).length > RAIL_MIN_CHARS;
}

/**
 * The featured bar is HIGHER on purpose: a 70-character review at 15px full
 * width looks lost, and a missing sub-score would render a broken four-up.
 */
export function eligibleForFeatured(r: LatestReview): boolean {
  if (prose(r).length <= FEATURED_MIN_CHARS) return false;
  const b = r.breakdown;
  return (
    b?.design != null &&
    b?.conditions != null &&
    b?.clubhouse != null &&
    b?.facilities != null
  );
}

/**
 * THE POSITIONS AND THE CONSUMPTION, in one pass.
 *
 *   after card 2   rail       after card 20  featured
 *   after card 40  rail       after card 60  featured   ...alternating
 *
 * Reviews are consumed NEWEST FIRST off one shared pool with a used-set, so a
 * member can never meet the same review twice on one page. When the pool can no
 * longer fill a slot the slots simply STOP — no recycling, no placeholder, no
 * empty state. The list continues as a list.
 */
export function allocateReviewSlots(
  pool: LatestReview[],
  rowsLoaded: number,
): Map<number, ReviewSlot> {
  const slots = new Map<number, ReviewSlot>();
  if (rowsLoaded < FIRST_SLOT_AFTER || pool.length === 0) return slots;

  const used = new Set<string>();
  const take = (kind: ReviewSlotKind, count: number): LatestReview[] => {
    const test = kind === 'rail' ? eligibleForRail : eligibleForFeatured;
    const picked: LatestReview[] = [];
    for (const r of pool) {
      if (picked.length === count) break;
      if (used.has(r.reviewId)) continue;
      if (!test(r)) continue;
      picked.push(r);
    }
    // A slot is filled or it is not shown. A rail of two is a different design.
    if (picked.length < count) return [];
    for (const r of picked) used.add(r.reviewId);
    return picked;
  };

  /**
   * 2, 20, 40, 60, ... — the stride is measured from card 20, not from card 2:
   * the first slot is pulled forward so two cards land before any voice, and
   * only the SECOND step is short.
   */
  const positions: number[] = [FIRST_SLOT_AFTER];
  for (let after = SLOT_STRIDE; after <= rowsLoaded; after += SLOT_STRIDE) {
    positions.push(after);
  }

  positions.forEach((after, index) => {
    if (after > rowsLoaded) return;
    if (index > 0 && !slots.has(positions[index - 1])) return; // slots stopped
    const kind: ReviewSlotKind = index % 2 === 0 ? 'rail' : 'featured';
    const reviews = take(kind, kind === 'rail' ? RAIL_COUNT : 1);
    if (reviews.length === 0) return; // pool exhausted for this kind — stop.
    slots.set(after, { after, kind, reviews });
  });

  return slots;
}
