import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoundResults } from '@/features/courses/_shared/scorecard/RoundResults';
import type { RoundAwardsResult } from '@/hooks/gam/useRoundAwards';

const efforts: RoundAwardsResult['efforts'] = [
  { unit_kind: 'round_gross', value: 69, rank_here: null, top_ten: true, attempts: 71 },
  { unit_kind: 'front_nine', value: -3, rank_here: 3, top_ten: true, attempts: 55 },
  { unit_kind: 'back_nine', value: 1, rank_here: null, top_ten: false, attempts: 56 },
  { unit_kind: 'finish_six', value: 0, rank_here: null, top_ten: true, attempts: 57 },
  { unit_kind: 'round_stableford', value: 38, rank_here: null, top_ten: false, attempts: 71 },
];

describe('round results', () => {
  it('renders nothing for null or wholly empty results', () => {
    const empty = render(<RoundResults result={null} />);
    expect(empty.container.firstChild).toBeNull();
    empty.rerender(<RoundResults result={{ awards: [], efforts: [] }} />);
    expect(empty.container.firstChild).toBeNull();
  });

  it('renders the sealed historic round as best efforts only', () => {
    const { container } = render(<RoundResults result={{ awards: [], efforts }} scope={{
      courseName: 'Royal Birkdale',
      roundsHere: 71,
      subjectName: 'Your',
      subject: 'You',
      possessive: 'your',
      verb: 'have',
    }} />);
    expect(container.querySelector('[data-round-results-block="awards"]')).toBeNull();
    expect(container.querySelector('[data-round-results-block="holes"]')).toBeNull();
    expect(container.querySelector('[data-round-results-block="efforts"]')).not.toBeNull();
    expect(container.querySelector('[data-round-effort="front_nine"] [data-round-effort-placing]')?.getAttribute('data-round-effort-placing')).toBe('3rd');
    expect(container.querySelector('[data-round-effort="back_nine"]')?.lastElementChild?.textContent).toBe('—');
    expect(container.querySelector('[data-round-effort="finish_six"]')?.textContent).toContain('E');
    expect(container.querySelector('[data-round-effort="finish_six"] [data-round-effort-span]')?.textContent).toBe('roundResults.spans.finish_six');
    expect(container.querySelector('[data-round-effort="front_nine"] [data-round-effort-placing]')?.getAttribute('style')).toContain('color');
    expect(container.querySelector('[data-round-results-scope]')?.textContent).toContain('roundResults.scope.heading');
    expect(container.querySelector('[data-round-efforts-header]')?.textContent).toContain('roundResults.columns.best');
    expect(container.querySelector('[data-round-efforts-table]')?.getAttribute('style')).toContain('overflow-x: clip');
  });

  it('keeps coarse and hole awards in separate blocks and omits a null delta chip', () => {
    const result: RoundAwardsResult = {
      efforts: [],
      awards: [
        { award_kind: 'new_best', unit_kind: 'front_nine', unit_key: 0, tier: 'gold', value: -2, previous_value: -1, delta: 1, rank_here: 1, attempts_at_detection: 55 },
        { award_kind: 'first_birdie', unit_kind: 'hole', unit_key: 7, tier: 'bronze', value: -1, previous_value: null, delta: null, rank_here: 1, attempts_at_detection: 0 },
      ],
    };
    const { container } = render(<RoundResults result={result} />);
    expect(container.querySelectorAll('[data-round-results-block]')).toHaveLength(2);
    expect(container.querySelector('[data-round-results-block="awards"] [data-round-award="front_nine"]')).not.toBeNull();
    const hole = container.querySelector('[data-round-results-block="holes"] [data-round-award="hole"]');
    expect(hole?.textContent).toContain('roundResults.award.firstBirdie');
    expect(hole?.children).toHaveLength(2);
  });
});