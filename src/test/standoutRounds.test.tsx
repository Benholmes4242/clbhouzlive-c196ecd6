import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  query: { data: [] as unknown[], isPending: false, isError: false },
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user, loading: false }) }));
vi.mock('@/components/courses/browse/useCoursesStandoutRounds', async (orig) => ({
  ...(await orig<typeof import('@/components/courses/browse/useCoursesStandoutRounds')>()),
  useCoursesStandoutRounds: () => f.query,
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => new Map() }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({
  RoundDetailSheet: ({ open, scoreId }: { open: boolean; scoreId: string | null }) => (open ? <div data-testid="round-sheet" data-score={scoreId ?? ''} /> : null),
}));
vi.mock('@/lib/whs/hooks', () => ({ prefetchRoundDetail: vi.fn() }));
vi.mock('@/lib/whs/useRoundCourseContext', () => ({ prefetchRoundCourseContext: vi.fn() }));

import { mapCoursesStandoutRow, type CoursesStandoutRound } from '@/components/courses/browse/useCoursesStandoutRounds';
import { standoutLine, standoutStamp } from '@/components/courses/browse/standoutRoundsRules';
import { StandoutPhotoHeader, StandoutRoundsSection } from '@/components/courses/browse/StandoutRoundsSection';
import { RoundCard } from '@/features/explore-magazine/watch/RoundCard';
import { PageLoadGate } from '@/components/courses/browse/PageLoadGate';

const row = (over: Partial<Record<string, unknown>> = {}): CoursesStandoutRound => mapCoursesStandoutRow({
  pos: 1, whs_score_id: 's1', user_id: 'u1', display_name: 'Sam Reed', profile_photo_url: null,
  play_date: '2026-11-04', course_id: 'c1', course_name: 'Sundridge Park (East Course)',
  course_region: 'Kent', course_sub_country: 'England', course_image: null,
  gross_score: 80, course_par: 71, net_score: 70, course_handicap: 10, is_competition: false,
  stableford_points: 30, holes_in_one: 0, albatrosses: 0, eagles: 0, birdies: 0, longest_birdie_run: 0,
  feat_kind: 'birdies', feat_holes: null, feat_par: null, feat_yards: null, ...over,
});

beforeEach(() => { f.user = { id: 'viewer' }; f.query = { data: [], isPending: false, isError: false }; });
afterEach(cleanup);

describe('(a) standoutStamp', () => {
  it.each([
    [{ feat_kind: 'ace', holes_in_one: 1 }, 'HOLE IN ONE'],
    [{ feat_kind: 'ace', holes_in_one: 2 }, '2 HOLES IN ONE'],
    [{ feat_kind: 'albatross', albatrosses: 1 }, 'ALBATROSS'],
    [{ feat_kind: 'albatross', albatrosses: 2 }, '2 ALBATROSSES'],
    [{ feat_kind: 'under_par', gross_score: 69 }, 'UNDER PAR'],
    [{ feat_kind: 'eagle', eagles: 1 }, 'EAGLE'],
    [{ feat_kind: 'eagle', eagles: 2 }, '2 EAGLES'],
    [{ feat_kind: 'points', stableford_points: 42 }, '42 POINTS'],
    [{ feat_kind: 'birdies', birdies: 6 }, '6 BIRDIES'],
  ])('%o → %s', (over, want) => expect(standoutStamp(row(over))).toBe(want));
});

describe('(b) standoutLine primary kinds', () => {
  it('ace with hole and yards', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [6], feat_yards: 152, stableford_points: null }))).toBe('<b>Hole in one</b> on the 6th, 152 yards'));
  it('ace drops yards when null', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [6], stableford_points: null }))).toBe('<b>Hole in one</b> on the 6th'));
  it('ace drops the hole part when holes are empty', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [], feat_yards: 152, stableford_points: null }))).toBe('<b>Hole in one</b>'));
  it('two aces list both holes', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 2, feat_holes: [4, 13], stableford_points: null }))).toBe('<b>2 holes in one</b>, on the 4th and 13th'));
  it('albatross with par', () => expect(standoutLine(row({ feat_kind: 'albatross', albatrosses: 1, feat_holes: [5], feat_par: 5, stableford_points: null }))).toBe('<b>Albatross</b> on the 5th, a par 5'));
  it('two albatrosses list three-way', () => expect(standoutLine(row({ feat_kind: 'albatross', albatrosses: 2, feat_holes: [2, 4, 13], stableford_points: null }))).toBe('<b>2 albatrosses</b>, on the 2nd, 4th and 13th'));
  it('under par with birdies', () => expect(standoutLine(row({ feat_kind: 'under_par', gross_score: 69, birdies: 4 }))).toBe('<b>2 under par</b>, with 4 birdies'));
  it('under par with one birdie has no tail', () => expect(standoutLine(row({ feat_kind: 'under_par', gross_score: 69, birdies: 1 }))).toBe('<b>2 under par</b>'));
  it('single eagle', () => expect(standoutLine(row({ feat_kind: 'eagle', eagles: 1, feat_holes: [13], stableford_points: null }))).toBe('<b>Eagle</b> on the 13th'));
  it('two eagles', () => expect(standoutLine(row({ feat_kind: 'eagle', eagles: 2, feat_holes: [4, 13], stableford_points: null }))).toBe('<b>2 eagles</b>, on the 4th and 13th'));
  it('points playing off', () => expect(standoutLine(row({ feat_kind: 'points', stableford_points: 42, course_handicap: 21 }))).toBe('<b>42 points</b>, playing off 21'));
  it('points with a plus handicap', () => expect(standoutLine(row({ feat_kind: 'points', stableford_points: 42, course_handicap: -2 }))).toBe('<b>42 points</b>, playing off +2'));
  it('points with a null handicap', () => expect(standoutLine(row({ feat_kind: 'points', stableford_points: 42, course_handicap: null }))).toBe('<b>42 points</b>'));
  it('birdies in a row', () => expect(standoutLine(row({ feat_kind: 'birdies', birdies: 6, longest_birdie_run: 3 }))).toBe('<b>6 birdies</b>, 3 in a row'));
  it('birdies without a run', () => expect(standoutLine(row({ feat_kind: 'birdies', birdies: 6, longest_birdie_run: 2 }))).toBe('<b>6 birdies</b>'));
});

describe('(c) secondary fact', () => {
  it('ace with 41 points shows · 41 points', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [6], feat_yards: 152, stableford_points: 41 }))).toBe('<b>Hole in one</b> on the 6th, 152 yards \u00B7 41 points'));
  it('under par with 6 birdies adds no birdies tail', () => expect(standoutLine(row({ feat_kind: 'under_par', gross_score: 69, birdies: 6, stableford_points: 38 }))).toBe('<b>2 under par</b>, with 6 birdies'));
  it('eagle plus 42 points shows · 42 points', () => expect(standoutLine(row({ feat_kind: 'eagle', eagles: 1, feat_holes: [13], stableford_points: 42 }))).toBe('<b>Eagle</b> on the 13th \u00B7 42 points'));
  it('birdies primary with 39 points adds nothing', () => expect(standoutLine(row({ feat_kind: 'birdies', birdies: 6, stableford_points: 39 }))).toBe('<b>6 birdies</b>'));
  it('ace under par shows the under-par fact, never the primary twice', () => expect(standoutLine(row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [6], gross_score: 69, stableford_points: 44 }))).toBe('<b>Hole in one</b> on the 6th \u00B7 2 under par'));
});

const wrap = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/courses']}>
        <Routes>
          <Route path="/courses" element={<PageLoadGate expect={['standoutRounds']} fallback={<div data-testid="fallback" />}>{ui}</PageLoadGate>} />
          <Route path="/profile/:id" element={<div data-testid="profile-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('(d) RoundCard points prop', () => {
  it('the points prop fills the POINTS cell; without it Lately here keeps its computed (absent) points', () => {
    const r = row({ feat_kind: 'points', stableford_points: 42 });
    const { container, unmount } = render(<MemoryRouter><RoundCard round={r} shapes={new Map()} locale="en" points={42} /></MemoryRouter>);
    expect(container.querySelector('[data-score-cell="points"] [data-score-figure]')?.textContent).toBe('42');
    unmount();
    const plain = render(<MemoryRouter><RoundCard round={r} shapes={new Map()} locale="en" /></MemoryRouter>);
    expect(plain.container.querySelector('[data-score-cell="points"]')).toBeNull();
    expect(plain.container.querySelector('[data-lately-line]')?.textContent).not.toBe('');
    expect(plain.container.querySelector('.lately-tile--photo')).toBeNull();
  });
});

describe('(e) photo header', () => {
  it('renders course, place and stamp, and the tile gains lately-tile--photo', () => {
    const r = row({ feat_kind: 'ace', holes_in_one: 1, feat_holes: [6] });
    const { container } = render(<MemoryRouter><RoundCard round={r} shapes={new Map()} locale="en" header={<StandoutPhotoHeader row={r} />} line={standoutLine(r)} /></MemoryRouter>);
    const tile = container.querySelector('.lately-tile')!;
    expect(tile.classList.contains('lately-tile--photo')).toBe(true);
    expect(tile.firstElementChild?.hasAttribute('data-standout-photo')).toBe(true);
    expect(container.querySelector('[data-standout-course]')?.textContent).toBe('Sundridge Park (East Course)');
    expect(container.querySelector('[data-standout-place]')?.textContent).toBe('Kent, England');
    expect(container.querySelector('[data-standout-stamp]')?.textContent).toBe('HOLE IN ONE');
    expect(container.querySelector('[data-lately-line] b')?.textContent).toBe('Hole in one');
  });
});

describe('(f) section states', () => {
  it('signed out renders nothing and reports ready', () => {
    f.user = null;
    const { container } = wrap(<StandoutRoundsSection />);
    expect(screen.queryByTestId('fallback')).toBeNull();
    expect(container.querySelector('[data-standout-rounds]')).toBeNull();
  });
  it('error renders nothing and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    f.query = { data: undefined as unknown as unknown[], isPending: false, isError: true };
    const { container } = wrap(<StandoutRoundsSection />);
    expect(container.querySelector('[data-standout-rounds]')).toBeNull();
    expect(screen.queryByTestId('fallback')).toBeNull();
    expect(warn).toHaveBeenCalledWith('[courses standout] read failed; section hidden');
    warn.mockRestore();
  });
  it('one row renders nothing', () => {
    f.query = { data: [row()], isPending: false, isError: false };
    const { container } = wrap(<StandoutRoundsSection />);
    expect(container.querySelector('[data-standout-rounds]')).toBeNull();
  });
  it('two or more rows render the head and one card each', () => {
    f.query = { data: [row(), row({ whs_score_id: 's2', user_id: 'u2' }), row({ whs_score_id: 's3', user_id: 'u3' })], isPending: false, isError: false };
    const { container } = wrap(<StandoutRoundsSection />);
    expect(container.querySelector('[data-standout-rounds]')).not.toBeNull();
    expect(container.querySelectorAll('[data-standout-rail] .lately-tile--photo')).toHaveLength(3);
  });
});

describe('(g) taps', () => {
  it('a card tap opens the round sheet; the who row opens the profile', () => {
    f.query = { data: [row(), row({ whs_score_id: 's2', user_id: 'u2' })], isPending: false, isError: false };
    const { container } = wrap(<StandoutRoundsSection />);
    fireEvent.click(container.querySelectorAll('[data-rounds-shelf-card="round"]')[1]);
    expect(screen.getByTestId('round-sheet').getAttribute('data-score')).toBe('s2');
    fireEvent.click(container.querySelectorAll('[data-lately-who]')[0]);
    expect(screen.getByTestId('profile-page')).toBeTruthy();
  });
});
