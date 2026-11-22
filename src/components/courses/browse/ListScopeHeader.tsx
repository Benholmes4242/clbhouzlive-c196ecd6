import React from 'react';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { ALL_COURSES_ANCHOR } from './ByRegionSection';
import { fmtCount } from './format';

/**
 * ListScopeHeader — the Courses list's own head (BRIEF_COURSES_LIST_PHOTO_CARDS §2).
 * Rendered by StatBrowse above the sticky control bar, so its caption and its
 * three figures describe exactly the scope the area/region dropdowns have
 * selected. It replaces the page's old "Every course we hold" section and keeps
 * that section's id, so a By region tile tap still scrolls here.
 *
 * The mock's 16px caption gutter is already the page's own gutter: StatBrowse
 * sits inside CoursesContent's px-4 wrapper, so nothing here adds it a second time.
 *
 * Figures come from `browseFiguresForScope`, which uses the same arithmetic as
 * `groupBrowseRegions` — so a region's header equals that region's By region tile.
 */

const CAPTION: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: A.DIM,
};

const FIGURE_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  lineHeight: 1,
  color: A.DIM,
};

const FIGURE_VALUE: React.CSSProperties = {
  ...FIGS,
  display: 'block',
  marginTop: 4,
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1,
};

export interface ListScopeFigures {
  courses: number;
  rounds: number;
  /** rounds × 18 for the same scope; exact (see browseFiguresForScope). */
  holes: number;
  avgToPar?: number | null;
}

/** The three columns, in order: Courses, Rounds, Holes — all ink. Plays to
 *  is not part of this header (BRIEF_COURSE_CARD_V3 §5). */
function scopeCells(figures: ListScopeFigures): Array<{ label: string; value: string; colour: string }> {
  return [
    { label: 'Courses', value: fmtCount(figures.courses), colour: A.INK },
    { label: 'Rounds', value: fmtCount(figures.rounds), colour: A.INK },
    { label: 'Holes', value: fmtCount(figures.holes), colour: A.INK },
  ];
}

export function ListScopeHeader({
  region,
  country,
  figures,
}: {
  /** The selected region, when one is. It leads the caption. */
  region: string | null;
  /** The selected area (sub_country), when one is. */
  country: string | null;
  figures: ListScopeFigures;
}) {
  const caption = region
    ? `Every course in ${region}`
    : country
      ? `Every course in ${country}`
      : 'Every course played';
  const cells = scopeCells(figures);
  return (
    <section id={ALL_COURSES_ANCHOR} style={{ paddingBottom: 14 }}>
      <div style={CAPTION}>{caption}</div>
      {/* No played courses in this scope: the caption is the whole head. */}
      {figures.courses > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
            paddingTop: 10,
            textAlign: 'center',
          }}
        >
          {cells.map((cell) => (
            <div key={cell.label} style={{ minWidth: 0 }}>
              <span style={FIGURE_LABEL}>{cell.label}</span>
              <span style={{ ...FIGURE_VALUE, color: cell.colour }}>{cell.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ListScopeHeader;
