import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  loading: false,
  error: false,
  rows: 120,
}));

function rankedRow(i: number) {
  return {
    playerId: `p${i}`, rank: i, name: `Player ${i}`, country: null, countryCode: null,
    photoUrl: null, tourCode: 'pga', stat: 5000 - i * 10, wins: i === 1 ? 3 : 0, top10s: 2, eventsPlayed: 20,
    playerKey: `p${i}`, rawName: `Player ${i}`, updatedAt: null,
    pga: { scoring_average: 69 + i / 100, strokes_gained_tee_green: 1, strokes_gained_putting: 0.5, driving_distance: 300, driving_accuracy: 60, greens_in_reg: 70, sand_saves: 50, putting_average: 1.7, earnings: 1_000_000, top_25s: 4, cuts_made: 10, raw_data: null },
  };
}

vi.mock('@/features/tourhub/players-v2/data/usePlayersRanking', () => ({
  usePlayersRanking: () => ({
    data: h.error ? undefined : { synced: true, statLabel: 'PTS', rows: Array.from({ length: h.rows }, (_, i) => rankedRow(i + 1)) },
    isLoading: h.loading, isError: h.error, refetch: vi.fn(),
  }),
}));
vi.mock('@/features/tourhub/players-v2/data/useLivePlayerIds', () => ({ useLivePlayerIds: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/players-v2/data/useWorldRankLookup', () => ({ useWorldRankLookup: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/players-v2/data/useStandingsMovement', () => ({ useStandingsMovement: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/players-v2/data/useFieldForm', () => ({ useFieldForm: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/players-v2/data/useScorecardStats', () => ({ useScorecardStats: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/players-v2/data/useTourRace', () => ({
  useTourRace: () => ({ data: { race: { title: 'FedEx Cup', status: 'live', phase_label: null, phase_start: null, closes_on: null, season_year: 2027, tour_code: 'pga', updated_at: '' }, stakes: [], events: [] } }),
}));
vi.mock('@/features/tourhub/players-v2/data/resolveStandingsSeason', () => ({ useStandingsSeason: () => ({ data: 2027, isError: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, session: null, loading: false }) }));
vi.mock('@/features/tourhub/players-v2/you/useYouAndTour', () => ({ useTourHoleAverages: () => ({ data: null }), useMyHoleScoring: () => ({ data: null }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set(), busy: false, error: null, toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { PlayersTab } from '@/features/tourhub/players-v2/PlayersTab';

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

function mount(path2 = '/tourhub?tab=players') {
  return render(
    <MemoryRouter initialEntries={[path2]}>
      <Routes>
        <Route path="/tourhub" element={<PlayersTab />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  h.loading = false;
  h.error = false;
  h.rows = 120;
});

describe('Players tab on the shared islands', () => {
  const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
  const tab = source('src/features/tourhub/players-v2/PlayersTab.tsx');

  it('renders directly like live/schedule, outside the TourPageShell wrapper', () => {
    expect(main).toContain("isHubRoot || activeTab === 'live' || activeTab === 'schedule' || activeTab === 'players' ? renderTab() : (");
    // The shell branch (AppHeader + SubTabTourControl) is unreachable for players.
    const shellBranch = main.slice(main.indexOf('? renderTab() : ('));
    expect(shellBranch).toContain('SubTabTourControl');
    expect(shellBranch).not.toContain("activeTab === 'players'");
  });

  it('keeps the scroll-to-top control TourPageShell used to supply', () => {
    expect(tab).toContain('<ScrollToTopGlass />');
  });

  it('the hero is the first child of the front page, 420 tall with no top margin', () => {
    const { container } = mount();
    const front = container.querySelector('[data-players-front]')!;
    const hero = front.firstElementChild as HTMLElement;
    expect(hero.getAttribute('data-players-hero')).not.toBeNull();
    expect(hero.style.height).toBe('420px');
    expect(hero.style.marginTop).toBe('0px');
  });

  it('the title and search button sit inside the hero under the islands', () => {
    const { container } = mount();
    const hero = container.querySelector('[data-players-hero]')!;
    const h1 = hero.querySelector('h1')!;
    expect(h1.textContent).toBe('FedEx Cup');
    const row = h1.parentElement as HTMLElement;
    expect(row.style.top).toContain('--chrome-clearance');
    expect(row.style.left).toBe('24px');
    expect(row.style.right).toBe('24px');
    expect(row.querySelector('[aria-label="Search players"]')).not.toBeNull();
    // No title row above the hero any more.
    const front = container.querySelector('[data-players-front]')!;
    expect((front.firstElementChild as HTMLElement).contains(h1)).toBe(true);
  });

  it('the hero wash carries the top shade for the status bar and title', () => {
    const { container } = mount();
    const wash = container.querySelector('[data-players-hero] [aria-hidden="true"]') as HTMLElement;
    expect(wash.style.background).toContain('rgba(10, 10, 12, 0.35) 0%, rgba(10, 10, 12, 0) 32%');
  });

  it('the all-players view starts under the islands', () => {
    const { container } = mount('/tourhub?tab=players&view=all');
    const field = container.querySelector('[data-players-field]')!;
    const wrap = field.parentElement as HTMLElement;
    expect(wrap.style.paddingTop).toContain('--chrome-clearance');
  });

  it('the error state starts under the islands', () => {
    h.error = true;
    const { container } = mount();
    const retry = container.querySelector('button')!;
    const box = retry.closest('div')!.parentElement as HTMLElement;
    expect(box.style.paddingTop).toContain('--chrome-clearance');
  });

  it('the empty state starts under the islands', () => {
    h.rows = 0;
    const { container } = mount();
    const page = container.querySelector('[data-players-page]')!;
    const wrap = page.firstElementChild as HTMLElement;
    expect(wrap.style.paddingTop).toContain('--chrome-clearance');
  });

  it('the skeleton opens with a 420 block at the very top and no title placeholder', () => {
    h.loading = true;
    const { container } = mount();
    const skel = container.querySelector('[data-players-skeleton]')!;
    const first = skel.firstElementChild as HTMLElement;
    expect(first.style.height).toBe('420px');
    expect(first.style.marginTop).toBe('0px');
    expect(skel.querySelector('[style*="height: 36px"]')).toBeNull();
  });
});
