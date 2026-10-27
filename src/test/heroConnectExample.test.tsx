import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import profileEnglish from '../../public/locales/en/profile.json';

vi.mock('@/features/coach/BusinessCoachCards', async importOriginal => ({ ...(await importOriginal<typeof import('@/features/coach/BusinessCoachCards')>()), CoachProfileLine: () => null }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({
  decline: vi.fn(),
  navigate: vi.fn(),
  history: [] as Array<{ observed_at: string; handicap_index: number }>,
  state: { connected: false, settled: true, connection: null, trend: null, anyError: false },
}));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => f.navigate,
}));
vi.mock('@/lib/whs/useDeclineHandicapChip', () => ({ useDeclineHandicapChip: () => f.decline }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => f.state }));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapTrend: () => ({ data: { current: 28.7 }, isFetched: true, isError: false }),
  useHandicapHistory: () => ({ data: f.history, isFetched: true, isError: false }),
}));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({ useProfileRounds: () => ({ isSuccess: true, data: [] }), isFullEighteen: () => false }));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null, secondaryClubs: [], isPrivate: false, isLoading: false }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [], isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));

import { ProfileHero } from '@/components/profile/hero/ProfileHero';
import { CONNECT_EXAMPLE, EXAMPLE_DISPLAY_STYLE, HeroConnectExample } from '@/components/profile/hero/HeroConnectExample';
import { HeroHandicapDisplay } from '@/components/profile/hero/HeroHandicapDisplay';
import { analyticsEvents } from '@/utils/analyticsEvents';

function hero(p: { hideConnectPrompt?: boolean; isSelf?: boolean; indexValue?: number } = {}) {
  return <MemoryRouter><ProfileHero userId="u1" viewerUserId="u1" displayName="Alex Doe" isSelf={p.isSelf ?? true} hideConnectPrompt={p.hideConnectPrompt} indexValue={p.indexValue ?? 41.9} roundsCount={null} ratedCount={null} onStatTap={() => {}} /></MemoryRouter>;
}
const panel = () => screen.queryByTestId('hero-connect-panel');
const english = createInstance();
void english.init({ lng: 'en', defaultNS: 'profile', resources: { en: { profile: profileEnglish } } });
const t = english.getFixedT('en', 'profile');
beforeEach(() => {
  f.state = { connected: false, settled: true, connection: null, trend: null, anyError: false };
  f.decline.mockReset().mockResolvedValue(undefined);
  f.navigate.mockReset();
  f.history = [];
  vi.mocked(analyticsEvents.track).mockClear();
});

describe('CE1 fixed connected example', () => {
  it('crops the example wrapper with both masks and the approved opacity', () => {
    render(hero());
    const display = panel()?.querySelector<HTMLElement>('[data-example-display]');
    expect(display?.style.opacity).toBe('0.5');
    expect(display?.style.maxHeight).toBe('205px');
    expect(display?.style.overflow).toBe('hidden');
    expect(display?.style.maskImage).toContain('58%');
    // jsdom drops vendor-prefixed mask properties, so this one is asserted at the source rather than on the element.
    expect(EXAMPLE_DISPLAY_STYLE.WebkitMaskImage).toContain('58%');
  });
  it('renders no example axis strings or counting sentence', () => {
    render(<MemoryRouter><HeroConnectExample t={t} /></MemoryRouter>);
    const text = screen.getByTestId('hero-connect-panel').textContent ?? '';
    expect(text).not.toContain('90 days ago');
    expect(text).not.toContain('Today');
    expect(text).not.toContain('Two of these five are counting towards your index.');
    expect(text).not.toContain('Green rounds lowered it.');
  });
  it('retains the connected axis and known counting sentence', () => {
    const view = render(<HeroHandicapDisplay
      t={t} shownIndex={CONNECT_EXAMPLE.index} deltaLines={CONNECT_EXAMPLE.movements.map((line) => ({ ...line }))}
      slot={null} verdict={null} series={[...CONNECT_EXAMPLE.series]} chartColor="currentColor" chartFillTop={0.28}
      axisWindow="90 days" windowDays={90} bars={CONNECT_EXAMPLE.rounds.map((round) => ({ ...round }))}
      byId={new Map(CONNECT_EXAMPLE.rounds.map((round) => [round.id, round]))}
      countingKnown countingN={2} loweredN={2} tilesWord="five" isSelf
      onStatTap={() => {}} tap={() => () => {}} navigate={f.navigate}
    />);
    expect(view.container.textContent).toContain('90 days ago');
    expect(view.container.textContent).toContain('Today');
    expect(view.container.textContent).toContain('Two of these five are counting towards your index.');
  });
  it('clicking every example form tile fires no analytics or navigation', () => {
    render(hero());
    const tiles = screen.getByTestId('hero-connect-panel').querySelectorAll('[data-example-form-tile]');
    expect(tiles).toHaveLength(5);
    tiles.forEach((tile) => {
      expect(tile).toBeInstanceOf(HTMLButtonElement);
      fireEvent.click(tile);
    });
    expect(analyticsEvents.track).not.toHaveBeenCalled();
    expect(f.navigate).not.toHaveBeenCalled();
  });
  it('clicking the example chart fires no analytics or navigation', () => {
    render(hero());
    const chart = screen.getByTestId('hero-connect-panel').querySelector('[data-example-chart]');
    expect(chart).toBeInstanceOf(HTMLButtonElement);
    if (!chart) throw new Error('Example chart button missing');
    fireEvent.click(chart);
    expect(analyticsEvents.track).not.toHaveBeenCalled();
    expect(f.navigate).not.toHaveBeenCalled();
  });
  it('clicking the example index figure fires no analytics or navigation', () => {
    render(hero());
    const figure = screen.getByTestId('hero-connect-panel').querySelector('[data-example-index]');
    expect(figure).toBeInstanceOf(HTMLButtonElement);
    if (!figure) throw new Error('Example index button missing');
    fireEvent.click(figure);
    expect(analyticsEvents.track).not.toHaveBeenCalled();
    expect(f.navigate).not.toHaveBeenCalled();
  });
  it('appears for an unconnected member on their own profile', () => {
    render(hero());
    expect(panel()).not.toBeNull();
  });
  it('connected chart and index omit example handles and retain their analytics calls', () => {
    f.state.connected = true;
    f.history = [
      { observed_at: '2026-01-01', handicap_index: 42.7 },
      { observed_at: '2026-10-01', handicap_index: 41.9 },
    ];
    const view = render(hero());
    expect(view.container.querySelector('[data-example-chart]')).toBeNull();
    expect(view.container.querySelector('[data-example-index]')).toBeNull();
    const chart = view.container.querySelector('svg[viewBox="0 0 361 64"]')?.closest('button');
    expect(chart).toBeInstanceOf(HTMLButtonElement);
    if (!chart) throw new Error('Connected chart button missing');
    fireEvent.click(chart);
    expect(analyticsEvents.track).toHaveBeenCalledWith('profile_index_chart_tap', { window_days: expect.any(Number) });
    fireEvent.click(screen.getByRole('button', { name: '41.9' }));
    expect(analyticsEvents.track).toHaveBeenCalledWith('profile_hero_stat_tap', { stat: 'index' });
    expect(analyticsEvents.track).toHaveBeenCalledTimes(2);
  });
  it('is absent when the hide setting is set', () => {
    render(hero({ hideConnectPrompt: true }));
    expect(panel()).toBeNull();
  });
  it('is absent on another member’s profile', () => {
    render(hero({ isSelf: false }));
    expect(panel()).toBeNull();
  });
  it('is absent for a connected member', () => {
    f.state.connected = true;
    render(hero());
    expect(panel()).toBeNull();
  });
  it('does not appear while connection reads remain unsettled', () => {
    f.state.settled = false;
    render(hero());
    expect(panel()).toBeNull();
  });
  it('prints fixed index 12.4, never the supplied member index or trend', () => {
    const view = render(hero());
    const example = screen.getByTestId('hero-connect-panel');
    expect(within(example).getByText('12.4')).toBeTruthy();
    expect(within(example).queryByText('41.9')).toBeNull();
    expect(within(example).queryByText('28.7')).toBeNull();
    view.rerender(hero({ indexValue: 7.1 }));
    expect(within(example).getByText('12.4')).toBeTruthy();
    expect(within(example).queryByText('7.1')).toBeNull();
  });
  it('keeps the pill present alongside every displayed example', () => {
    const view = render(hero());
    expect(panel()?.querySelectorAll('[data-example-pill]')).toHaveLength(1);
    view.rerender(hero({ hideConnectPrompt: true }));
    expect(view.container.querySelector('[data-example-pill]')).toBeNull();
    view.rerender(hero());
    expect(panel()?.querySelectorAll('[data-example-pill]')).toHaveLength(1);
  });
  it('supplies both movements and five approved round figures', () => {
    expect(CONNECT_EXAMPLE.index).toBe(12.4);
    expect(CONNECT_EXAMPLE.movements.map(({ delta, window }) => [delta, window])).toEqual([[-0.8, '90 days'], [-2.1, '12 months']]);
    expect(CONNECT_EXAMPLE.rounds.map(({ gross_score }) => gross_score)).toEqual([86, 91, 84, 88, 90]);
    expect(CONNECT_EXAMPLE.rounds.map(({ value }) => value)).toEqual([3.5, 5.4, -0.2, 0.8, 1.2]);
    render(hero());
    const tiles = panel()?.querySelectorAll('[data-example-form-tile]');
    expect(tiles).toHaveLength(5);
    expect(Array.from(tiles ?? []).map((tile) => tile.firstElementChild?.textContent)).toEqual(['86', '91', '84', '88', '90']);
  });
  it('Hide calls the decline hook once and waits for the loaded flag, even after its promise resolves', async () => {
    const view = render(hero());
    fireEvent.click(screen.getByRole('button', { name: 'Hide this' }));
    expect(f.decline).toHaveBeenCalledTimes(1);
    await f.decline.mock.results[0]?.value;
    expect(panel()).not.toBeNull();
    view.rerender(hero({ hideConnectPrompt: true }));
    expect(panel()).toBeNull();
    view.unmount();
    render(hero({ hideConnectPrompt: true }));
    expect(panel()).toBeNull();
  });
});