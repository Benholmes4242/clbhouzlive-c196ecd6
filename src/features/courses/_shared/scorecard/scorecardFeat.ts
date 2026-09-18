import type React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE SCORECARD FEAT BAND (BRIEF S7, 18 Sep 2026).
 *
 * The old honours metal was retired when this band widened from ace and
 * albatross to five permanent round facts. That deliberately gives up the
 * champagne/bone rarity separation in exchange for one flat treatment that can
 * describe every member-scale feat. The former honoursTreatment module had no
 * other reader, so its metal tokens and honours-named type were deleted rather
 * than left as a false description of this surface.
 *
 * Standings do not belong here. Course record, net record and rank-up depend on
 * a live Explore consequence; these facts come only from the hole rows the card
 * itself draws and therefore remain true from every door into the round.
 */
export type ScorecardFeatKind = 'ace' | 'albatross' | 'eagle' | 'birdies' | 'clean';

export interface ScorecardFeat {
  kind: ScorecardFeatKind;
  count: number;
  /** Present only when exactly one hole produced this single-hole feat. */
  hole: number | null;
}

export interface ScorecardFeatHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

export const FEAT_BAND_STYLE: React.CSSProperties = {
  flexShrink: 0,
  minHeight: 37,
  boxSizing: 'border-box',
  background: 'none',
  borderBottom: `1px solid ${A.HAIRLINE}`,
  padding: '9px 16px',
  display: 'flex',
  alignItems: 'baseline',
  gap: 7,
};

/** First match wins: this order is shared with Explore's permanent callouts. */
export function scorecardFeatFor(
  holes: ScorecardFeatHole[],
  nineHole: boolean,
  surface: 'member' | 'tour',
): ScorecardFeat | null {
  // Tour ace/albatross bands may be worthwhile later. S7 deliberately ships no
  // feat band on that surface, including for those two exceptional scores.
  if (surface !== 'member') return null;

  const scored = holes.filter(
    (hole): hole is ScorecardFeatHole & { par: number; strokes: number } =>
      hole.par != null && hole.strokes != null && hole.strokes > 0,
  );
  if (scored.length === 0) return null;

  const aces = scored.filter((hole) => hole.strokes === 1);
  if (aces.length > 0) {
    return { kind: 'ace', count: aces.length, hole: aces.length === 1 ? aces[0].holeNo : null };
  }

  const albatrosses = scored.filter((hole) => hole.strokes === hole.par - 3);
  if (albatrosses.length > 0) {
    return {
      kind: 'albatross',
      count: albatrosses.length,
      hole: albatrosses.length === 1 ? albatrosses[0].holeNo : null,
    };
  }

  const eagles = scored.filter((hole) => hole.strokes === hole.par - 2);
  if (eagles.length > 0) {
    return { kind: 'eagle', count: eagles.length, hole: eagles.length === 1 ? eagles[0].holeNo : null };
  }

  const birdies = scored.filter((hole) => hole.strokes === hole.par - 1);
  if (birdies.length >= 5) return { kind: 'birdies', count: birdies.length, hole: null };

  const expectedHoles = nineHole ? 9 : 18;
  const clean = holes.length === expectedHoles
    && scored.length === expectedHoles
    && scored.every((hole) => hole.strokes <= hole.par);
  return clean ? { kind: 'clean', count: scored.length, hole: null } : null;
}