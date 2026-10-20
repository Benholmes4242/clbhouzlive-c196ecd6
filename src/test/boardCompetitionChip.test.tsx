import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { BoardRowView } from '@/components/explore-tab-new/courseled/BoardRows';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';

function row(over: Partial<BoardRow> = {}): BoardRow {
  return {
    pos: 1, is_tie: false, user_id: 'u1', display_name: 'Member', profile_photo_url: null,
    whs_score_id: 's1', play_date: '2026-09-20', course_id: 'c', course_name: 'Course',
    gross_score: 71, course_par: 72, net_score: null, stableford_points: null, delta_index: null,
    birdies: null, holes_in_one: null, albatrosses: null, eagles: null, clean_card: null, beat_par: null,
    sub_80: null, is_competition: null, hcp_at_time: null, sort_value: null, total_count: 1,
    pool_rounds: 1, pool_courses: 1, pool_members: 1,
    ...over,
  };
}

const view = (r: BoardRow) => render(<BoardRowView row={r} board="recent" isSelf={false} />).container;

describe('CHIP1 competition chip', () => {
  it('true renders exactly one chip', () => {
    expect(view(row({ is_competition: true })).querySelectorAll('[data-board-competition]')).toHaveLength(1);
  });
  it('false renders none', () => {
    expect(view(row({ is_competition: false })).querySelectorAll('[data-board-competition]')).toHaveLength(0);
  });
  it('null renders none', () => {
    expect(view(row({ is_competition: null })).querySelectorAll('[data-board-competition]')).toHaveLength(0);
  });
  it('feat chip comes before the competition chip', () => {
    const c = view(row({ is_competition: true, holes_in_one: 1 }));
    const chips = Array.from(c.querySelectorAll('[data-board-feat], [data-board-competition]'));
    expect(chips.map((el) => (el.hasAttribute('data-board-feat') ? 'feat' : 'competition'))).toEqual(['feat', 'competition']);
  });
});
