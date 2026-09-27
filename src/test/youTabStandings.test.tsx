/**
 * BRIEF_YOU_TAB_STANDINGS — the compact You tab block.
 *
 * Fixtures are the live rows read for benjamin@clbhouz.co.uk on 22 Sep 2026,
 * scoped to one course at a time as p_course_id returns them.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { categoryLabel } from '@/components/profile/handicap/whs/gam/trophy-room/career/standings';
import WhereYouStandHere from '@/components/courses/course-detail/you/WhereYouStandHere';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

function row(partial: Partial<MemberStandingRow>): MemberStandingRow {
  return {
    course_id: 'c1',
    course_name: 'Sundridge Park East',
    category: 'best_stableford_90d',
    is_tenure: false,
    lower_is_better: false,
    rank: 1,
    field_size: 17,
    ahead_count: 0,
    behind_count: 13,
    value: 41,
    leader_value: 41,
    better_value: null,
    next_value: 40,
    attained_at: null,
    medal_earned: true,
    ...partial,
  } as MemberStandingRow;
}

/* Sundridge Park East — 1st of 17, medal earned, three sharing the record. */
const SUNDRIDGE = row({});

/* Queenwood — alone on the board, no medal. */
const QUEENWOOD = row({
  course_id: 'c2',
  course_name: 'Queenwood',
  rank: 1,
  field_size: 1,
  ahead_count: 0,
  behind_count: 0,
  value: 38,
  leader_value: 38,
  next_value: null,
  medal_earned: false,
});

/* Hankley Common — 4th with medal_earned true: the placed case. */
const HANKLEY = row({
  course_id: 'c3',
  course_name: 'Hankley Common',
  category: 'best_stableford_all_time',
  rank: 4,
  field_size: 9,
  ahead_count: 3,
  behind_count: 5,
  value: 40,
  leader_value: 46,
  better_value: 41,
  next_value: 39,
  medal_earned: true,
});

/* Vale do Lobo (Ocean) — tenure: shown, never awarded. */
const TENURE = row({
  course_id: 'c4',
  course_name: 'Vale do Lobo (Ocean)',
  category: 'most_rounds_all_time',
  is_tenure: true,
  rank: 1,
  field_size: 4,
  value: 74,
  leader_value: 74,
  next_value: 98,
  medal_earned: false,
});

const TENURE_90 = row({ category: 'most_rounds_90d', is_tenure: false, rank: 1, field_size: 17, value: 9, medal_earned: true });
const GROSS_ALL = row({ category: 'lowest_gross_all_time', rank: 4, field_size: 9, ahead_count: 3, behind_count: 5, value: 78, medal_earned: true });

function cell(board: string, w: '90d' | 'all'): HTMLElement {
  const el = document.querySelector(`[data-you-standing-board="${board}"] [data-you-standing-cell="${w}"]`);
  expect(el).not.toBeNull();
  return el as HTMLElement;
}
const rank = (el: HTMLElement) => el.querySelector('[data-you-standing-rank="true"]') as HTMLElement | null;

describe('BRIEF_YOU_TAB_STANDINGS_PAIRED', () => {
  it('rows follow BOARD_ORDER, not arrival order', () => {
    render(<WhereYouStandHere rows={[TENURE, SUNDRIDGE, GROSS_ALL, HANKLEY]} />);
    const seq = Array.from(document.querySelectorAll('[data-you-standing-board]')).map((e) => e.getAttribute('data-you-standing-board'));
    expect(seq).toEqual(['lowest_gross', 'best_stableford', 'most_rounds']);
    expect(screen.getByText('Where you stand here')).toBeTruthy();
  });

  it('a board present in one window renders an empty other cell', () => {
    render(<WhereYouStandHere rows={[GROSS_ALL]} />);
    expect(cell('lowest_gross', '90d').textContent).toBe('');
    expect(cell('lowest_gross', 'all').textContent).toContain('78');
  });

  it('tenure is per cell: all-time 74 has no rank, 90d does', () => {
    render(<WhereYouStandHere rows={[TENURE, TENURE_90]} />);
    const all = cell('most_rounds', 'all');
    expect(all.textContent).toBe('74');
    expect(rank(all)).toBeNull();
    expect(rank(cell('most_rounds', '90d'))!.textContent).toBe('1st /17');
  });

  it('rank tones unchanged, in the right cell', () => {
    render(<WhereYouStandHere rows={[SUNDRIDGE, HANKLEY, QUEENWOOD]} />);
    // SUNDRIDGE and QUEENWOOD share best_stableford_90d; the later one fills the cell.
    expect(rank(cell('best_stableford', '90d'))!.style.color).toBe('rgba(248, 250, 252, 0.42)');
    expect(rank(cell('best_stableford', 'all'))!.style.color).toBe('rgb(248, 250, 252)');
  });

  it('amber for medal_earned 1st', () => {
    render(<WhereYouStandHere rows={[SUNDRIDGE]} />);
    const r = rank(cell('best_stableford', '90d'))!;
    expect(r.textContent).toBe('1st /17');
    expect(r.style.color).toBe('rgb(247, 147, 30)');
  });

  it('rows=[] renders null', () => {
    const { container } = render(<WhereYouStandHere rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('unknown category still renders after the known boards, 90-day column', () => {
    render(<WhereYouStandHere rows={[row({ category: 'most_sandies_90d', value: 3 }), TENURE]} />);
    const seq = Array.from(document.querySelectorAll('[data-you-standing-board]')).map((e) => e.getAttribute('data-you-standing-board'));
    expect(seq).toEqual(['most_rounds', 'most_sandies_90d']);
    expect(screen.getByText('most sandies 90d')).toBeTruthy();
    expect(cell('most_sandies_90d', '90d').textContent).toContain('3');
    expect(cell('most_sandies_90d', 'all').textContent).toBe('');
  });

  it('categoryLabel reproduces all thirteen Trophy Room strings', () => {
    const expected: Record<string, string> = {
      lowest_gross_all_time: 'Lowest gross',
      lowest_gross_90d: 'Lowest gross \u00b7 90 days',
      best_score_diff_all_time: 'Best differential',
      best_score_diff_90d: 'Best differential \u00b7 90 days',
      best_stableford_all_time: 'Best stableford',
      best_stableford_90d: 'Best stableford \u00b7 90 days',
      most_rounds_all_time: 'Rounds played',
      most_rounds_90d: 'Rounds played \u00b7 90 days',
      most_birdies_all_time: 'Birdies',
      most_birdies_90d: 'Birdies \u00b7 90 days',
      most_eagles_all_time: 'Eagles',
      most_eagles_90d: 'Eagles \u00b7 90 days',
      most_aces_all_time: 'Holes in one',
    };
    for (const [k, v] of Object.entries(expected)) expect(categoryLabel(k)).toBe(v);
  });
});
