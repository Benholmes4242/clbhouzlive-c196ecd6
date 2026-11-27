import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enTourhub from '../../src/locales/en/tourhub.json';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

/* Brief 47A: the 27 Nov strokes, holes 1–16 real, 17–18 the mock's illustrative ties. */
const PARS = [4, 4, 4, 3, 5, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 4, 3, 4];
const STROKES: Record<string, number[]> = {
  koepka: [3, 5, 3, 4, 3, 3, 3, 4, 3, 5, 5, 4, 2, 4, 4, 4, 3, 4],
  clark: [4, 5, 2, 4, 4, 2, 3, 5, 4, 6, 5, 3, 3, 3, 4, 4, 3, 4],
  koivun: [3, 5, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 4, 4, 3, 3, 4],
  thomas: [4, 4, 3, 4, 4, 2, 4, 5, 4, 5, 5, 4, 3, 4, 3, 3, 3, 4],
};
const NAMES: Record<string, string> = { koepka: 'Brooks Koepka', clark: 'Wyndham Clark', koivun: 'Jackson Koivun', thomas: 'Justin Thomas' };
const holesFor = (id: string, upTo = 18) => PARS.map((par, i) => ({ player_id: id, round_number: 1, hole_number: i + 1, strokes: i < upTo ? STROKES[id][i] : null, par, starting_hole: 1 }));
const field = (upTo = 18) => Object.keys(STROKES).map((id) => ({ id, name: NAMES[id], holes: holesFor(id, upTo) }));

const env = vi.hoisted(() => ({ name: 'The Farmers Insurance Skins Game', phase: 'completed' as 'live' | 'completed', winner: 'koivun' as string | null, reads: vi.fn() }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({
  useBoardHoles: (tid: string | null) => {
    env.reads(tid);
    const ids = ['koepka', 'clark', 'koivun', 'thomas'];
    const data = tid ? ids.flatMap((id) => holesFor(id, 18)) : undefined;
    return { data, isError: false, isLoading: false, isSuccess: !!data, byPlayer: new Map(tid ? ids.map((id) => [id, holesFor(id, 18)]) : []) };
  },
}));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { skinsWeekLine, skinsFromScorecards, skinsLeadLine, skinsTableTitle, skinsHolesLabel, skinsBiggestPot, skinsPlayoffNote, type SkinsResult } from '@/features/tourhub/skins/skinsRules';
import { SkinsHoleByHole, SkinsFactBand } from '@/features/tourhub/skins/SkinsSections';

const entries: BoardEntry[] = Object.keys(STROKES).map((id, i) => ({ id: `e-${id}`, position: i + 1, score: -7 + i, thru: 18, player: { id, full_name: NAMES[id], country_code: 'USA', sr_id: `sr-${id}` } }));
afterEach(() => { cleanup(); env.name = 'The Farmers Insurance Skins Game'; env.phase = 'completed'; env.winner = 'koivun'; env.reads.mockClear(); });

/* 5. Tournament page. */
vi.mock('@/features/tourhub/components/TourHubShell', () => ({ TourHubShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/components/TourPageShell', () => ({ TourPageShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/components/overview-v3/useTournamentPulse', () => ({ useTournamentPulse: () => ({ state: env.phase }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: { id: 'e', name: env.name, event_type: 'stroke', start_date: '2026-11-27', end_date: '2026-11-27', venue_name: 'Atlantic Fields Club', venue_par: 71, current_round: 1, status: env.phase === 'completed' ? 'closed' : 'inprogress', tour_code: 'pga', winner_id: env.winner ? `sr-${env.winner}` : null }, isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: entries }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/hooks/useTournamentStatusRealtime', () => ({ useTournamentStatusRealtime: () => {} }));
vi.mock('@/features/tourhub/hooks/useTournamentPick', () => ({ usePickField: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set() }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentHoleAnalysis', () => ({ useTournamentHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentCourseHoles', () => ({ useTournamentCourseHoles: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [1] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip', () => ({ ChampionStrip: (p: { score: string; scoreLabel?: string }) => <div data-tv-section="champion" data-score={p.score} data-label={p.scoreLabel} /> }));
vi.mock('@/features/tourhub/tournament-v2/sections/MiniBoard', () => ({ MiniBoard: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/AllTeeTimesSheet', () => ({ AllTeeTimesSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/MomentsSection', () => ({ MomentsSection: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/TournamentV3Sections', () => ({ TournamentHero: () => <div data-tv-section="hero" data-standard-hero />, RaceSection: () => <div data-tv-section="race" />, FieldSection: () => <div data-tv-section="field" />, CourseV3Section: () => <div data-tv-section="course" />, NumbersSection: () => <div data-tv-section="numbers" />, TeeV3Section: () => <div data-tv-section="tees" />, SectionHead: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/CompletedWeekBlock', () => ({ CompletedWeekBlock: () => null }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentWeekFacts', () => ({ useTournamentWeekFacts: () => ({ data: null, isLoading: false }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand', () => ({ PhotoBand: (p: { skins?: { lead: string; kicker: string; count: number | null; progress: unknown } | null }) => <div data-photo-band data-skins-lead={p.skins?.lead} data-kicker={p.skins?.kicker} data-count={String(p.skins?.count)} data-progress={String(!!p.skins?.progress)} /> }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: null }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));

import { TournamentPage } from '@/features/tourhub/tournament-v2/TournamentPage';

const qc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: enTourhub } }, interpolation: { escapeValue: false }, initAsync: false });
const page = () => render(<QueryClientProvider client={qc()}><MemoryRouter initialEntries={['/tourhub/tournament/e']}><I18nextProvider i18n={i18n}><Routes><Route path="/tourhub/tournament/:tournamentId" element={<TournamentPage />} /></Routes></I18nextProvider></MemoryRouter></QueryClientProvider>);
const sections = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-tv-section]')).map((n) => n.getAttribute('data-tv-section'));



import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { OverviewChampionBlock } from '@/features/tourhub/components/overview-v3/useOverviewChampion';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={qc()}><MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter></QueryClientProvider>);
const slide = (name = 'The Farmers Insurance Skins Game', live = false): HeroSlide => ({ type: live ? 'live' : 'completed', tournament: { id: 'e', name, status: live ? 'inprogress' : 'closed', currentRound: 1, startDate: '2026-11-27', endDate: '2026-11-27', venueName: 'Atlantic Fields Club', venuePar: 71, tourSlug: 'pga', tourName: 'PGA Tour', winnerId: 'sr-koivun', winnerKey: 'koivun', winnerName: 'Jackson Koivun' } as HeroSlide['tournament'] });

describe('Briefs 47/47A continuation rules', () => {
  it('standard tournament never invokes the skins scorecard read', () => {
    env.name = 'BMW Australian PGA Championship';
    page();
    expect(env.reads).not.toHaveBeenCalled();
  });
  it('standard overview band and Also this week never invoke a skins read', () => {
    mount(<><HeroBoardSection tournamentId="e" eventName="BMW Australian PGA Championship" entries={entries} phase="completed" currentRound={1} totalRounds={1} /><AlsoWeekEvent slide={slide('BMW Australian PGA Championship')} entries={entries} followed={new Set()} /></>);
    expect(env.reads).not.toHaveBeenCalled();
  });
  it('skins overview has final facts and hole cards, and suppresses picks-only rendering', () => {
    const v = mount(<><HeroBoardSection tournamentId="e" eventName={env.name} entries={entries} phase="completed" currentRound={1} totalRounds={1} championSrId="sr-koivun" /><HeroBoardSection picksOnly tournamentId="e" eventName={env.name} entries={entries} phase="completed" currentRound={1} /></>);
    expect(v.container.querySelectorAll('[data-overview-skins]')).toHaveLength(1);
    expect(v.container.querySelectorAll('[data-skins-nine]')).toHaveLength(2);
    expect(v.container.querySelector('[data-skins-playoff]')).not.toBeNull();
    expect(v.container.querySelector('[data-skins-fact="Skins"] b')!.textContent).toBe('19');
    expect(env.reads).toHaveBeenCalledTimes(1);
  });
  it('overview champion is skins when finished and absent when live', () => {
    const v = mount(<OverviewChampionBlock slide={slide()} state={{ kind: 'results', variant: 'standard', finishDate: '2026-11-27', meta: '' }} />);
    expect(v.container.querySelector('[data-tv-section="champion"]')!.getAttribute('data-label')).toBe('SKINS · PLAYOFF');
    cleanup(); env.reads.mockClear();
    const live = mount(<OverviewChampionBlock slide={slide(undefined, true)} state={{ kind: 'live', round: 1, totalRounds: 1 }} />);
    expect(live.container.querySelector('[data-tv-section="champion"]')).toBeNull();
    expect(env.reads).not.toHaveBeenCalled();
  });
  it('Also this week final rows use skins-only winner copy and SKINS column', () => {
    const v = mount(<AlsoWeekEvent slide={slide()} entries={entries} followed={new Set()} />);
    expect(v.container.querySelector('[data-also-skins-line]')!.textContent).toBe('Koivun won with 7 skins');
    expect(v.container.querySelectorAll('[data-skins-row]')).toHaveLength(3);
    expect(v.container.querySelector('.also-win-score')).toBeNull();
    expect(v.container.querySelector('.also-chase')).toBeNull();
  });
  it('Also this week wording: live leader, finished winner, shared leaders', () => {
    const live = skinsFromScorecards(field(16));
    expect(skinsWeekLine(live, false)).toBe('Koepka leads with 6 skins');
    const final = skinsFromScorecards(field(), { finished: true, championId: 'koivun' });
    expect(skinsWeekLine(final, true)).toBe('Koivun won with 7 skins');
    const tied = { ...final, players: final.players.map(p => p.id === 'koepka' ? { ...p, skins: 7 } : p).sort((a, b) => b.skins - a.skins || a.surname.localeCompare(b.surname)) };
    expect(skinsWeekLine(tied, true)).toBe('Koepka and Koivun level on 7 skins');
  });
});
