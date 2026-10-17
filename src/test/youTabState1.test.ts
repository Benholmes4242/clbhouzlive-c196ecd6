/**
 * YOU_TAB_STATE_1_T — regression locks for the state-1 scoping (X1) and the
 * board list (X2). Source-level guards, as the repo's other layout guards are:
 * the branches are data-gated and cannot be rendered without a live backend.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
const tab = source('src/components/courses/course-detail/CourseYouTab.tsx');
const section = source('src/components/courses/course-detail/you/UnclaimedCourseSection.tsx');

describe('YOU_TAB_STATE_1 X1 scoping', () => {
  it('branch B with zero tracked rounds: the unclaimed section carries the count and the ALL BOARDS link', () => {
    expect(tab).toContain('<UnclaimedCourseSection');
    expect(tab).toContain('openBoards={unclaimedCount}');
    expect(tab).toContain("onTabChange?.('legends')");
    expect(section).toContain('{formatNumber(openBoards)}');
    expect(section).toContain("t('courseDetail.youTab.unclaimed.allBoards', { count: boardTotal })");
  });

  it('branch B with zero tracked rounds: Up for grabs does not separately render', () => {
    expect(tab).toContain('{zeroRounds ? null : upForGrabs}');
  });

  it('branch B with one or more tracked rounds: Up for grabs renders exactly as before', () => {
    /* The ternary's else branch IS the pre-state-1 render: the same
       upForGrabs element, built once, reached whenever zeroRounds is false. */
    const upForGrabsBuild = tab.indexOf('const upForGrabs');
    const gate = tab.indexOf('{zeroRounds ? null : upForGrabs}');
    expect(upForGrabsBuild).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(upForGrabsBuild);
    expect(tab).toContain('const upForGrabs = (');
  });
});

describe('YOU_TAB_STATE_1 X2 board list reads real boards', () => {
  it('the four rows map to existing all-time board categories, not new strings', () => {
    const expected = ['lowest_gross_all_time', 'lowest_net_all_time', 'best_stableford_all_time', 'best_score_diff_all_time'];
    for (const category of expected) {
      expect(CHAMPIONS_ORDER_ALL_TIME).toContain(category);
    }
    expect(section).toContain("const SINGLE_ROUND_BOARDS = ['lowestGross', 'lowestNet', 'bestStableford', 'bestDifferential'] as const;");
  });

  it('the "All N boards" count comes from CHAMPIONS_ORDER_ALL_TIME, never a literal', () => {
    expect(section).toContain('const boardTotal = CHAMPIONS_ORDER_ALL_TIME.length;');
    expect(section).not.toMatch(/allBoards[^}]*count:\s*\d/);
    expect(section).not.toContain('All 9 boards');
  });
});
