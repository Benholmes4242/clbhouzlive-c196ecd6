import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { Bar } from './DiscoverSectionShells';

/**
 * DISCOVER — loading silhouette (BRIEF_DISCOVER_SKELETON_REBUILD).
 *
 * THE RULE THAT SHAPES THIS FILE, AND IT OUTRANKS EVERY MEASUREMENT IN IT:
 *   A LOADING STATE MAY NEVER BE WIDER OR TALLER THAN THE SMALLEST SETTLED
 *   STATE IT RESOLVES INTO. Surfaces expand outwards; they never start large
 *   and drop in. The corollary is that THE FIX IS OFTEN TO DRAW NOTHING RATHER
 *   THAN SOMETHING SMALLER.
 *
 * So this draws THREE THINGS and stops:
 *   the hero, at its exact height, as ONE block — a photograph is not a shape a
 *     skeleton can approximate, and bars inside it would land where the real
 *     eyebrow, title and stat rail do not (S2.2)
 *   the filter bar, a fixed-height element it can match exactly (S2.3)
 *   THREE board rows, which expand downward into up to eight (S2.5)
 *
 * And it draws NOTHING for the column header row, the See all row, the courses
 * row, the featured course or the tiles (S2.4 / S2.7). Everything below the
 * board waits on the board's own query, and every one of those elements is
 * taller than anything a skeleton could honestly reserve — a fake featured card
 * and four fake tiles would be the largest contraction on the page (S2.8).
 *
 * NO HEIGHT ANIMATION on the handover (S3.1). The right height is reserved and
 * the content replaces it; a tween on the slowest frame of the session is one
 * more moving part.
 *
 * The section shells this file used to hold — the podium, the band tiles, Most
 * played, Honours, the rails — modelled a page that no longer exists. The four
 * that other routes still render live in ./DiscoverSectionShells.
 */

/* MEASURED off GolfThisWeek.tsx: HERO_H 216 plus the safe area, and the board
   at marginTop 8 inside the page's 14px gutter. */
const HERO_H = 216;
/* MEASURED off the sticky filter button: minHeight 40 with a hairline on each
   edge. The brief says 48; the live bar is 40, and matching the live element is
   the point, so 40 it is. */
const FILTER_H = 40;
/* MEASURED off BoardRowView: padding 6px 2px around a 28px content row. */
const ROW_H = 40;

function BoardRowShell() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px', height: ROW_H, boxSizing: 'border-box' }}>
      {/* NOTHING IN THE POSITION COLUMN OR THE FIGURE COLUMNS (S2.6): they hold
          2 to 4 characters, so a bar there is wider than the content half the
          time. */}
      <span style={{ width: 28, flexShrink: 0 }} />
      <Bar style={{ width: 26, height: 26, borderRadius: '34%', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Bar style={{ height: 9, width: 116 }} />
        <Bar style={{ height: 8, width: 78 }} />
      </span>
    </div>
  );
}

export default function DiscoverCourseLedSkeleton() {
  return (
    <div aria-hidden="true" style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS }}>
      <div
        style={{
          height: `calc(${HERO_H}px + env(safe-area-inset-top, 0px))`,
          background: A.PANEL,
        }}
      />
      <div
        style={{
          minHeight: FILTER_H,
          width: '100%',
          background: A.PANEL,
          borderTop: `1px solid ${A.BORDER}`,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      />
      <div style={{ marginTop: 8, padding: '0 14px' }}>
        {[0, 1, 2].map((i) => (
          <BoardRowShell key={i} />
        ))}
      </div>
    </div>
  );
}
