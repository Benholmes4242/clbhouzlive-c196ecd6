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
 *
 * Top100PageShell is the tab's PageLoadGate fallback, in page order. Each
 * section shell draws its SMALLEST settled state, and a section the list was
 * last seen without is left out, so the reveal only ever grows. Your Hundred
 * has no shell: it only shows for members with 5 or more played, so its
 * smallest state is absent.
 */
import React from 'react';
import { Bar } from '@/components/skeletons/shellVocabulary';
import {
  HEAD_GAP, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE, SECTION_WRAP,
} from '@/components/courses/browse/SectionHead';
import { TOP100_PHOTO_H } from '../BrowseCourseCard';
import { TOP100_CARD_GAP } from '../Top100CoursesHubPanel';
import { ARGUMENT_ROW_GAP, ARGUMENT_THUMB } from './TheArgumentSection';
import './top100Compare.css';


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
      <div className="t100b-chart-shell">{Array.from({length:10},(_,i) => <div className="t100b-shell-row" key={i}><Bar className="t100b-shell-name" /><Bar className="t100b-shell-track" /></div>)}</div>
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

/** A bar sitting in a real text line: the line keeps the real class's font, so its height is the real line's. */
function Line({ className, w, style }: { className?: string; w: number | string; style?: React.CSSProperties }) {
  return <div className={className} style={style}><Bar style={{ display: 'inline-block', verticalAlign: 'middle', width: w, height: '0.72em' }} />{' '}</div>;
}

/** Golfers versus the official list at its smallest settled state: three chart rows, no caption, no see-all, one argument row. */
export function ComparisonShell() {
  return (
    <section aria-hidden className="t100b-section" data-comparison-shell>
      <Line className="t100b-kicker" w={220} />
      <div className="t100b-title"><Bar style={{ display: 'inline-block', verticalAlign: 'middle', width: '86%', height: '0.72em' }} />{' '}<br /><Bar style={{ display: 'inline-block', verticalAlign: 'middle', width: '52%', height: '0.72em' }} />{' '}</div>
      <div className="t100b-chart">
        <div className="t100b-keyrow"><Line className="t100b-key" w={92} /></div>
        <div className="t100b-axis"><Bar style={{ width: 18, height: 7 }} /><Bar style={{ width: 26, height: 7 }} /></div>
        {[0, 1, 2].map(i => (
          <div className="t100b-crow" key={i}>
            <span className="t100b-name-line"><Line className="t100b-name" w={[110, 84, 128][i]} /><Line className="t100b-badge" w={22} /></span>
            <span className="t100b-track" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Line style={{ fontSize: 11, lineHeight: 1 }} w={150} />
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: ARGUMENT_ROW_GAP }}>
          <Bar style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Line style={{ fontSize: 13.5 }} w="58%" />
            <Line style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.35 }} w="82%" />
            <Line className="t100b-why" w="48%" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** One rating away at its smallest settled state: one card. */
export function OneRatingAwayShell() {
  return (
    <section aria-hidden className="t100b-section" data-near-shell>
      <Line className="t100b-kicker" w={130} />
      <Line className="t100b-title" w="72%" />
      <div className="t100b-sub"><Bar style={{ display: 'inline-block', verticalAlign: 'middle', width: '94%', height: '0.72em' }} />{' '}<br /><Bar style={{ display: 'inline-block', verticalAlign: 'middle', width: '40%', height: '0.72em' }} />{' '}</div>
      <div className="t100b-near-rail">
        <div className="t100b-near-card">
          <Bar style={{ width: 156, height: 96, borderRadius: 12 }} />
          <Line className="t100b-near-name" w={96} />
          <Line className="t100b-near-line" w={120} />
          <Bar style={{ width: 72, height: 30, borderRadius: 999 }} />
        </div>
      </div>
    </section>
  );
}

/** The list head: kicker, title and the order toggle. */
export function ListHeadShell() {
  return (
    <section aria-hidden className="t100b-section" data-list-head-shell>
      <div className="t100b-list-head">
        <div><Line className="t100b-kicker" w={64} /><Line className="t100b-title" w={150} /></div>
        <Bar style={{ width: 168, height: 38, borderRadius: 999, flex: 'none' }} />
      </div>
    </section>
  );
}

/** The Top 100 tab's gate fallback, in page order. A section the list was last seen without is left out, so the reveal only ever grows. */
export function Top100PageShell({ comparison = true, near = true }: { comparison?: boolean; near?: boolean }) {
  return (
    <div className="t100b" aria-hidden data-top100-fallback>
      {comparison ? <ComparisonShell /> : null}
      {near ? <OneRatingAwayShell /> : null}
      <ListHeadShell />
      <div style={{ paddingTop: 24 }}><Top100CardListShell /></div>
    </div>
  );
}
