/**
 * BRIEF_ROUND_SHEET_CUES — THE SHEET HAS TO SHOW THERE IS MORE.
 *
 * Five rules, each tested where it is decided rather than through a sheet that
 * would drag the whole handicap read path in with it:
 *
 *  §1 mid keeps a 44px peek of the next section, and only when there IS one.
 *  §2 the nudge runs, holds, springs back, and a touch ends it mid-flight.
 *  §2 the first three pageable opens earn a movement, or a sentence with reduced
 *     motion, and nothing once the member has paged.
 *  §4 ScoreMark's numeral is unchanged for every existing caller.
 *  §5 the feed follows the sheet on the element that actually scrolls, and a
 *     detented sheet does not lock the body while every other sheet still does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import { midExtent, MID_PAD_PX } from '@/components/ui/sheetMid';
import {
  NUDGE_BACK_MS, NUDGE_HOLD_MS, NUDGE_PX, NUDGE_SETTLE_MS, NUDGE_TRAVEL_MS, runNudge,
} from '@/features/explore-magazine/roundNudge';
import { openCue, noteHintPaged, resetHint } from '@/features/explore-magazine/roundPaging';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { BottomSheet } from '@/components/ui/BottomSheet';

/* ------------------------------------------------------------------ §1 mid */

describe('mid leaves the next section peeking', () => {
  const base = { sheetHeight: 900, viewportHeight: 1000 };

  it('adds the declared peek past the card, so the heading below it shows', () => {
    const withPeek = midExtent({ ...base, markerExtent: 400, peek: 44 });
    const without = midExtent({ ...base, markerExtent: 400, peek: 0 });
    expect(withPeek.mid).toBe(444);
    expect(without.mid).toBe(400 + MID_PAD_PX);
    expect(withPeek.mid - without.mid).toBe(44 - MID_PAD_PX);
  });

  it('fades only when mid genuinely hides something', () => {
    expect(midExtent({ ...base, markerExtent: 400, peek: 44 }).peeking).toBe(true);
    /* Nothing below the card: no peek declared, so no cut and no fade. */
    expect(midExtent({ ...base, markerExtent: 400, peek: 0 }).peeking).toBe(false);
    /* A round whose card already fills the sheet: mid IS full, nothing to hide. */
    expect(midExtent({ sheetHeight: 400, viewportHeight: 1000, markerExtent: 400, peek: 44 }).peeking)
      .toBe(false);
  });

  it('keeps the 62dvh cap above everything', () => {
    expect(midExtent({ ...base, markerExtent: 880, peek: 44 }).mid).toBe(620);
  });

  it('is recomputed per round, so a shorter card gives a shorter mid', () => {
    const full = midExtent({ ...base, markerExtent: 500, peek: 44 });
    const partial = midExtent({ ...base, markerExtent: 320, peek: 44 });
    expect(partial.mid).toBeLessThan(full.mid);
    expect(partial.offset).toBeGreaterThan(full.offset);
  });
});

/* ---------------------------------------------------------------- §2 nudge */

describe('the nudge', () => {
  const io = () => {
    const shifts: unknown[] = [];
    const previews: unknown[] = [];
    return {
      shifts,
      previews,
      setShift: (v: unknown) => shifts.push(v),
      setPreview: (v: unknown) => previews.push(v),
      setTimeout: (fn: () => void, ms: number) => window.setTimeout(fn, ms) as unknown as number,
      clearTimeout: (id: number) => window.clearTimeout(id),
    };
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits for the sheet to settle, walks left, holds, and springs back', () => {
    const t = io();
    runNudge(3, t);
    vi.advanceTimersByTime(NUDGE_SETTLE_MS - 1);
    expect(t.shifts).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(t.previews[0]).toEqual({ side: 'next', ix: 3 });
    expect(t.shifts[0]).toEqual({ dx: -NUDGE_PX, animating: true });
    vi.advanceTimersByTime(NUDGE_TRAVEL_MS + NUDGE_HOLD_MS);
    expect(t.shifts[1]).toEqual({ dx: 0, animating: true });
    vi.advanceTimersByTime(NUDGE_BACK_MS);
    expect(t.shifts[2]).toBeNull();
    expect(t.previews[1]).toBeNull();
  });

  it('is ended by a touch mid-flight, and puts the page back', () => {
    const t = io();
    const cancel = runNudge(1, t);
    vi.advanceTimersByTime(NUDGE_SETTLE_MS + 40);
    cancel();
    expect(t.shifts.at(-1)).toBeNull();
    expect(t.previews.at(-1)).toBeNull();
    /* And nothing further runs. */
    const seen = t.shifts.length;
    vi.advanceTimersByTime(2000);
    expect(t.shifts.length).toBe(seen);
  });

  it('cancelled before it moves, it never touched the sheet', () => {
    const t = io();
    runNudge(1, t)();
    vi.advanceTimersByTime(2000);
    expect(t.shifts).toEqual([]);
    expect(t.previews).toEqual([]);
  });
});

describe('which cue an open earns', () => {
  beforeEach(() => resetHint());

  it('a movement on the first three pageable opens, then nothing', () => {
    const opts = { pageable: true, hasNext: true, reducedMotion: false };
    expect(openCue(opts)).toBe('nudge');
    expect(openCue(opts)).toBe('nudge');
    expect(openCue(opts)).toBe('nudge');
    expect(openCue(opts)).toBeNull();
  });

  it('nothing at the last round, because there is nothing to bring in', () => {
    expect(openCue({ pageable: true, hasNext: false, reducedMotion: false })).toBeNull();
  });

  it('the sentence instead, for a reader who asked for less motion', () => {
    expect(openCue({ pageable: true, hasNext: true, reducedMotion: true })).toBe('line');
  });

  it('nothing at all when the sheet cannot page', () => {
    expect(openCue({ pageable: false, hasNext: false, reducedMotion: false })).toBeNull();
  });

  it('never returns once the member has paged', () => {
    noteHintPaged();
    expect(openCue({ pageable: true, hasNext: true, reducedMotion: false })).toBeNull();
  });
});

/* ------------------------------------------------------------ §4 the mark */

describe('ScoreMark sizing', () => {
  const numeral = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('*'))
      .map((n) => (n as HTMLElement).style.fontSize)
      .filter(Boolean);

  it('is unchanged for every caller that does not ask for a numeral size', () => {
    const { container } = render(<ScoreMark strokes={4} par={4} size={38} />);
    /* Today's formula: round(38 x 0.42) = 16. */
    expect(numeral(container)).toContain('16px');
  });

  it('draws the card strokes row at 14, whatever the mark measures', () => {
    const { container } = render(
      <ScoreMark strokes={4} par={4} size={26} numeralSize={14} surface="dark" />,
    );
    expect(numeral(container)).toContain('14px');
  });
});

/* --------------------------------------------------------- §5 the follow */

describe('the feed follows on the element that actually scrolls', () => {
  it('scrolls the resolved ancestor, not the window', () => {
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    Object.defineProperty(scroller, 'scrollHeight', { value: 4000, configurable: true });
    Object.defineProperty(scroller, 'clientHeight', { value: 800, configurable: true });
    const card = document.createElement('div');
    scroller.appendChild(card);
    document.body.appendChild(scroller);
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo as unknown as typeof scroller.scrollTo;
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    scrollElementIntoView(card, { offset: 56, behavior: 'smooth' });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(windowScroll).not.toHaveBeenCalled();
    scroller.remove();
    windowScroll.mockRestore();
  });
});

describe('the body lock', () => {
  afterEach(() => { document.body.style.overflow = ''; });

  it('is kept for a plain sheet, exactly as before', () => {
    render(<BottomSheet open onClose={() => {}}><div>plain</div></BottomSheet>);
    expect(screen.getByText('plain')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('is dropped for a detented sheet, so the feed can be scrolled under it', () => {
    render(
      <BottomSheet open onClose={() => {}} detents={['mid', 'full']}>
        <div>detented</div>
      </BottomSheet>,
    );
    expect(screen.getByText('detented')).toBeTruthy();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

/* ------------------------------------------------------------- §3 the pager */

describe('paging without a swipe', () => {
  const holes = Array.from({ length: 18 }, (_, i) => ({
    holeNo: i + 1, par: 4, strokes: 5, fieldAvg: null,
  }));
  const sheet = (paging: NonNullable<React.ComponentProps<typeof CardScorecardSheet>['paging']>) =>
    render(
      <CardScorecardSheet
        open
        onClose={() => {}}
        eyebrowText="Sat 11 Apr"
        courseName="Machrihanish"
        holes={holes}
        playerName="A Member"
        detents={['mid', 'full']}
        paging={paging}
      />,
    );
  const pager = (over: Partial<NonNullable<React.ComponentProps<typeof CardScorecardSheet>['paging']>> = {}) => ({
    onPrev: vi.fn(), onNext: vi.fn(), hasPrev: true, hasNext: true,
    prevLabel: 'Previous round', nextLabel: 'Next round',
    announce: 'A Member, Machrihanish, 90', ...over,
  });

  it('offers two focusable controls and announces the round that arrived', () => {
    const p = pager();
    sheet(p);
    const prev = screen.getByRole('button', { name: 'Previous round' });
    const next = screen.getByRole('button', { name: 'Next round' });
    prev.click();
    next.click();
    expect(p.onPrev).toHaveBeenCalledTimes(1);
    expect(p.onNext).toHaveBeenCalledTimes(1);
    const live = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(live?.textContent).toBe('A Member, Machrihanish, 90');
  });

  it('disables the control that has nowhere to go', () => {
    sheet(pager({ hasPrev: false, hasNext: false }));
    expect(screen.getByRole('button', { name: 'Previous round' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next round' })).toBeDisabled();
  });

  it('pages on the arrow keys, and refuses them at the ends', () => {
    const p = pager({ hasPrev: false });
    sheet(p);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(p.onNext).toHaveBeenCalledTimes(1);
    expect(p.onPrev).not.toHaveBeenCalled();
  });
});
