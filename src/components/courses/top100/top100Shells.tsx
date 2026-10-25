/**
 * TOP 100 TAB SHELLS — BRIEF_COURSES_SKELETONS Phase 3.
 *
 * Every number is read from the real component's exported constants. Where a
 * layout varies, the SMALLEST settled state is drawn (it can only expand):
 *  - The grid draws all cells in the real 'nobody' fill (cellStyle('nobody')),
 *    no ring, no played/reviewed state: a shell must never claim progress.
 *    The tier line beside the figure appears only when viewerPlayed > 0, so it
 *    is not drawn.
 *  - A top100 card's text block is entirely conditional (members row,
 *    plays-to line, no-round line, and CategoryScores returns null with no
 *    scores), so the smallest settled card is its photo alone.
 *  - The Argument holds up to ARGUMENT_ROWS rows and can settle on one.
 */
import React from 'react';
import { Bar } from '@/components/skeletons/shellVocabulary';
import {
  HEAD_GAP, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE, SECTION_WRAP,
} from '@/components/courses/browse/SectionHead';
import { TOP100_PHOTO_H } from '../BrowseCourseCard';
import { TOP100_CARD_GAP } from '../Top100CoursesHubPanel';
import {
  cellStyle, HUNDRED_CELL_H, HUNDRED_CELL_RADIUS, HUNDRED_COLS, HUNDRED_FIGURE, HUNDRED_GAP,
  HUNDRED_GRID_TOP, HUNDRED_LEGEND, hundredGridHeight, hundredRows,
} from './YourHundredSection';
import { ARGUMENT_ROW_GAP, ARGUMENT_THUMB } from './TheArgumentSection';


function Head({ children }: { children: React.ReactNode }) {
  return (
    <section aria-hidden style={SECTION_WRAP}>
      <div style={{ height: HEAD_KICKER_SIZE, display: 'flex', alignItems: 'center' }}>
        <Bar style={{ height: HEAD_KICKER_SIZE - 2, width: 96 }} />
      </div>
      <div style={{ marginTop: HEAD_TITLE_GAP, height: HEAD_TITLE_SIZE * HEAD_TITLE_LINE_HEIGHT, display: 'flex', alignItems: 'center' }}>
        <Bar style={{ height: HEAD_TITLE_SIZE - 3, width: 200 }} />
      </div>
      <div style={{ marginTop: HEAD_GAP }}>{children}</div>
    </section>
  );
}

/* The shell reserves the height of a full hundred-course list, computed by the
   same helper the real grid uses, so the skeleton never jumps on arrival. */
const SHELL_TOTAL = 100;

export function YourHundredShell() {
  const nobody = cellStyle('nobody');
  return (
    <Head>
      <div style={{ height: HUNDRED_FIGURE.size * HUNDRED_FIGURE.lineHeight, display: 'flex', alignItems: 'flex-end' }}>
        <Bar style={{ height: HUNDRED_FIGURE.size * HUNDRED_FIGURE.lineHeight, width: 64 }} />
      </div>
      <div
        style={{
          marginTop: HUNDRED_GRID_TOP, display: 'grid', height: hundredGridHeight(SHELL_TOTAL), gap: HUNDRED_GAP,
          gridTemplateColumns: `repeat(${HUNDRED_COLS}, 1fr)`, gridTemplateRows: `repeat(${hundredRows(SHELL_TOTAL)}, ${HUNDRED_CELL_H}px)`,
        }}
      >
        {Array.from({ length: SHELL_TOTAL }, (_, i) => (
          <div key={i} style={{ borderRadius: HUNDRED_CELL_RADIUS, ...nobody }} />
        ))}
      </div>
      <div style={{ marginTop: HUNDRED_LEGEND.marginTop, minHeight: HUNDRED_LEGEND.minHeight, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${HUNDRED_LEGEND.rowGap}px ${HUNDRED_LEGEND.colGap}px` }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: HUNDRED_LEGEND.labelGap, fontSize: HUNDRED_LEGEND.labelSize }}>
              <span style={{ width: HUNDRED_LEGEND.swatch, height: HUNDRED_LEGEND.swatch, borderRadius: HUNDRED_LEGEND.swatchRadius, ...nobody }} />
              <Bar style={{ height: HUNDRED_LEGEND.labelSize - 2, width: 88 }} />
            </span>
          ))}
        </div>
      </div>
    </Head>
  );
}

/** The Argument: one row (its smallest settled count). */
export function ArgumentShell() {
  return (
    <Head>
      <div style={{ display: 'grid', gap: ARGUMENT_ROW_GAP }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: ARGUMENT_ROW_GAP }}>
          <Bar style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 6 }}>
            <Bar style={{ height: 11, width: '60%' }} />
            <Bar style={{ height: 9, width: '45%' }} />
            <Bar style={{ height: 9, width: '35%' }} />
          </div>
        </div>
      </div>
    </Head>
  );
}

/** Card list: two photo-only cards and a clipped third, TOP100_CARD_GAP apart. */
export function Top100CardListShell() {
  return (
    <div aria-hidden style={{ height: 2 * (TOP100_PHOTO_H + TOP100_CARD_GAP) + TOP100_PHOTO_H / 2, overflow: 'hidden' }}>
      {[0, 1, 2].map((i) => (
        <Bar key={i} style={{ height: TOP100_PHOTO_H, width: '100%', borderRadius: 0, marginBottom: TOP100_CARD_GAP }} />
      ))}
    </div>
  );
}
