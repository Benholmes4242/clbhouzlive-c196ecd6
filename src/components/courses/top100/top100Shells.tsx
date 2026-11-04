/**
 * TOP 100 TAB SHELLS — BRIEF_COURSES_SKELETONS Phase 3.
 *
 * Every number is read from the real component's exported constants. Where a
 * layout varies, the SMALLEST settled state is drawn (it can only expand):
 *  - The grid draws all cells in the real 'nobody' fill (cellStyle('nobody')),
 *    no ring, no played/reviewed state: a shell must never claim progress.
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

/** T100 reserves only the race's slab/rail/three rows; no unknown pinned row
 * or activity dropdown. Signed-out callers never mount this shell. */
export function YourHundredShell() {
  return <div aria-hidden className="t100-shell" data-race-shell>
    <div className="t100-head"><Bar style={{ height: HEAD_KICKER_SIZE, width: 96 }} /><Bar style={{ marginTop: HEAD_TITLE_GAP, height: HEAD_TITLE_SIZE * HEAD_TITLE_LINE_HEIGHT, width: 160 }} /></div>
    <Bar className="t100-shell-slab" style={{ borderRadius: 16 }} />
    <div className="t100-shell-rail">{[0,1,2].map(i => <Bar key={i} style={{ width: 116, height: 80, borderRadius: 12, flex: 'none' }} />)}</div>
    {[0,1,2].map(i => <div key={i} className="t100-shell-row"><Bar style={{ marginTop: 16, height: 34, width: '80%' }} /></div>)}
  </div>;
}

/** The Argument: one row (its smallest settled count). */
export function ArgumentShell() {
  return (
    <Head>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: ARGUMENT_ROW_GAP }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: ARGUMENT_ROW_GAP }}>
          <Bar style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 6 }}>
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
