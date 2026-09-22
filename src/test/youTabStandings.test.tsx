/**
 * BRIEF_YOU_TAB_STANDINGS — the compact You tab block.
 *
 * Fixtures are the live rows read for benjamin@clbhouz.co.uk on 22 Sep 2026,
 * scoped to one course at a time as p_course_id returns them.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

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
  value: 112,
  leader_value: 112,
  next_value: 98,
  medal_earned: false,
});

function rankSpan(category: string): HTMLElement {
  const rowEl = document.querySelector(`[data-you-standing-row="${category}"]`);
  expect(rowEl).not.toBeNull();
  const rank = rowEl!.querySelector('[data-you-standing-rank="true"]');
  expect(rank).not.toBeNull();
  return rank as HTMLElement;
}

describe('BRIEF_YOU_TAB_STANDINGS · compact block', () => {
  it('Sundridge: amber 1st /17 with "Shared with 3 · clear by 1"', () => {
    render(<WhereYouStandHere rows={[SUNDRIDGE]} />);
    const rank = rankSpan('best_stableford_90d');
    expect(rank.textContent).toBe('1st /17');
    expect(rank.style.color).toBe('rgb(247, 147, 30)'); // A.AMBER #F7931E
    expect(screen.getByText('Shared with 3 · clear by 1')).toBeTruthy();
  });

  it('Queenwood: 1st /1 in DIM, "Only card on this board" — not amber', () => {
    render(<WhereYouStandHere rows={[QUEENWOOD]} />);
    const rank = rankSpan('best_stableford_90d');
    expect(rank.textContent).toBe('1st /1');
    expect(rank.style.color).toBe('rgba(248, 250, 252, 0.42)'); // A.DIM
    expect(screen.getByText('Only card on this board')).toBeTruthy();
  });

  it('a rank-4 medal_earned row shows default ink, not dim', () => {
    render(<WhereYouStandHere rows={[HANKLEY]} />);
    const rank = rankSpan('best_stableford_all_time');
    expect(rank.textContent).toBe('4th /9');
    expect(rank.style.color).toBe('rgb(248, 250, 252)'); // A.INK #F8FAFC
  });

  it('tenure rows carry no rank emphasis at all', () => {
    render(<WhereYouStandHere rows={[TENURE]} />);
    const rowEl = document.querySelector('[data-you-standing-row="most_rounds_all_time"]');
    expect(rowEl).not.toBeNull();
    expect(rowEl!.querySelector('[data-you-standing-rank="true"]')).toBeNull();
    expect(screen.getByText('112')).toBeTruthy();
  });

  it('renders nothing when the RPC returns no rows — no empty state', () => {
    const { container } = render(<WhereYouStandHere rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('standings come before tenure in the same block, one heading', () => {
    render(<WhereYouStandHere rows={[TENURE, SUNDRIDGE]} />);
    const rows = Array.from(document.querySelectorAll('[data-you-standing-row]')).map((el) =>
      el.getAttribute('data-you-standing-row'),
    );
    expect(rows).toEqual(['best_stableford_90d', 'most_rounds_all_time']);
    expect(screen.getByText('Where you stand here')).toBeTruthy();
  });
});
