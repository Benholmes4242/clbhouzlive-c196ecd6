import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import { APPLIED_FILL, SELECTED_EDGE } from '@/components/ui/RailChips';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { LeaderboardsSection, LEADERBOARD_BOARDS } from '@/features/explore-magazine/LeaderboardsSection';
import { makeBoardState } from './factories/boardState';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', ns: ['courses'], resources: { en: { courses } } });
const row: BoardRow = {
  pos: 1, is_tie: false, user_id: 'viewer', display_name: 'Member', profile_photo_url: null,
  whs_score_id: 'score-1', play_date: '2026-10-18', course_id: 'course-1', course_name: 'Course',
  gross_score: 73, course_par: 72, net_score: 72, stableford_points: 36, delta_index: null,
  birdies: 2, holes_in_one: null, albatrosses: null, eagles: null, clean_card: null, beat_par: null,
  sub_80: null, is_competition: null, hcp_at_time: null, sort_value: 0, total_count: 1,
  pool_rounds: 1, pool_courses: 1, pool_members: 1,
};
const populated = () => makeBoardState({ board: 'net', page: {
  data: { rows: [row], total: 1, pool: { rounds: 1, courses: 1, members: 1 } },
  isSuccess: true, isPending: false, isFetching: false,
} as never });
function draw(state = populated(), onRowPress = vi.fn(), onSeeAll = vi.fn()) {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}>
    <LeaderboardsSection state={state} viewerId="viewer" onRowPress={onRowPress} onSeeAll={onSeeAll} />
  </I18nextProvider></MemoryRouter>);
}

describe('CB27 Leaderboards remount', () => {
  it('offers exactly recent, topar, net, stableford, improved and birdies in order', () => {
    expect(LEADERBOARD_BOARDS).toEqual(['recent', 'topar', 'net', 'stableford', 'improved', 'birdies']);
    const { container } = draw();
    const offered = Array.from(container.querySelectorAll('[data-leaderboard-board]'));
    expect(offered.map((el) => el.getAttribute('data-leaderboard-board'))).toEqual(['recent', 'topar', 'net', 'stableford', 'improved', 'birdies']);
    expect(offered.filter((el) => el.getAttribute('aria-checked') === 'true').map((el) => el.getAttribute('data-leaderboard-board'))).toEqual(['net']);
  });
  it('each alternative writes the existing board selection and never changes filters', () => {
    const state = populated();
    const { container } = draw(state);
    for (const board of ['recent', 'topar', 'stableford', 'improved', 'birdies']) {
      const control = container.querySelector(`[data-leaderboard-board="${board}"]`);
      if (!(control instanceof HTMLElement)) throw new Error(`Missing board ${board}`);
      fireEvent.click(control);
      expect(state.changeBoard).toHaveBeenLastCalledWith(board);
    }
    expect(state.changeBoard).toHaveBeenCalledTimes(5);
    expect(state.changeFilters).not.toHaveBeenCalled();
    expect(state.changeScope).not.toHaveBeenCalled();
  });
  it('rows retain their score identity and See-all receives the selected board', () => {
    const onRowPress = vi.fn(), onSeeAll = vi.fn();
    const state = populated();
    state.board = 'topar';
    const { container } = draw(state, onRowPress, onSeeAll);
    const self = container.querySelector('[data-board-self]');
    if (!(self instanceof HTMLElement)) throw new Error('Missing shared self row');
    fireEvent.click(self);
    expect(onRowPress).toHaveBeenCalledWith(row);
    const buttons = within(container).getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onSeeAll).toHaveBeenCalledWith('topar');
  });
  it('removes the entire section when the selected board is empty, including its choices', () => {
    const state = populated();
    const view = draw(state);
    expect(view.container.querySelector('[data-leaderboards-section]')).not.toBeNull();
    view.rerender(<MemoryRouter><I18nextProvider i18n={i18n}>
      <LeaderboardsSection state={makeBoardState({ board: 'birdies' })} viewerId="viewer" onRowPress={vi.fn()} onSeeAll={vi.fn()} />
    </I18nextProvider></MemoryRouter>);
    expect(view.container.querySelector('[data-leaderboards-section]')).toBeNull();
    expect(view.container.querySelectorAll('[data-leaderboard-board]')).toHaveLength(0);
  });
  it('renders nothing before shared scope state resolves', () => {
    const state = populated(); state.ready = false;
    expect(draw(state).container.querySelector('[data-leaderboards-section]')).toBeNull();
  });
  it('renders nothing while the selected-board read is unsettled', () => {
    const state = populated();
    state.page = { ...state.page, isSuccess: false, isPending: true } as never;
    expect(draw(state).container.querySelector('[data-leaderboards-section]')).toBeNull();
  });
  it('reads all six counts from the existing board facet axis', () => {
    const state = populated();
    const counts = { recent: 22, topar: 14, net: 14, stableford: 4, improved: 4, birdies: 3 };
    state.facets = { settled: true, resolved: true, openList: () => [], countFor: vi.fn((axis, key) => axis === 'board' ? counts[key as keyof typeof counts] ?? 0 : 0) };
    const { container } = draw(state);
    expect(Array.from(container.querySelectorAll('[data-board-tile-count]')).map((el) => Number(el.textContent))).toEqual([22, 14, 14, 4, 4, 3]);
    for (const board of LEADERBOARD_BOARDS) expect(state.facets.countFor).toHaveBeenCalledWith('board', board);
  });
  it('the active tile wears the canonical filled-selection ground, the rest the hairline', () => {
    const { container } = draw();
    const selected = container.querySelector('[data-leaderboard-board="net"]');
    if (!(selected instanceof HTMLElement)) throw new Error('Missing selected board tile');
    /* jsdom normalises the background shorthand's spacing, so assert its value. */
    expect(selected.style.background).toBe('rgba(255, 255, 255, 0.06)');
    expect(selected.style.border).toBe(`1px solid ${SELECTED_EDGE}`);
    const resting = container.querySelector('[data-leaderboard-board="recent"]');
    if (!(resting instanceof HTMLElement)) throw new Error('Missing resting board tile');
    expect(resting.style.background).toBe('transparent');
    expect(resting.style.border).toBe(`1px solid ${A.BORDER}`);
  });
});