/**
 * YOU_TAB_STATE_3 — branch C (connected, not played) on a course with rounds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { recordAgainstRange } from '@/components/courses/course-detail/you/ProjectionSection';

const read = (f: string) => fs.readFileSync(path.resolve(process.cwd(), f), 'utf8');
const tab = read('src/components/courses/course-detail/CourseYouTab.tsx');
const proj = read('src/components/courses/course-detail/you/ProjectionSection.tsx');

describe('YOU_TAB_STATE_3', () => {
  it('AB1: record above the range top (76 vs 71-75) reads "you would hold it"', () => {
    expect(recordAgainstRange(76, 71, 75)).toBe('rangeRecordAbove');
  });
  it('AB1: record inside the range, ends included, reads "yours on a good day"', () => {
    expect(recordAgainstRange(73, 71, 75)).toBe('rangeRecordInside');
    expect(recordAgainstRange(71, 71, 75)).toBe('rangeRecordInside');
    expect(recordAgainstRange(75, 71, 75)).toBe('rangeRecordInside');
  });
  it('AB1: record below the range bottom reads "better than your best"', () => {
    expect(recordAgainstRange(70, 71, 75)).toBe('rangeRecordBelow');
  });
  it('AB2: the thin-course wording is checked before the range comparison', () => {
    expect(proj.indexOf('rangeWithRecordThin')).toBeLessThan(proj.indexOf('recordAgainstRange(recordGross'));
    expect(proj).not.toContain('timesPlayedToStandard');
  });
  it('AB3: the board list renders only on branch C with tracked rounds', () => {
    expect(tab).toContain('{zeroRounds ? upForGrabs : (');
    expect(tab).toContain('boardHolders={boardHolders}');
  });
});
