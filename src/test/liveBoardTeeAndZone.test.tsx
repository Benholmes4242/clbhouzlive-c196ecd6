import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import { formatTimeHm24, formatWeekdayShort } from '@/i18n/format';
import { LiveHeroBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard';
import { LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { LiveFirstTees } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const f = vi.hoisted(() => ({ groups: [] as TeeGroup[], status: 'success' as 'success' | 'pending' | 'error', read: vi.fn() }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({
  useTeeTimesAll: (id: string, round: number, options?: { enabled?: boolean }) => {
    f.read(id, round, options);
    return { data: f.groups, isSuccess: f.status === 'success', isLoading: f.status === 'pending', isError: f.status === 'error' };
  },
}));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [3, 4], isLoading: false }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: null, ready: true }) }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map(), isFetched: true }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/LiveOverviewSections', async importOriginal => ({
  ...await importOriginal<typeof import('@/features/tourhub/components/overview-v3/LiveOverviewSections')>(),
  useLiveOverview: () => ({ on: true, ready: true, meta: null, stage: { stage: 'between', round: 3, nextRound: 4 }, zone: 'America/New_York', holes: [], analysis: null, firstTees: [], cut: {} }),
}));

const language = i18next.createInstance();
void language.init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false });
const teeTime = '2026-11-21T16:00:00Z';
const group: TeeGroup = { teeTime, startingHole: 1, players: [{ id: 'a', name: 'Player A' }] };
const entries: BoardEntry[] = [{ id: 'row-a', position: 1, score: -9, round_1: -3, round_2: -3, round_3: -3, today: -3, today_round: 3, thru: 18, player: { id: 'a', full_name: 'Player A' } }];
const boardProps = { tournamentId: 'event', entries, stage: 'between' as const, round: 3, nextRound: 4, zone: 'America/New_York' };
const leaderProps = { tournamentId: 'event', entries, currentRound: 3, totalRounds: 4, phase: 'live' as const, round: 4, group, groups: [group], live: true };
const mount = (element: React.ReactElement) => render(element, { wrapper: ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter>
  </QueryClientProvider>
) });
afterEach(() => { cleanup(); f.groups = []; f.status = 'success'; f.read.mockClear(); });

function expectNoTee(container: HTMLElement) {
  expect(container.querySelector('[data-live-col="thru"]')?.textContent).toBe('THRU');
  expect(container.querySelector('[data-live-cell="thru"]')?.textContent).toBe('F');
  expect(container.querySelector('[data-live-col="today"]')).toBeNull();
  expect(container.querySelector<HTMLElement>('[data-live-board-header]')?.style.gridTemplateColumns).toBe('28px minmax(0,1fr) 40px 44px');
  expect(container.querySelector<HTMLElement>('[data-live-board-row]')?.style.gridTemplateColumns).toBe('28px minmax(0,1fr) 40px 44px');
}

describe('Live board tee availability and leaders course time', () => {
  it('between rounds with an empty successful tee read has no R4 TEE header or tee cells', () => {
    const view = mount(<LiveHeroBoard {...boardProps} />);
    expectNoTee(view.container);
    expect(f.read).toHaveBeenCalledWith('event', 4, { enabled: true });
  });
  it('keeps the no-tee layout until the next-round read settles successfully', () => {
    f.groups = [group]; f.status = 'pending';
    expectNoTee(mount(<LiveHeroBoard {...boardProps} />).container);
  });
  it('a successful read with only invalid tee times has no tee column', () => {
    f.groups = [{ ...group, teeTime: 'invalid' }];
    expectNoTee(mount(<LiveHeroBoard {...boardProps} />).container);
  });
  it('tee times arriving add the R4 TEE header and course-time cells', () => {
    const view = mount(<LiveHeroBoard {...boardProps} />);
    expectNoTee(view.container);
    f.groups = [group];
    view.rerender(<LiveHeroBoard {...boardProps} />);
    expect(view.container.querySelector('[data-live-col="thru"]')?.textContent).toBe('R4 TEE');
    expect(view.container.querySelector('[data-live-cell="thru"]')?.textContent).toBe('11:00');
    expect(view.container.querySelector<HTMLElement>('[data-live-board-header]')?.style.gridTemplateColumns).toBe('28px minmax(0,1fr) 48px 44px');
  });
  it('a failed tee read hides the column even when cached tee times remain', () => {
    f.groups = [group]; f.status = 'error';
    expectNoTee(mount(<LiveHeroBoard {...boardProps} />).container);
  });
  it('leaders with America/New_York and a 16:00 UTC tee read Tees off Sat 11:00', () => {
    const view = mount(<LeadersGroupContent {...leaderProps} zone="America/New_York" />);
    expect(view.container.querySelector('[data-hero-head-title]')?.textContent).toBe('A tees off Sat 11:00');
    expect(view.container.querySelector('[data-hero-head-eyebrow]')?.textContent).toBe("THE LEADERS' GROUP · ROUND 4");
  });
  it('leaders without a zone preserve today’s device-time day and time', () => {
    const view = mount(<LeadersGroupContent {...leaderProps} />);
    expect(view.container.querySelector('[data-hero-head-title]')?.textContent).toBe(`A tees off ${formatWeekdayShort(teeTime)} ${formatTimeHm24(teeTime)}`);
    expect(view.container.querySelector('[data-hero-head-eyebrow]')?.textContent).toBe("THE LEADERS' GROUP · ROUND 4");
  });
  it('leaders take both weekday and time from the course zone across midnight', () => {
    const late = { ...group, teeTime: '2026-11-22T02:00:00Z' };
    const view = mount(<LeadersGroupContent {...leaderProps} group={late} groups={[late]} zone="America/New_York" />);
    expect(view.container.querySelector('[data-hero-head-title]')?.textContent).toBe('A tees off Sat 21:00');
    expect(view.container.querySelector('[data-hero-head-eyebrow]')?.textContent).toBe("THE LEADERS' GROUP · ROUND 4");
  });
  it('the tee-times section renders nothing without groups', () => {
    const view = mount(<LiveFirstTees groups={[]} zone="America/New_York" tournamentId="event" tournamentName={null} />);
    expect(view.container.childElementCount).toBe(0);
  });
  it('HeroBoardBand passes the live board’s course zone to the leaders group', () => {
    f.groups = [group];
    const view = mount(<HeroBoardSection tournamentId="event" entries={entries} currentRound={3} totalRounds={4} phase="live" liveKind="live" eventType="stroke" />);
    expect(view.container.querySelector('[data-live-cell="thru"]')?.textContent).toBe('11:00');
    expect(view.container.querySelector('[data-leaders-group] [data-hero-head-title]')?.textContent).toBe('A tees off Sat 11:00');
  });
});