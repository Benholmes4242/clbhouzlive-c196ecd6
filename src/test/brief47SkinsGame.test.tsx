import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enTourhub from '../../src/locales/en/tourhub.json';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

/* Today's real Skins Game strokes (skins_game.html), holes 1–16. */
const PARS = [4, 4, 4, 3, 5, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 4, 3, 4];
const STROKES: Record<string, number[]> = {
  koepka: [3, 5, 3, 4, 3, 3, 3, 4, 3, 5, 5, 4, 2, 4, 4, 4],
  clark: [4, 5, 2, 4, 4, 2, 3, 5, 4, 6, 5, 3, 3, 3, 4, 4],
  koivun: [3, 5, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 4, 4, 3],
  thomas: [4, 4, 3, 4, 4, 2, 4, 5, 4, 5, 5, 4, 3, 4, 3, 3],
};
const NAMES: Record<string, string> = { koepka: 'Brooks Koepka', clark: 'Wyndham Clark', koivun: 'Jackson Koivun', thomas: 'Justin Thomas' };
const holesFor = (id: string, upTo = 16) => PARS.map((par, i) => ({ player_id: id, round_number: 1, hole_number: i + 1, strokes: i < upTo ? STROKES[id][i] : null, par, starting_hole: 1 }));
const field = (upTo = 16) => Object.keys(STROKES).map((id) => ({ id, name: NAMES[id], holes: holesFor(id, upTo) }));

const env = vi.hoisted(() => ({ name: 'The Farmers Insurance Skins Game', phase: 'live' as 'live' | 'completed' }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({
  useBoardHoles: (tid: string | null) => {
    const ids = ['koepka', 'clark', 'koivun', 'thomas'];
    const data = tid ? ids.flatMap((id) => holesFor(id)) : undefined;
    return { data, isError: false, isLoading: false, isSuccess: !!data, byPlayer: new Map(tid ? ids.map((id) => [id, holesFor(id)]) : []) };
  },
}));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { isSkinsGame, skinsFromScorecards, skinsLeadLine, skinsTableTitle, skinsHoleTitle } from '@/features/tourhub/skins/skinsRules';
import { SkinsHoleByHole } from '@/features/tourhub/skins/SkinsSections';
import { formatOverviewDateRange } from '@/features/tourhub/components/overview-v3/HybridHero';
import { dateRange } from '@/features/tourhub/tournament-v2/data/tournamentRules';
import { dateSpanLabel } from '@/features/tourhub/schedule-v2/scheduleRules';

const entries: BoardEntry[] = Object.keys(STROKES).map((id, i) => ({ id: `e-${id}`, position: i + 1, score: -7 + i, thru: 16, player: { id, full_name: NAMES[id], country_code: 'USA' } }));
afterEach(() => { cleanup(); env.name = 'The Farmers Insurance Skins Game'; env.phase = 'live'; });

describe('Brief 47 skins rule', () => {
  it('1. isSkinsGame detects by name', () => {
    expect(isSkinsGame('The Farmers Insurance Skins Game')).toBe(true);
    expect(isSkinsGame('BMW Australian PGA Championship')).toBe(false);
  });
  it('2. real strokes after 13 and 16 holes', () => {
    const at13 = skinsFromScorecards(field(13));
    const s13 = Object.fromEntries(at13.players.map((p) => [p.surname, p.skins]));
    expect(s13).toEqual({ Koepka: 6, Koivun: 3, Clark: 2, Thomas: 2 });
    expect(at13.players.find((p) => p.surname === 'Koepka')!.holesWon).toEqual([9, 13]);
    const r = skinsFromScorecards(field(16));
    expect(Object.fromEntries(r.players.map((p) => [p.surname, p.skins]))).toEqual({ Koepka: 6, Clark: 3, Koivun: 3, Thomas: 3 });
    expect(r.carrying).toBe(1);
    expect(r.nextHole).toBe(17);
    expect(r.nextWorth).toBe(2);
    expect(r.holesTied).toBe(6);
    expect(r.totalHoles).toBe(18);
  });
  it('3. a hole missing one player\'s strokes is not played', () => {
    const f = field(16);
    f[0].holes[15] = { ...f[0].holes[15], strokes: null };
    const r = skinsFromScorecards(f);
    expect(r.played).toBe(15);
    expect(r.holes[15].played).toBe(false);
    expect(r.nextHole).toBe(16);
  });
  it('4. lead lines and titles', () => {
    const r = skinsFromScorecards(field(16));
    expect(skinsLeadLine(r)).toBe('Koepka leads with 6 skins. One skin carries to the 17th, worth 2.');
    expect(skinsTableTitle(r)).toBe('Koepka leads by three skins');
    expect(skinsHoleTitle(r)).toBe("Koepka's 9th was worth five skins");
    const tied = skinsFromScorecards(['a', 'b', 'c'].map((id, i) => ({ id, name: `P ${id.toUpperCase()}`, holes: [1, 2, 3].map((h) => ({ hole_number: h, strokes: h === i + 1 ? 3 : 4, par: 4 })).concat([{ hole_number: 4, strokes: null as unknown as number, par: 4 }]) })));
    expect(skinsTableTitle(tied)).toBe('Three players level on one skin');
    expect(skinsLeadLine(tied)).toBe('Three players lead with 1 skin. The 4th is worth one skin.');
    const none = skinsFromScorecards(field(1));
    expect(skinsLeadLine(none)).toBe('Every hole has carried so far.');
    expect(skinsHoleTitle(none)).toBe('Every hole has carried so far');
    const two = skinsFromScorecards([['koepka', 'Brooks Koepka', [3, 4]], ['clark', 'Wyndham Clark', [4, 3]]].map(([id, name, st]) => ({ id: id as string, name: name as string, holes: (st as number[]).map((v, i) => ({ hole_number: i + 1, strokes: v, par: 4 })).concat([{ hole_number: 3, strokes: null as unknown as number, par: 4 }]) })));
    expect(skinsTableTitle(two)).toBe('Clark and Koepka level on one skin');
    const finished = { ...r, finished: true, carrying: 0, nextHole: null, nextWorth: null };
    expect(skinsLeadLine(finished)).toBe('Koepka won with 6 skins.');
    expect(skinsTableTitle(finished)).toBe('Koepka won by three skins');
    expect(skinsLeadLine({ ...finished, carrying: 2 })).toBe('Koepka won with 6 skins. Two skins were left unclaimed.');
  });
  it('6. hole by hole: winner tile, carried arrow, green next value', () => {
    const r = skinsFromScorecards(field(16));
    const { container } = render(<SkinsHoleByHole result={r} />);
    const out = container.querySelector('[data-skins-nine="OUT"]')!;
    const koepka9 = out.querySelector('[data-skins-player="koepka"]')!.children[9];
    expect(koepka9).toHaveClass('win');
    expect(out.querySelectorAll('[data-skins-cell]')[0]).toHaveTextContent('→');
    const next = container.querySelector('[data-skins-cell="next"]')!;
    expect(next).toHaveClass('nx');
    expect(next).toHaveTextContent('2');
  });
  it('8. one-day dates read "27 Nov"; multi-day ranges unchanged', () => {
    expect(formatOverviewDateRange('2026-11-27', '2026-11-27')).toBe('27 Nov');
    expect(formatOverviewDateRange('2026-10-29', '2026-11-01')).toBe('29 Oct – 1 Nov');
    expect(formatOverviewDateRange('2026-11-05', '2026-11-08')).toBe('5–8 Nov');
    expect(dateRange('2026-11-27', '2026-11-27')).toBe('27 Nov');
    expect(dateRange('2026-11-05', '2026-11-08')).toBe('5 – 8 Nov');
    expect(dateSpanLabel('2026-11-27', '2026-11-27')).toBe('Fri 27 Nov');
    expect(dateSpanLabel('2026-11-05', '2026-11-08')).toBe('Thu 5 – Sun 8 Nov');
  });
});

/* 5. Tournament page. */
vi.mock('@/features/tourhub/components/TourHubShell', () => ({ TourHubShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/components/TourPageShell', () => ({ TourPageShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/components/overview-v3/useTournamentPulse', () => ({ useTournamentPulse: () => ({ state: env.phase }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: { id: 'e', name: env.name, event_type: 'stroke', start_date: '2026-11-27', end_date: '2026-11-27', venue_name: 'Atlantic Fields Club', venue_par: 71, current_round: 1, status: 'inprogress', tour_code: 'pga' }, isLoading: false }) }));
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
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip', () => ({ ChampionStrip: () => <div data-tv-section="champion" /> }));
vi.mock('@/features/tourhub/tournament-v2/sections/MiniBoard', () => ({ MiniBoard: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/AllTeeTimesSheet', () => ({ AllTeeTimesSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/MomentsSection', () => ({ MomentsSection: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/TournamentV3Sections', () => ({ TournamentHero: () => <div data-tv-section="hero" data-standard-hero />, RaceSection: () => <div data-tv-section="race" />, FieldSection: () => <div data-tv-section="field" />, CourseV3Section: () => <div data-tv-section="course" />, NumbersSection: () => <div data-tv-section="numbers" />, TeeV3Section: () => <div data-tv-section="tees" />, SectionHead: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/CompletedWeekBlock', () => ({ CompletedWeekBlock: () => null }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentWeekFacts', () => ({ useTournamentWeekFacts: () => ({ data: null, isLoading: false }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand', () => ({ PhotoBand: (p: { skins?: { lead: string; kicker: string } | null }) => <div data-photo-band data-skins-lead={p.skins?.lead} data-kicker={p.skins?.kicker} /> }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: null }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));

import { TournamentPage } from '@/features/tourhub/tournament-v2/TournamentPage';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const qc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: enTourhub } }, interpolation: { escapeValue: false }, initAsync: false });
const page = () => render(<QueryClientProvider client={qc()}><MemoryRouter initialEntries={['/tourhub/tournament/e']}><I18nextProvider i18n={i18n}><Routes><Route path="/tourhub/tournament/:tournamentId" element={<TournamentPage />} /></Routes></I18nextProvider></MemoryRouter></QueryClientProvider>);
const sections = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-tv-section]')).map((n) => n.getAttribute('data-tv-section'));

describe('Brief 47 surfaces', () => {
  it('5. a skins tournament page renders hero, band, The skins, Hole by hole; no hidden sections', () => {
    const { container } = page();
    expect(container.querySelector('[data-skins-page]')).not.toBeNull();
    expect(sections(container)).toEqual(['hero', 'skins', 'hole-by-hole', 'course', 'moments']);
    const order = Array.from(container.querySelectorAll('[data-photo-band],[data-skins-band],[data-tv-section="skins"],[data-tv-section="hole-by-hole"]')).map((n) => n.getAttribute('data-tv-section') ?? (n.hasAttribute('data-photo-band') ? 'photo' : 'band'));
    expect(order).toEqual(['photo', 'band', 'skins', 'hole-by-hole']);
    expect(container.querySelector('[data-photo-band]')!.getAttribute('data-kicker')).toBe('PGA · SKINS GAME');
    for (const hidden of ['race', 'numbers', 'tees', 'picks', 'board', 'champion', 'completed-week']) expect(sections(container)).not.toContain(hidden);
  });
  it('5. a standard event renders exactly as before', () => {
    env.name = 'BMW Australian PGA Championship';
    const { container } = page();
    expect(container.querySelector('[data-skins-page]')).toBeNull();
    expect(sections(container)).toEqual(['hero', 'board', 'picks', 'race', 'tees', 'numbers', 'course', 'moments']);
  });
  it('7. overview board switches to the skins band and table for a skins game', () => {
    const mount = (name: string) => render(<QueryClientProvider client={qc()}><MemoryRouter><I18nextProvider i18n={i18n}><HeroBoardSection tournamentId="e" eventName={name} entries={entries} phase="completed" currentRound={1} totalRounds={1} venuePar={71} /></I18nextProvider></MemoryRouter></QueryClientProvider>);
    const skins = mount('The Farmers Insurance Skins Game');
    expect(skins.container.querySelector('[data-overview-skins] [data-skins-band]')).not.toBeNull();
    expect(skins.container.querySelectorAll('[data-skins-row]')).toHaveLength(4);
    expect(skins.container.textContent).toContain('Hole by hole');
    cleanup();
    const standard = mount('BMW Australian PGA Championship');
    expect(standard.container.querySelector('[data-overview-skins]')).toBeNull();
  });
  it('7. Also this week shows the top three skins rows with one SKINS column', () => {
    const slide = (name: string): HeroSlide => ({ type: 'live', tournament: { id: 'e', name, status: 'inprogress', startDate: '2026-11-27', endDate: '2026-11-27', currentRound: 1, venueName: 'Atlantic Fields Club', venuePar: 71, tourSlug: 'pga', tourName: 'PGA Tour' } as HeroSlide['tournament'] });
    const v = render(<QueryClientProvider client={qc()}><MemoryRouter><I18nextProvider i18n={i18n}><AlsoWeekEvent slide={slide('The Farmers Insurance Skins Game')} entries={entries} followed={new Set()} /></I18nextProvider></MemoryRouter></QueryClientProvider>);
    const board = v.container.querySelector('[data-also-skins]')!;
    expect(board.querySelectorAll('[data-skins-row]')).toHaveLength(3);
    expect(board.querySelector('.skins-th')!.textContent).toBe('SKINS');
    expect(v.container.querySelector('[data-hero-board-row]')).toBeNull();
  });
});
