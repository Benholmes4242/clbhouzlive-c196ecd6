import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ElsewhereSection, elsewhereCards, reachProportion, showElsewhere } from '@/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere';
import type { TitleInReach } from '@/hooks/gam/useTitlesInReach';

afterEach(cleanup);
const row = (o: Partial<TitleInReach>): TitleInReach => ({ course_id: 'c', course_name: 'West Kent', course_country: null, course_region: null, hero_image_url: null, category: 'lowest_gross_all_time', user_rank: 2, user_value: 74, leader_value: 73, gap: 1, attained_at: '2026-06-01', ...o });

describe('CHAMPIONS_ELSEWHERE_R', () => {
  it('VD1: heading count equals the rendered card count', () => {
    const rows = [row({ course_id: 'a' }), row({ course_id: 'b', category: 'most_eagles_all_time', user_value: 2, leader_value: 3 }), row({ course_id: 'c', category: 'best_stableford_all_time', user_value: 37, leader_value: 39, gap: 2 })];
    const { container } = render(<ElsewhereSection rows={rows} />);
    const cards = container.querySelectorAll('[data-elsewhere-card]').length;
    expect(cards).toBe(3);
    expect(container.querySelector('h2')?.textContent).toBe('Three boards you are closest to');
    expect(container.querySelector('h2')?.getAttribute('data-card-count')).toBe(String(cards));
    expect(container.textContent).toContain('You 74 · 73 to beat');
  });

  it('VD2: absent for an unconnected member and for a connected member with no qualifying rows', () => {
    expect(showElsewhere(false, 'me', 'me')).toBe(false);
    expect(showElsewhere(true, 'me', 'me')).toBe(true);
    const { container } = render(<ElsewhereSection rows={[]} />);
    expect(container.innerHTML).toBe('');
    expect(container.querySelector('h2')).toBeNull();
  });

  it('VD3: nearly level gives a nearly full bar on lower- and higher-is-better boards', () => {
    expect(reachProportion('lowest_gross_all_time', 74, 73)).toBeGreaterThan(0.95);
    expect(reachProportion('most_birdies_all_time', 49, 50)).toBeGreaterThan(0.95);
    expect(reachProportion('lowest_gross_all_time', 100, 70)).toBeLessThan(0.75);
    expect(reachProportion('most_birdies_all_time', 10, 50)).toBeLessThan(0.25);
  });

  it('VD4: ordered by bar proportion, not by the smallest raw gap', () => {
    const cards = elsewhereCards([
      row({ course_id: 'eagles', category: 'most_eagles_all_time', user_value: 1, leader_value: 2, gap: 1 }),
      row({ course_id: 'gross', category: 'lowest_gross_all_time', user_value: 72, leader_value: 70, gap: 2 }),
    ]);
    expect(cards.map(card => card.row.course_id)).toEqual(['gross', 'eagles']);
  });
});

import { vi } from 'vitest';
import { championsBoardName } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
describe('CHAMPIONS_ELSEWHERE_N', () => {
  it('XA2: one short name per board; Elsewhere card and cabinet share it', () => {
    expect(championsBoardName('most_eagles_all_time')).toBe('Eagles');
    expect(championsBoardName('most_albatrosses_90d')).toBe('Albatrosses');
    const { container } = render(<ElsewhereSection rows={[row({ category: 'most_eagles_all_time', user_value: 2, leader_value: 3 })]} />);
    expect(container.textContent).toContain('Eagles');
    expect(container.textContent).not.toContain('Most');
  });
  it('XA4: an unrecognised category is dropped with one warning naming it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(elsewhereCards([row({ category: 'fastest_round_all_time' })])).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toContain('fastest_round_all_time');
    warn.mockRestore();
  });
});
