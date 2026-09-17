/**
 * BRIEF_ROUND_SHEET_CUES / SCORECARD GLASS CARD S1.
 *
 * Five rules, each tested where it is decided rather than through a sheet that
 * would drag the whole handicap read path in with it:
 *
 *  §2 the nudge runs, holds, springs back, and a touch ends it mid-flight.
 *  §2 the first three pageable opens earn a movement, or a sentence with reduced
 *     motion, and nothing once the member has paged.
 *  §4 ScoreMark's numeral is unchanged for every existing caller.
 *  §5 the feed follows the sheet on the element that actually scrolls.
 *  S1 the scorecard is glass over the page, while /round remains a page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import {
  NUDGE_BACK_MS, NUDGE_HOLD_MS, NUDGE_PX, NUDGE_SETTLE_MS, NUDGE_TRAVEL_MS, runNudge,
} from '@/features/explore-magazine/roundNudge';
import { openCue, noteHintPaged, resetHint } from '@/features/explore-magazine/roundPaging';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { BottomSheet } from '@/components/ui/BottomSheet';

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

  it('draws eagle and double-bogey gaps without an opaque canvas layer', () => {
    const eagle = render(<ScoreMark strokes={2} par={4} size={26} surface="dark" glassDoubleRings />).container;
    expect(eagle.querySelectorAll('[data-score-ring]').length).toBe(2);
    expect(eagle.querySelector('[data-score-fill="eagle"]')).toBeNull();
    expect(eagle.innerHTML).not.toContain('background: rgb(13, 13, 13)');

    const doub = render(<ScoreMark strokes={6} par={4} size={26} surface="dark" glassDoubleRings />).container;
    expect(doub.querySelectorAll('[data-score-ring]').length).toBe(2);
    expect(doub.querySelector('[data-score-fill="doub"]')).toBeNull();
    expect(doub.innerHTML).not.toContain('background: rgb(13, 13, 13)');
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

describe('the scorecard presentation split', () => {
  const holes = Array.from({ length: 9 }, (_, i) => ({
    holeNo: i + 1, par: 4, strokes: 4, fieldAvg: null,
  }));
  const props = {
    open: true,
    onClose: vi.fn(),
    eyebrowText: 'Sat 11 Apr',
    courseName: 'Machrihanish',
    holes,
    playerName: 'A Member',
  };

  it('renders the overlay as a glass dialog and a card tap does not dismiss it', () => {
    const onClose = vi.fn();
    render(<CardScorecardSheet {...props} onClose={onClose} />);
    const card = document.querySelector('[data-scorecard-glass-card="true"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.style.maxHeight).toBe('82dvh');
    fireEvent.click(card);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-scorecard-overlay="true"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and has no trajectory panel', () => {
    const onClose = vi.fn();
    render(<CardScorecardSheet {...props} onClose={onClose} surface="tour" />);
    expect(screen.queryByText('How it unfolded')).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses on a downward card swipe', () => {
    const onClose = vi.fn();
    render(<CardScorecardSheet {...props} onClose={onClose} />);
    const card = document.querySelector('[data-scorecard-glass-card="true"]') as HTMLElement;
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 150 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 102, clientY: 275 }] });
    fireEvent.touchEnd(card);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('axis-locks a horizontal swipe and forwards its full-card drag', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    render(
      <CardScorecardSheet
        {...props}
        onHorizontalDrag={{ onStart, onMove, onEnd }}
      />,
    );
    const card = document.querySelector('[data-scorecard-glass-card="true"]') as HTMLElement;
    fireEvent.touchStart(card, { touches: [{ clientX: 240, clientY: 220 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 180, clientY: 223 }] });
    fireEvent.touchEnd(card);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenLastCalledWith(-60);
    expect(onEnd).toHaveBeenCalledWith(-60, expect.any(Number));
  });

  it('keeps an exit tappable without dismissing the card', () => {
    const onClose = vi.fn();
    const onViewCourse = vi.fn();
    render(<CardScorecardSheet {...props} onClose={onClose} onViewCourse={onViewCourse} />);
    fireEvent.click(screen.getByText(/viewCourse/));
    expect(onViewCourse).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders page mode without a backdrop or dialog', () => {
    render(<CardScorecardSheet {...props} presentation="page" />);
    expect(document.querySelector('[data-scorecard-page="true"]')).toBeTruthy();
    expect(document.querySelector('[data-scorecard-overlay="true"]')).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
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
