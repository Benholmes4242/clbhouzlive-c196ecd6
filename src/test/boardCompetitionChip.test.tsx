import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';

/* A real i18n provider (not a mock): the feat label must be non-empty for the
   feat chip to render, which the '' -returning mock cannot provide. */
const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', ns: ['courses'], resources: { en: { courses } } });

import { BoardRowView } from '@/components/explore-tab-new/courseled/BoardRows';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import type { BoardKey } from '@/components/explore-tab-new/courseled/boardFilters';

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

const view = (r: BoardRow, board: BoardKey = 'recent') => render(<I18nextProvider i18n={i18n}><BoardRowView row={r} board={board} isSelf={false} /></I18nextProvider>).container;

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
    const c = view(row({ is_competition: true, holes_in_one: 1 }), 'eagle');
    const chips = Array.from(c.querySelectorAll('[data-board-feat], [data-board-competition]'));
    expect(chips.map((el) => (el.hasAttribute('data-board-feat') ? 'feat' : 'competition'))).toEqual(['feat', 'competition']);
  });
  it('CB12 recent suppresses feats while an eagle feat board retains a rarer feat', () => {
    const r = row({ holes_in_one: 1 });
    expect(view(r).querySelectorAll('[data-board-feat]')).toHaveLength(0);
    expect(view(r, 'eagle').querySelectorAll('[data-board-feat]')).toHaveLength(1);
  });
});
