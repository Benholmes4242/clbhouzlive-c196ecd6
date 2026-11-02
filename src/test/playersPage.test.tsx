import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  tour: 'pga' as string,
  follows: new Set<string>(),
  race: null as unknown,
  user: null as { id: string } | null,
  myScoring: null as unknown,
  holeAverages: null as unknown,
}));

function rankedRow(i: number) {
  return {
    playerId: `p${i}`, rank: i, name: `Player ${String.fromCharCode(64 + ((i % 26) || 26))}${i}`, country: null, countryCode: null,
    photoUrl: null, tourCode: 'pga', stat: 5000 - i * 10, wins: i === 1 ? 3 : 0, top10s: 2, eventsPlayed: 20,
    playerKey: `p${i}`, rawName: `Player ${i}`, updatedAt: null,
    pga: h.tour === 'pga' ? { scoring_average: 69 + i / 100, strokes_gained_tee_green: 1, strokes_gained_putting: 0.5, driving_distance: 300, driving_accuracy: 60, greens_in_reg: 70, sand_saves: 50, putting_average: 1.7, earnings: 1_000_000, top_25s: 4, cuts_made: 10, raw_data: null } : null,
  };
}

vi.mock('@/features/tourhub/players-v2/data/usePlayersRanking', () => ({
  usePlayersRanking: () => ({ data: { synced: true, statLabel: 'PTS', rows: Array.from({ length: 120 }, (_, i) => rankedRow(i + 1)) }, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/features/tourhub/players-v2/data/useLivePlayerIds', () => ({ useLivePlayerIds: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/players-v2/data/useWorldRankLookup', () => ({ useWorldRankLookup: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/players-v2/data/useStandingsMovement', () => ({ useStandingsMovement: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/players-v2/data/useFieldForm', () => ({ useFieldForm: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/players-v2/data/useScorecardStats', () => ({
  useScorecardStats: () => ({ data: new Map(Array.from({ length: 120 }, (_, i) => [`p${i + 1}`, { player_id: `p${i + 1}`, rounds: 40, holes: 720, scoring_avg: 70, birdies_per_round: 4, bogey_rate: 0.12, par3: 0.1, par4: 0.05, par5: -0.4 }])) }),
}));
vi.mock('@/features/tourhub/players-v2/data/useTourRace', () => ({ useTourRace: () => ({ data: h.race }) }));
vi.mock('@/features/tourhub/players-v2/data/resolveStandingsSeason', () => ({ useStandingsSeason: () => ({ data: 2027, isError: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user, session: null, loading: false }) }));
vi.mock('@/features/tourhub/players-v2/you/useYouAndTour', () => ({ useTourHoleAverages: () => ({ data: h.holeAverages }), useMyHoleScoring: () => ({ data: h.myScoring }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: h.follows, busy: false, error: null, toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { PlayersTab } from '@/features/tourhub/players-v2/PlayersTab';
import SeasonStatsRedirect from '@/features/tourhub/players-v2/SeasonStatsRedirect';
import { DESTINATIONS } from '@/features/tourhub/components/TourSideMenu';

const stake = (after: number, sort: number, featured = true) => ({
  after_position: after, explainer: 'Explainer.', featured, foot: null, kicker: `LINE ${after}`, line_label: `The ${after} line`,
  pill_label: `Line ${after}`, side: null, sort, season_year: 2027, tour_code: 'pga', id: `s${after}`, updated_at: '',
});

function raceWith(stakes: unknown[], events: Array<{ finished: boolean }> = []) {
  return {
    race: { title: 'FedEx Cup', status: 'live', phase_label: 'FEDEXCUP FALL', phase_start: '2026-09-01', closes_on: '2026-11-30', season_year: 2027, tour_code: 'pga', updated_at: '' },
    stakes,
    events: events.map((e, i) => ({ id: `e${i}`, name: `Event ${i}`, startDate: '2026-11-05', finished: e.finished })),
  };
}

function Loc() {
  const l = useLocation();
  return <div data-testid="loc" data-search={l.search} />;
}

function mount(path = '/tourhub?tab=players') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tourhub" element={<><PlayersTab /><Loc /></>} />
        <Route path="/tourhub/season-stats" element={<SeasonStatsRedirect />} />
      </Routes>
    </MemoryRouter>,
  );
}

const search = () => new URLSearchParams(screen.getByTestId('loc').getAttribute('data-search') ?? '');

beforeEach(() => {
  cleanup();
  h.tour = 'pga';
  h.follows = new Set();
  h.user = null;
  h.myScoring = null;
  h.holeAverages = null;
  h.race = raceWith([stake(60, 2), stake(100, 1), stake(110, 3, false)], [{ finished: true }, { finished: true }, { finished: false }, { finished: false }, { finished: false }]);
});

describe('Players front page', () => {
  it('renders a line card per featured stake in sort order, three rows either side of the drawn line', () => {
    const { container } = mount();
    const cards = [...container.querySelectorAll('[data-front-card="line"]')];
    expect(cards).toHaveLength(2);
    const ranks = (card: Element) => [...card.querySelectorAll('[data-mini-row]')].map((r) => r.getAttribute('data-mini-row'));
    expect(ranks(cards[0])).toEqual(['98', '99', '100', '101', '102', '103']);
    expect(ranks(cards[1])).toEqual(['58', '59', '60', '61', '62', '63']);
    for (const card of cards) {
      const kids = [...card.querySelector('[data-minis]')!.children];
      expect(kids[3].hasAttribute('data-drawn-line')).toBe(true);
    }
  });

  it('hides Your players with no follows and shows it with one', () => {
    const { container, unmount } = mount();
    expect(container.querySelector('[data-front-card="your_players"]')).toBeNull();
    unmount();
    h.follows = new Set(['p11']);
    const second = mount();
    expect(second.container.querySelector('[data-front-card="your_players"]')).not.toBeNull();
  });

  it('the clock counts finished against remaining events', () => {
    const { container } = mount();
    const clock = container.querySelector('[data-race-clock]')!;
    expect(clock.querySelectorAll('[data-seg="done"]')).toHaveLength(2);
    expect(clock.querySelectorAll('[data-seg="todo"]')).toHaveLength(3);
    expect(clock.querySelector('[data-clock-left]')!.textContent).toContain('3');
  });

  it('the All players button opens ?view=all', () => {
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-all-players]')!);
    expect(search().get('view')).toBe('all');
    expect(container.querySelector('[data-players-field]')).not.toBeNull();
  });

  it('with no race row, nothing invents a line', () => {
    h.race = { race: null, stakes: [], events: [] };
    const { container } = mount();
    expect(container.querySelector('[data-front-card="line"]')).toBeNull();
    expect(container.querySelector('[data-race-clock]')).toBeNull();
    expect(container.querySelector('[data-front-card="race"]')).not.toBeNull();
    expect(container.querySelector('[data-all-players]')).not.toBeNull();
  });
});

describe('Players full field', () => {
  it('lens chips switch lists and update the URL', () => {
    const { container } = mount('/tourhub?tab=players&view=all');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(container.querySelector('[data-pills="standings"]')).not.toBeNull();
    fireEvent.click(tabs[2]);
    expect(search().get('lens')).toBe('stats');
    expect(container.querySelector('[data-pills="stats"]')).not.toBeNull();
    fireEvent.click(tabs[1]);
    expect(search().get('lens')).toBe('form');
    expect(container.querySelector('[data-form-key]')).not.toBeNull();
  });

  it('Stats pills differ for PGA and other tours', () => {
    const pills = (c: HTMLElement) => [...c.querySelectorAll('[data-pills="stats"] [data-pill]')].map((p) => p.getAttribute('data-pill'));
    const pga = mount('/tourhub?tab=players&view=all&lens=stats');
    const pgaPills = pills(pga.container);
    pga.unmount();
    h.tour = 'euro';
    const euro = mount('/tourhub?tab=players&tour=euro&view=all&lens=stats');
    const euroPills = pills(euro.container);
    expect(pgaPills).toContain('strokes_gained_tee_green');
    expect(euroPills).not.toContain('strokes_gained_tee_green');
    expect(euroPills).toContain('par5');
    expect(pgaPills).not.toContain('par5');
  });

  it('draws a line after every stake position, featured or not', () => {
    const { container } = mount('/tourhub?tab=players&view=all');
    const lines = [...container.querySelectorAll('[data-field-line]')].map((l) => l.getAttribute('data-field-line'));
    expect(lines).toEqual(['60', '100', '110']);
    for (const pos of lines) {
      const line = container.querySelector(`[data-field-line="${pos}"]`)!;
      expect(line.previousElementSibling?.getAttribute('data-field-row')).toBe(pos);
    }
  });

  it('movement reads "–" when the RPC returns nothing', () => {
    const { container } = mount('/tourhub?tab=players&view=all');
    const moves = [...container.querySelectorAll('[data-field-row] [data-move]')];
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.getAttribute('data-move') === 'none' && m.textContent === '–')).toBe(true);
  });
});

describe('Players routing', () => {
  it('/tourhub/season-stats?tour=X redirects to the full field Stats lens', () => {
    h.tour = 'euro';
    mount('/tourhub/season-stats?tour=euro');
    const s = search();
    expect(s.get('tab')).toBe('players');
    expect(s.get('tour')).toBe('euro');
    expect(s.get('view')).toBe('all');
    expect(s.get('lens')).toBe('stats');
  });

  it('the side menu has five items and no Leaders', () => {
    expect(DESTINATIONS).toHaveLength(5);
    expect(DESTINATIONS.map((d) => d.id)).not.toContain('leaderboards');
  });

  it('the field rows are in the list', () => {
    const { container } = mount('/tourhub?tab=players&view=all');
    expect(within(container).getAllByRole('button').length).toBeGreaterThan(100);
  });
});

describe('You and the tour placement', () => {
  it('sits after Your players and before In form; with no follows, after the race card', () => {
    h.user = { id: 'u1' };
    h.myScoring = { rounds: 20, holes_par3: 80, holes_par4: 200, holes_par5: 80, par3: 0.82, par4: 0.86, par5: 0.71, bogey_rate: 0.62 };
    h.holeAverages = { players: 70, holes: 10000, par3: -0.004, par4: -0.062, par5: -0.508, bogey_rate: 0.137 };
    h.follows = new Set(['p11']);
    const order = (c: HTMLElement) => [...c.querySelectorAll('[data-front-card]')].map((e) => e.getAttribute('data-front-card'));
    const a = mount();
    const o1 = order(a.container);
    const you1 = o1.indexOf('you_and_tour');
    expect(you1).toBeGreaterThan(-1);
    expect(o1[you1 - 1]).toBe('your_players');
    // Everything after the card belongs below In form's slot (In form, then stat leaders).
    expect(o1.slice(you1 + 1).every((c) => c === 'in_form' || c === 'stat_leaders')).toBe(true);
    a.unmount();
    h.follows = new Set();
    const o2 = order(mount().container);
    expect(o2[o2.indexOf('you_and_tour') - 1]).toBe('race');
  });
});
