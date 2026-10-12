import { describe, it, expect } from 'vitest';
import {
  QUICK_HIT_MAX, isQuickHit, isPartWatched, remainingLabel, reasonLine, spreadByCreator, groupByMember, photosCaption, viewsLabel,
} from '@/features/explore-magazine/watch/watchRules';

describe('BRIEF_WATCH_PAGE rules', () => {
  it('splits at three minutes: 1:59 is a Quick Hit, 3:02 is long-form', () => {
    expect(QUICK_HIT_MAX).toBe(180);
    expect(isQuickHit(119)).toBe(true);
    expect(isQuickHit(182)).toBe(false);
    expect(isQuickHit(180)).toBe(false);
  });
  it('part-watched is above 2% and below 95%', () => {
    const row = { duration_seconds: 1000 };
    expect(isPartWatched(row, { position: 20, duration: 1000 })).toBe(false);
    expect(isPartWatched(row, { position: 503, duration: 1000 })).toBe(true);
    expect(isPartWatched(row, { position: 960, duration: 1000 })).toBe(false);
  });
  it('remaining time reads in minutes or seconds, never a percentage', () => {
    expect(remainingLabel({ duration_seconds: 1490 }, { position: 328, duration: null })).toBe('19 min left');
    expect(remainingLabel({ duration_seconds: 100 }, { position: 55, duration: null })).toBe('45s left');
  });
  it('reason line follows the priority and is absent when nothing applies', () => {
    const base = { partWatched: false, remaining: '19 min left', courseName: null, onYourCourse: false, fromFollowed: false };
    expect(reasonLine({ ...base, partWatched: true, courseName: 'X', onYourCourse: true })).toEqual({ text: '\u25CF 19 min left', hot: true });
    expect(reasonLine({ ...base, courseName: 'X', onYourCourse: true })).toEqual({ text: 'Filmed at X', hot: true });
    expect(reasonLine({ ...base, courseName: 'X', fromFollowed: true })).toEqual({ text: 'Filmed at X', hot: false });
    expect(reasonLine({ ...base, fromFollowed: true })).toEqual({ text: 'From someone you follow', hot: false });
    expect(reasonLine(base)).toBeNull();
  });
  it('spreads creators without dropping any: A A A A B C -> A B A C A A', () => {
    expect(spreadByCreator(['A', 'A', 'A', 'A', 'B', 'C'], (x) => x).join(' ')).toBe('A B A C A A');
  });
  it('community rail is one entry per member', () => {
    const g = groupByMember([{ u: 'a' }, { u: 'a' }, { u: 'b' }], (x) => x.u);
    expect(g.map((x) => x.count)).toEqual([2, 1]);
    expect(photosCaption('Rosapenna', 4)).toBe('Rosapenna \u00B7 4 photos');
    expect(photosCaption('Rosapenna', 1)).toBe('Rosapenna');
    expect(viewsLabel(1240)).toBe('1.2k views');
  });
});
