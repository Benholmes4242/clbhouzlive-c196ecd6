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

const env = vi.hoisted(() => ({ name: 'The Farmers Insurance Skins Game', phase: 'completed' as 'live' | 'completed', winner: 'koivun' as string | null }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({
  useBoardHoles: (tid: string | null) => {
    const ids = ['koepka', 'clark', 'koivun', 'thomas'];
    const data = tid ? ids.flatMap((id) => holesFor(id, 18)) : undefined;
    return { data, isError: false, isLoading: false, isSuccess: !!data, byPlayer: new Map(tid ? ids.map((id) => [id, holesFor(id, 18)]) : []) };
  },
}));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { skinsFromScorecards, skinsLeadLine, skinsTableTitle, skinsHolesLabel, skinsBiggestPot, skinsPlayoffNote, type SkinsResult } from '@/features/tourhub/skins/skinsRules';
import { SkinsHoleByHole, SkinsFactBand } from '@/features/tourhub/skins/SkinsSections';

const entries: BoardEntry[] = Object.keys(STROKES).map((id, i) => ({ id: `e-${id}`, position: i + 1, score: -7 + i, thru: 18, player: { id, full_name: NAMES[id], country_code: 'USA', sr_id: `sr-${id}` } }));
afterEach(() => { cleanup(); env.name = 'The Farmers Insurance Skins Game'; env.phase = 'completed'; env.winner = 'koivun'; });

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


const done = (champion: string | null = 'koivun', upTo = 18) => skinsFromScorecards(field(upTo), { finished: true, championId: champion });
const sk = (r: SkinsResult) => Object.fromEntries(r.players.map((p) => [p.surname, p.skins]));
/* A field with no carry at the end: Koepka alone birdies the 18th (worth 3). */
const noCarry = () => field(18).map((p) => p.id === 'koepka' ? { ...p, holes: p.holes.map((h) => h.hole_number === 18 ? { ...h, strokes: 3 } : h) } : p);

describe('Brief 47A playoff rule', () => {
  it('1. 27 Nov: champion Koivun takes the playoff', () => {
    const r = done();
    expect(sk(r)).toEqual({ Koivun: 7, Koepka: 6, Clark: 3, Thomas: 3 });
    expect(skinsHolesLabel(r.players[0])).toBe('4, 10, 11, Playoff');
    expect(r.playoff).toEqual({ winner: 'koivun', pot: 4, carriedFrom: [16, 17, 18] });
    expect([r.skinsWon, r.holesTied, skinsBiggestPot(r), r.playoff!.pot]).toEqual([19, 8, 5, 4]);
    const { container } = render(<SkinsFactBand result={r} final />);
    expect(Array.from(container.querySelectorAll('[data-skins-fact] b')).map((b) => b.textContent)).toEqual(['19', '8', '5', '4']);
  });
  it('2. finished with a carry and no champion: no playoff, skins left unclaimed', () => {
    const r = done(null);
    expect(r.playoff).toBeNull();
    expect(r.carrying).toBe(3);
    expect(skinsLeadLine(r)).toContain('skins were left unclaimed.');
  });
  it('3. finished without a carry: no playoff note, Playoff cell is a dash', () => {
    const r = skinsFromScorecards(noCarry(), { finished: true, championId: 'koivun' });
    expect(r.playoff).toBeNull();
    const { container } = render(<><SkinsFactBand result={r} final /><SkinsHoleByHole result={r} /></>);
    expect(container.querySelector('[data-skins-fact="Playoff"] b')!.textContent).toBe('–');
    expect(container.querySelector('[data-skins-playoff]')).toBeNull();
  });
  it('4. lead line and titles: playoff win, plain win, shared lead', () => {
    const p = done();
    expect(skinsLeadLine(p)).toBe('Koivun won with 7 skins, taking the last 4 in a playoff.');
    expect(skinsTableTitle(p)).toBe('Koivun won by one skin');
    const plain = skinsFromScorecards(noCarry(), { finished: true, championId: 'koivun' });
    expect(skinsLeadLine(plain)).toBe('Koepka won with 9 skins.');
    /* Shared: hand-built finished result with two leaders level. */
    const shared = { ...plain, playoff: null, carrying: 0, players: plain.players.map((x) => x.surname === 'Koivun' ? { ...x, skins: 9 } : x).sort((a, b) => b.skins - a.skins || a.surname.localeCompare(b.surname)) };
    expect(skinsLeadLine(shared)).toBe('Koepka and Koivun shared the most skins, 9 each.');
    expect(skinsTableTitle(shared)).toBe('Koepka and Koivun shared the lead');
  });
  it('6. playoff note wording for three carried holes and for one', () => {
    expect(skinsPlayoffNote(done())).toBe('Koivun won it and its 4 skins: 3 carried from the 16th, 17th and 18th, plus one for the playoff hole.');
    const one = field(18).map((p) => p.id === 'koivun' ? { ...p, holes: p.holes.map((h) => h.hole_number === 17 ? { ...h, strokes: 2 } : h) } : p);
    expect(skinsPlayoffNote(skinsFromScorecards(one, { finished: true, championId: 'koivun' }))).toBe('Koivun won it and its 2 skins: 1 carried from the 18th, plus one for the playoff hole.');
  });
});

describe('Brief 47A finished page', () => {
  it('5. the finished skins page renders hero, champion, band, The skins, Hole by hole and the note; no hidden sections', () => {
    const { container } = page();
    expect(sections(container)).toEqual(['hero', 'champion', 'skins', 'hole-by-hole', 'course', 'moments']);
    const band = container.querySelector('[data-photo-band]')!;
    expect(band.getAttribute('data-kicker')).toBe('PGA · SKINS GAME · FINAL');
    expect(band.getAttribute('data-count')).toBe('null');
    expect(band.getAttribute('data-progress')).toBe('false');
    const champ = container.querySelector('[data-tv-section="champion"]')!;
    expect([champ.getAttribute('data-score'), champ.getAttribute('data-label')]).toEqual(['7', 'SKINS · PLAYOFF']);
    expect(container.querySelector('[data-skins-band]')).not.toBeNull();
    expect(container.querySelector('[data-skins-playoff]')).not.toBeNull();
    for (const hidden of ['race', 'numbers', 'tees', 'picks', 'board', 'completed-week']) expect(sections(container)).not.toContain(hidden);
  });
  it('5. a standard finished event renders exactly as before', () => {
    env.name = 'BMW Australian PGA Championship';
    const { container } = page();
    expect(container.querySelector('[data-skins-page]')).toBeNull();
    expect(container.querySelector('[data-skins-playoff]')).toBeNull();
  });
});
