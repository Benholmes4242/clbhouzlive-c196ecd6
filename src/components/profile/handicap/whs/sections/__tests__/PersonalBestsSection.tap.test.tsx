import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../../../../../../public/locales/en/common.json';
import type { WhsScore } from '@/lib/whs/types';
import PersonalBestsSection from '../PersonalBestsSection';

const state = vi.hoisted(() => ({ scores: [] as WhsScore[], sheet: vi.fn() }));
vi.mock('@/lib/whs/hooks', () => ({ useAllScores: () => ({ data: state.scores, isFetched: true }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('../round-detail/RoundDetailSheet', () => ({
  default: (props: { onClose: () => void }) => {
    state.sheet(props);
    return <div role="dialog"><button onClick={props.onClose}>Close round</button></div>;
  },
}));

const score = (id: string, gross: number, diff: number, points: number, index: number): WhsScore => ({
  id, play_date: '2026-10-01', adjusted_gross: gross, handicap_differential: diff,
  stableford_points: points, handicap_index_at_time: index, course_par: 72,
  course_rating: 72, slope_rating: 113, marker_name: null, is_counter: true,
  is_nine_hole: false, total_holes: 18, course_id: 'course',
  course: { name: 'Record Course', country_name: 'England', country_code: 'GB' },
});

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
});
beforeEach(() => {
  state.sheet.mockClear();
  state.scores = [score('gross-id', 70, 4, 38, 0), score('stableford-id', 78, 8, 48, 0),
    score('course-id', 74, 1, 36, 0), score('handicap-id', 75, 7, 35, 20)];
});
afterEach(cleanup);

const mount = () => render(
  <I18nextProvider i18n={i18n}>
    <PersonalBestsSection connectionId="connection" userId="profile-owner" currentHandicap={5} />
  </I18nextProvider>,
);

describe('Records to break taps — BRIEF_HANDICAP_TAB_REBUILD_8A', () => {
  it.each([
    ['Lowest score', 'gross-id'],
    ['Best stableford', 'stableford-id'],
    ['Best round against the course', 'course-id'],
    ['Best against your handicap', 'handicap-id'],
  ])('%s opens its own existing round id', (name, scoreId) => {
    mount();
    expect(state.sheet).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name} · Record Course`) }));
    expect(state.sheet).toHaveBeenLastCalledWith(expect.objectContaining({
      scoreId, connectionId: 'connection', profileUserId: 'profile-owner', open: true,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Close round' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a malformed score without an id cannot open an empty sheet', () => {
    state.scores = [score('', 70, 4, 38, 5)];
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    fireEvent.click(screen.getByText('Lowest score'));
    expect(state.sheet).not.toHaveBeenCalled();
  });
});