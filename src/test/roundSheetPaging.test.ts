/**
 * BRIEF_ROUND_SHEET §2 — THE PAGING DECISIONS.
 *
 * The thresholds, the end rubber-band and the one-off hint, tested without a
 * finger. Paging is Explore's alone; a sheet with no sequence never asks.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PAGE_COMMIT_PX, RUBBER, neighbours, noteHintOpen, noteHintPaged, pageDecision,
  resetHint, rubberBand, shouldExtend,
} from '@/features/explore-magazine/roundPaging';

describe('pageDecision', () => {
  it('pages forward on a leftward drag past 60px', () => {
    expect(pageDecision(0, 5, -(PAGE_COMMIT_PX + 1), 0)).toEqual({ direction: 'next', to: 1 });
  });

  it('pages back on a rightward drag past 60px', () => {
    expect(pageDecision(2, 5, PAGE_COMMIT_PX + 1, 0)).toEqual({ direction: 'prev', to: 1 });
  });

  it('pages on a flick that never travelled far', () => {
    expect(pageDecision(1, 5, -12, -0.9)).toEqual({ direction: 'next', to: 2 });
  });

  it('springs back below the threshold and without a flick', () => {
    expect(pageDecision(1, 5, -40, -0.1)).toBeNull();
  });

  it('cannot page past either end, or with nothing to page to', () => {
    expect(pageDecision(0, 5, 200, 1)).toBeNull();
    expect(pageDecision(4, 5, -200, -1)).toBeNull();
    expect(pageDecision(0, 1, -200, -1)).toBeNull();
  });
});

describe('rubberBand', () => {
  it('follows the finger in the middle of the sequence', () => {
    expect(rubberBand(2, 5, -100)).toBe(-100);
  });

  it('resists at 30% at either end', () => {
    expect(rubberBand(0, 5, 100)).toBeCloseTo(100 * RUBBER);
    expect(rubberBand(4, 5, -100)).toBeCloseTo(-100 * RUBBER);
  });

  it('still follows a drag that leads AWAY from the end', () => {
    expect(rubberBand(0, 5, -100)).toBe(-100);
  });
});

describe('neighbours and extension', () => {
  it('prefetches both neighbours, and only the ones that exist', () => {
    expect(neighbours(2, 5)).toEqual([1, 3]);
    expect(neighbours(0, 5)).toEqual([1]);
    expect(neighbours(4, 5)).toEqual([3]);
  });

  it('asks for another stream page within two of the end', () => {
    expect(shouldExtend(7, 10)).toBe(true);
    expect(shouldExtend(6, 10)).toBe(false);
  });
});

describe('the swipe hint', () => {
  beforeEach(() => resetHint());

  it('shows for the first three opens, then stops', () => {
    expect(noteHintOpen()).toBe(true);
    expect(noteHintOpen()).toBe(true);
    expect(noteHintOpen()).toBe(true);
    expect(noteHintOpen()).toBe(false);
  });

  it('never returns once the member has paged', () => {
    expect(noteHintOpen()).toBe(true);
    noteHintPaged();
    expect(noteHintOpen()).toBe(false);
  });
});
