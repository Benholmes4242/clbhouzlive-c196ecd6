import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import { LeadersGroup, LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { AlsoThisWeek } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const f = vi.hoisted(() => ({ rows: [] as BoardEntry[], groups: [] as TeeGroup[], slides: [] as HeroSlide[], read: vi.fn() }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ useOverviewChampion: () => ({ rows: f.rows, needsInitials: false, champion: null, showChampion: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: (id: string, round: number, options: { enabled: boolean }) => { f.read(id, round, options); return { data: f.groups, isSuccess: true, isFetched: true, isLoading: false }; } }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [2, 3], isLoading: false }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: { course_timezone: 'America/New_York' } }) }));
vi.mock('@/features/tourhub/components/overview-v3/useUpcomingOverview', () => ({ useUpcomingOverview: () => ({ last: [], field: [], first: null, zone: null }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/overview/sections/useOverviewEventsAbove', () => ({ useOverviewEventsAbove: () => ({ alsoWeek: f.slides }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set() }) }));
vi.mock('@/features/tourhub/overview/sections/useAlsoWeekData', () => ({ useAlsoWeekData: () => ({
  isLoading: false, isFetched: true, isError: false,
  data: { boards: new Map([['rsm', f.rows]]), draws: new Map(), firstTees: new Map([['rsm', new Map([[3, '2026-11-21T14:10:00Z']])]]) },
}) }));

const language = createInstance();
await language.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });
const firstTee = '2026-11-21T14:10:00Z';
const now = new Date('2026-11-21T21:47:00Z');
const group: TeeGroup = { teeTime: firstTee, startingHole: 1, players: [{ id: 'a', name: 'Player A' }] };
const rows: BoardEntry[] = [{ id: 'a', position: 1, score: -9, round_1: -4, round_2: -5, round_3: null, today: -5, today_round: 2, thru: 18, player: { id: 'a', full_name: 'Player A' } }];
const slide: HeroSlide = { type: 'live', tournament: {
  id: 'rsm', name: 'The RSM Classic', status: 'inprogress', currentRound: 3, currentRoundStatus: 'scheduled',
  startDate: '2026-11-19', endDate: '2026-11-22', tourSlug: 'pga', tourName: 'PGA Tour', venueName: 'Sea Island', venueCourseName: 'Seaside Course',
  venueCity: null, venueState: null, venueCountry: null, venuePar: 70, venueYardage: null, purse: null, winningShare: null, currency: null,
  defendingChampion: null, defendingChampionPhotoUrl: null, defendingChampionPgaTourId: null, isMajor: false, isSignature: false, eventType: 'stroke',
  winnerId: null, winnerName: null, winnerPhotoUrl: null, winnerHeadshotOverride: null, winnerKey: null, winnerPgaTourId: null, winnerScore: null,
  leaderScore: -9, leaderName: 'Player A',
} };
const heroProps = { slide, state: { kind: 'live' as const, round: 3, totalRounds: 4 }, now, activeTournamentId: 'rsm', onSelectTour: () => {}, onOpenTournament: () => {} };
const leadersProps = { tournamentId: 'rsm', entries: rows, currentRound: 3, totalRounds: 4, phase: 'live' as const, status: 'inprogress', currentRoundStatus: 'scheduled', zone: 'America/New_York', live: true };
const mount = (node: React.ReactElement) => render(node, { wrapper: ({ children }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider> });
afterEach(() => { cleanup(); vi.useRealTimers(); f.rows = []; f.groups = []; f.slides = []; f.read.mockClear(); });
const setup = () => { f.rows = rows; f.groups = [group]; f.slides = [slide]; };

describe('RSM-shaped derived delay displays', () => {
  it('hero kicker reads PGA Tour · ROUND 3 · DELAYED after the scheduled first tee', () => {
    setup();
    const view = mount(<HybridHero {...heroProps} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
    expect(f.read).toHaveBeenCalledWith('rsm', 3, { enabled: true });
  });
  it('hero reverts to after-round wording when a current-round player records a hole before a score arrives', () => {
    setup();
    const view = mount(<HybridHero {...heroProps} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toContain('DELAYED');
    f.rows = [{ ...rows[0], today: null, today_round: 3, thru: 1 }];
    view.rerender(<HybridHero {...heroProps} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
  });
  it('hero keeps after-round wording before the one-hour boundary', () => {
    setup();
    const view = mount(<HybridHero {...heroProps} now={new Date('2026-11-21T15:09:00Z')} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
  });
  it('republished future tee times remove the hero delay', () => {
    setup(); f.groups = [{ ...group, teeTime: '2026-11-21T22:00:00Z' }];
    const view = mount(<HybridHero {...heroProps} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
  });
  it('provider-suspended hero handling remains unchanged', () => {
    setup();
    const view = mount(<HybridHero {...heroProps} state={{ kind: 'suspended', round: 3, totalRounds: 4, reason: null }} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · SUSPENDED');
  });
  it('leaders group shows Delayed from the same event, round and earliest tee', () => {
    setup();
    const view = mount(<LeadersGroup {...leadersProps} now={now} />);
    expect(view.container.querySelector('[data-leaders-group-state]')?.textContent).toBe('Round 3· Delayed');
    expect(view.container.querySelector('[data-leaders-group-state] > span[aria-hidden]')).toBeNull();
  });
  it('leaders group retains Tees off when the round is not delayed', () => {
    setup();
    const view = mount(<LeadersGroupContent {...leadersProps} round={3} group={group} groups={[group]} now={new Date('2026-11-21T15:09:00Z')} />);
    expect(view.container.querySelector('[data-leaders-group-state]')?.textContent).toBe('Round 3· Tees off Sat 09:10');
  });
  it('leaders group uses the event’s first tee rather than its own later tee', () => {
    const late = { ...group, teeTime: '2026-11-21T21:30:00Z' };
    const view = mount(<LeadersGroupContent {...leadersProps} round={3} group={late} groups={[group, late]} now={now} />);
    expect(view.container.querySelector('[data-leaders-group-state]')?.textContent).toBe('Round 3· Delayed');
  });
  it('standalone leaders clock crosses the delay boundary without a new tee read', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-21T15:09:00Z'));
    const view = mount(<LeadersGroupContent {...leadersProps} round={3} group={group} groups={[group]} />);
    expect(view.container.querySelector('[data-leaders-group-state]')?.textContent).toContain('Tees off');
    act(() => vi.advanceTimersByTime(120_000));
    expect(view.container.querySelector('[data-leaders-group-state]')?.textContent).toBe('Round 3· Delayed');
  });
  it('weekly row reads ROUND 3 · DELAYED without a green live dot', () => {
    const view = mount(<div className="also-week"><AlsoWeekEvent slide={slide} entries={rows} followed={new Set()} firstTee={firstTee} now={now} /></div>);
    expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3 · DELAYED');
    expect(view.container.querySelector('.also-state')).toHaveAttribute('data-state', 'delayed');
    expect(view.container.querySelector('.also-live-dot')).toBeNull();
  });
  it('weekly row returns to its normal live label and dot after a starter', () => {
    const started = [{ ...rows[0], today_round: 3, today: -1, round_3: -1, thru: 1 }];
    const view = mount(<div className="also-week"><AlsoWeekEvent slide={slide} entries={started} followed={new Set()} firstTee={firstTee} now={now} /></div>);
    expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3');
    expect(view.container.querySelector('.also-live-dot')).not.toBeNull();
  });
  it('weekly section consumes the batched round-keyed tee while retaining its live count', () => {
    setup(); vi.useFakeTimers(); vi.setSystemTime(now);
    const view = mount(<AlsoThisWeek />);
    expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3 · DELAYED');
    expect(view.container.querySelector('[data-overview-live-dot]')).not.toBeNull();
  });
});