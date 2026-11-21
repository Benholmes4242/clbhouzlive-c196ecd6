import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import type { HeroSlide, HeroTournament } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { OverviewRecapCandidate, SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const fixture = vi.hoisted(() => ({ slides: [] as HeroSlide[], candidates: new Map<TourId, OverviewRecapCandidate>(), recap: undefined as SeasonRecapData | undefined }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({ useOurPickRecord: () => ({ data: null, isError: false, isFetched: true }), useBeatTheModel: () => ({ data: [] }), useMyPickOdds: () => ({ data: null }) }));
vi.mock('@/features/tourhub/hooks/useHeroCarouselData', async original => ({ ...await original<typeof import('@/features/tourhub/hooks/useHeroCarouselData')>(), useHeroCarouselData: () => ({ data: fixture.slides, isLoading: false, isFetched: true }) }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewFallbackSlides', async original => ({ ...await original<typeof import('@/features/tourhub/components/overview-v3/useOverviewFallbackSlides')>(), useOverviewFallbackSlides: () => ({ data: [], isLoading: false, isFetched: true }) }));
vi.mock('@/features/tourhub/components/overview-v3/useSeasonRecap', async original => ({ ...await original<typeof import('@/features/tourhub/components/overview-v3/useSeasonRecap')>(), useOverviewRecaps: () => ({ data: fixture.candidates, isFetched: true }), useSeasonRecap: () => ({ data: fixture.recap, isFetched: true }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: [], isLoading: false, isFetched: true }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ selectedTourSlug: 'all', selectedTournamentId: null, selectionNonce: 0, setViewingTourSlug: vi.fn(), setViewingTournamentId: vi.fn(), setViewingIsLive: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/components/overview-v3/useHeroFullBoard', () => ({ useHeroFullBoard: () => ({ open: false, onOpen: vi.fn(), onClose: vi.fn(), meta: null }) }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand', () => ({ HeroBoardSection: () => null, boardPhaseFor: () => 'upcoming', shouldShowOverviewBoard: () => false }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ OverviewChampionBlock: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHero', async original => ({ ...await original<typeof import('@/features/tourhub/components/overview-v3/HybridHero')>(), HybridHero: ({ slide }: { slide: HeroSlide }) => <div data-non-recap={slide.type}>{slide.tournament.name}</div> }));

import { OverviewHero } from '@/features/tourhub/components/overview-v3/OverviewHero';
import { RecapFacts, RecapPhotoBand, recapSentence } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import { isBetweenSeasons, RECAP_AFTER_DAYS } from '@/features/tourhub/components/overview-v3/seasonRecapRules';
import { RESULTS_HANDOVER_DAYS, type HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { getOverviewCountdown, formatOverviewDateRange } from '@/features/tourhub/components/overview-v3/HybridHero';
import { OVERVIEW_TOUR_ORDER } from '@/features/tourhub/_shared/tourOrder';

const i18n = createInstance();
await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });
const t = i18n.getFixedT('en', 'tourhub') as unknown as (key: string, options?: Record<string, unknown>) => string;
const now = new Date('2026-11-21T00:00:00Z');
const state: HeroState = { kind: 'results', variant: 'standard', finishDate: '2026-11-15', meta: '' };
function tournament(extra: Partial<HeroTournament> = {}): HeroTournament {
  return { id: 'final', name: 'Charles Schwab Cup Championship', status: 'closed', startDate: '2026-11-12', endDate: '2026-11-15', venueName: 'Phoenix Country Club', venueCourseName: null, venueCity: null, venueState: null, venueCountry: null, venuePar: null, venueYardage: null, purse: null, winningShare: null, currency: null, tourSlug: 'champ', tourName: 'Champions', seasonYear: 2026, defendingChampion: null, defendingChampionPhotoUrl: null, defendingChampionPgaTourId: null, isMajor: false, isSignature: false, eventType: 'stroke', winnerId: null, winnerName: null, winnerPhotoUrl: null, winnerHeadshotOverride: null, winnerKey: null, winnerPgaTourId: null, winnerScore: null, leaderScore: null, leaderName: null, currentRound: null, currentRoundStatus: null, ...extra };
}
const next = tournament({ id: 'next', name: 'Sony Championship Hawaii', status: 'scheduled', startDate: '2027-01-14', endDate: '2027-01-16', venueName: 'Waialae CC', seasonYear: 2027 });
const data: SeasonRecapData = { events: 28, winners: 14, maxWins: 6, mostWinsSurname: null, tiedLeaders: 2, standings: [{ position: 1, name: 'Stewart Cink', points: 4999830, playerId: null }], standingsSource: { table: 'tour_season_rankings', date: '2026-11-16' }, cardLine: null, cardEarners: [] };
const slide: HeroSlide = { type: 'completed', tournament: tournament() };
function mount(node: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider></I18nextProvider>);
}
const sentence = (tour: TourId, value: SeasonRecapData) => recapSentence(tour, value, 2026, t).map(s => s.text).join('');
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now); fixture.slides = []; fixture.candidates = new Map(); fixture.recap = data; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Season recap Next up', () => {
  it('shares the three-day results handover: day three is not between seasons, day four is', () => {
    expect(RECAP_AFTER_DAYS).toBe(RESULTS_HANDOVER_DAYS);
    expect(RECAP_AFTER_DAYS).toBe(3);
    expect(isBetweenSeasons({ lastEnd: '2026-11-18', seasonYear: 2026, nextStart: next.startDate, raceFinal: false, now })).toBe(false);
    expect(isBetweenSeasons({ lastEnd: '2026-11-17', seasonYear: 2026, nextStart: next.startDate, raceFinal: false, now })).toBe(true);
  });
  it('a next event ten days away suppresses a recap even thirty days after the last event', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-10-22', seasonYear: 2026, nextStart: '2026-12-01', raceFinal: false, now })).toBe(false);
  });
  it('a final race allows the recap one day after the last event', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-11-20', seasonYear: 2026, nextStart: next.startDate, raceFinal: true, now })).toBe(true);
  });
  it('January first hands back to any loaded next event', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-11-15', seasonYear: 2026, nextStart: '2027-03-01', raceFinal: false, now: new Date('2027-01-01') })).toBe(false);
  });
  it.each(OVERVIEW_TOUR_ORDER)('%s rolls from a six-day-old final to recap instead of its 54-day upcoming slide', async tour => {
    const last = tournament({ tourSlug: tour });
    fixture.slides = [{ type: 'upcoming', tournament: { ...next, tourSlug: tour } }];
    fixture.candidates = new Map([[tour, { last, seasonId: 'season', raceFinal: false }]]);
    const { container } = mount(<OverviewHero />);
    await waitFor(() => expect(container.querySelector('[data-overview-photo-state="recap"]')).not.toBeNull());
    expect(container.querySelector('[data-non-recap="upcoming"]')).toBeNull();
    expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
  });
  it('a live slide still wins over its tour recap', () => {
    fixture.slides = [{ type: 'live', tournament: tournament({ status: 'inprogress' }) }];
    fixture.candidates = new Map([['champ', { last: tournament(), seasonId: 'season', raceFinal: true }]]);
    const { container } = mount(<OverviewHero />);
    expect(container.querySelector('[data-non-recap="live"]')).not.toBeNull();
    expect(container.querySelector('[data-overview-photo-state="recap"]')).toBeNull();
  });
  it('the earliest loaded next event supplies the footer, not a later slide', () => {
    fixture.slides = [{ type: 'upcoming', tournament: { ...next, id: 'later', name: 'Later event', startDate: '2027-02-01' } }, { type: 'upcoming', tournament: next }];
    fixture.candidates = new Map([['champ', { last: tournament(), seasonId: 'season', raceFinal: false }]]);
    const { container } = mount(<OverviewHero />);
    expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
  });
  it('the band has no recap points figure or final-event text', () => {
    const { container } = mount(<RecapPhotoBand slide={slide} state={state} data={data} onOpen={() => {}} />);
    expect(container.querySelector('[data-overview-recap-figure]')).toBeNull();
    expect(container.textContent).not.toContain('Final event');
    expect(container.textContent).not.toContain('Phoenix Country Club');
  });
  it('Champions starts with the season-over line and names the Charles Schwab Cup winner', () => {
    expect(sentence('champ', data)).toBe('The 2026 season is over. Cink won the Charles Schwab Cup.');
  });
  it('without fresh standings the season-over line precedes fourteen winners across twenty-eight events', () => {
    expect(sentence('champ', { ...data, standings: null, standingsSource: null })).toBe('The 2026 season is over. 14 different winners across 28 events.');
  });
  it.each([
    ['days', '2027-01-14', 54],
    ['hours', '2026-11-21T03:00:00Z', 3],
    ['minutes', '2026-11-21T00:45:00Z', 45],
  ] as const)('Next up uses the shared %s countdown and event/date text', (unit, startDate, value) => {
    const event = { ...next, startDate };
    const { container } = mount(<RecapPhotoBand slide={slide} state={state} data={data} nextTournament={event} now={now} onOpen={() => {}} />);
    const card = container.querySelector('[data-recap-next-up]');
    expect(card?.querySelector('.recap-next-up-kicker')?.textContent).toBe('NEXT UP');
    expect(card?.querySelector('.recap-next-up-name')?.textContent).toBe(event.name);
    expect(card?.querySelector('[data-recap-next-up-place]')?.textContent).toBe(`Waialae CC · ${formatOverviewDateRange(startDate, event.endDate)}`);
    expect(getOverviewCountdown(startDate, now)[0]).toEqual({ value, label: unit });
    expect(card?.querySelector('[data-recap-next-up-value]')?.textContent).toBe(String(value));
    expect(card?.querySelector('[data-recap-next-up-unit]')?.textContent).toBe(t(`overview.upcomingPlus.${unit}`, { count: value }));
  });
  it('with no loaded next event the band has no Next up card', () => {
    const { container } = mount(<RecapPhotoBand slide={slide} state={state} data={data} now={now} onOpen={() => {}} />);
    expect(container.querySelector('[data-recap-next-up]')).toBeNull();
  });
  it('Korn Ferry preserves the top-twenty card sentence after the season line', () => {
    expect(sentence('pgad', { ...data, cardLine: { n: 20, label: 'Cards' } })).toBe('The 2026 season is over. Cink topped the points list. The top 20 earned PGA TOUR cards for 2027.');
  });
  it('tied most wins has only six and MOST WINS with no players line', () => {
    const { container } = mount(<RecapFacts data={data} />);
    const cell = container.querySelector('[data-recap-fact="mostWins"]');
    expect(cell?.querySelector('b')?.textContent).toBe('6');
    expect(cell?.querySelector('span')?.textContent).toBe('MOST WINS');
    expect(cell?.querySelector('small')).toBeNull();
  });
  it('a sole most-wins leader keeps his surname', () => {
    const { container } = mount(<RecapFacts data={{ ...data, tiedLeaders: 1, mostWinsSurname: 'Cink' }} />);
    expect(container.querySelector('[data-recap-fact="mostWins"] small')?.textContent).toBe('Cink');
  });
  it('Next up is inert and its tap retains the band action', () => {
    const onOpen = vi.fn();
    const { container } = mount(<RecapPhotoBand slide={slide} state={state} data={data} nextTournament={next} now={now} onOpen={onOpen} />);
    const card = container.querySelector('[data-recap-next-up]');
    expect(card?.getAttribute('role')).toBeNull();
    expect(card?.querySelector('button')).toBeNull();
    if (!card) throw new Error('Next up card missing');
    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});