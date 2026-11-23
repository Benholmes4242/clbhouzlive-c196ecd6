/* Brief 16: every hero band section renders data-hero-head with its eyebrow
   and title; the retired right-hand labels and paragraphs are gone. Real
   i18next provider (no react-i18next mock), so eyebrows/titles are real. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../src/locales/en/tourhub.json';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({}) }) }), rpc: () => Promise.resolve({ data: null, error: null }) } }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false, isError: false, isSuccess: true }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/AllTeeTimesSheet', () => ({ AllTeeTimesSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet', () => ({ OurRecordSheet: () => null }));
vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({ PlayerAvatar: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/WonChart', () => ({ WonChart: () => null }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({ useOurPickRecord: () => ({ data: { picks: 30, won: 3, top10: 9, event_count: 31 }, isError: false, isFetched: true, isSuccess: true, isLoading: false }) }));

import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { LiveHeroBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard';
import { LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { LivePicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock';
import { PicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
import { LiveFirstTees } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import { UpcomingCourse, UpcomingLastYear, YourUpcomingPlayers } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { RecapCardList, RecapFacts, RecapOurRecord, RecapStandings } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import { CompletedWeekBlock } from '@/features/tourhub/tournament-v2/sections/CompletedWeekBlock';
import type { WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';

const i18n = createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', initAsync: false, defaultNS: 'tourhub', ns: ['tourhub'], interpolation: { escapeValue: false }, resources: { en: { tourhub: en } } });
const mount = (ui: React.ReactElement) => render(<I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient()}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider></I18nextProvider>);
afterEach(cleanup);

const heads = (root: ParentNode) => [...root.querySelectorAll('[data-hero-head]')].map(h => [h.querySelector('[data-hero-head-eyebrow]')?.textContent, h.querySelector('[data-hero-head-title]')?.textContent]);
let n = 0;
const e = (name: string, o: Partial<BoardEntry>): BoardEntry => ({ id: `e${++n}`, position: 1, score: 0, player: { id: `p-${name}`, full_name: name }, ...o });

describe('live, round in play', () => {
  it('biggest movers', () => {
    const v = mount(<RoundMovementBand round={3} cards={[{ key: 'a', name: 'Cameron Smylie', candidates: [], delta: 14, toPar: -6, gross: null }, { key: 'b', name: 'Lucas Herbert', candidates: [], delta: 11, toPar: -5, gross: null }]} />);
    expect(heads(v.container)).toEqual([['Round 3 biggest movers', 'Smylie up 14 places']]);
  });
  it('leaderboard: head above, blank name cells, live dot', () => {
    const rows = [e('Min Woo Lee', { position: 1, score: -14, round_3: -4, thru: 12 }), e('Cam Smith', { position: 2, score: -12, round_3: -3, thru: 10 }), e('Adam Scott', { position: 3, score: -11, round_3: -2, thru: 9 }), e('Jason Day', { position: 4, score: -11, round_3: -1, thru: 8 }), e('Ko Ko', { position: 5, score: -12, round_3: -1, thru: 8 }), e('Fox Fox', { position: 6, score: -9, round_3: 0, thru: 8 })];
    const v = mount(<LiveHeroBoard tournamentId="t" entries={rows} stage="inPlay" round={3} nextRound={null} />);
    expect(heads(v.container)).toEqual([['LEADERBOARD', 'Four within three of the lead']]);
    expect(v.container.querySelector('[data-hero-head-live]')).not.toBeNull();
    const cols = v.container.querySelector('[data-live-board-header]')!;
    expect([...cols.children].slice(0, 2).every(c => c.textContent === '')).toBe(true);
    expect(cols.textContent).not.toMatch(/leaderboard/i);
  });
  it("leaders' group: state line becomes the title", () => {
    const rows = [e('Min Woo Lee', { position: 1, score: -14, round_1: -4, round_2: -6, today: -4, thru: 14 }), e('Cam Smith', { position: 2, score: -12, round_1: -4, round_2: -5, today: -3, thru: 13 })];
    const group = { teeTime: '2026-11-21T03:00:00Z', startingHole: 1, players: [{ id: 'p-Min Woo Lee', name: 'Min Woo Lee' }, { id: 'p-Cam Smith', name: 'Cam Smith' }] };
    const v = mount(<LeadersGroupContent tournamentId="t" entries={rows} group={group} groups={[group]} round={3} currentRound={3} totalRounds={4} phase="live" live />);
    expect(heads(v.container)).toEqual([["THE LEADERS' GROUP · ROUND 3", 'Lee and Smith, through 14']]);
    expect(v.container.querySelector('[data-hero-head-live]')).not.toBeNull();
    expect(v.container.querySelector('[data-leaders-group-state]')).toBeNull();
  });
  it('course: playing title, rest beneath, Course guide action', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: 4, yards: 400 })) as never;
    const v = mount(<UpcomingCourse holes={holes} tournamentId="t" live={{ kicker: 'THE COURSE · ROUND 3', title: 'Playing 0.42 under par', line: <span>The 17th…</span>, averages: null, keyLine: null }} />);
    expect(heads(v.container)).toEqual([['THE COURSE · ROUND 3', 'Playing 0.42 under par']]);
    expect(v.container.querySelector('[data-hero-head-action]')?.textContent).toBe('Course guide ›');
    expect(v.container.querySelector('[data-course-line]')?.textContent).toBe('The 17th…');
  });
  it('our picks, live: eyebrow carries the round, title from the intro, sentences then door then rows', () => {
    const picks = [{ playerId: 'p1', playerName: 'Adam Scott' }, { playerId: 'p2', playerName: 'Tommy Fleetwood' }] as never;
    const v = mount(<LivePicksBlock picks={picks} tourCode="pga" seasonYear={2026} stage="inPlay" round={3} boardByPlayer={new Map()} teeByPlayer={null} zone={null}
      intro={{ kind: 'behind', name: 'Scott', pos: 'T4', gap: 3 }} sentences={[{ key: 'overview.live.picks.finishHoles', values: { name: 'Fleetwood', count: 8 }, replace: false }]} onOpenPick={() => {}} onOpenRecord={() => {}} />);
    expect(heads(v.container)).toEqual([['OUR TOURNAMENT PICKS · ROUND 3', 'Scott is T4, three shots back']]);
    expect(v.container.querySelector('[data-hero-head-live]')).not.toBeNull();
    expect(v.container.querySelector('[data-live-picks-heading]')).toBeNull();
    const order = [...v.container.querySelectorAll('[data-hero-head],[data-overview-picks-intro],[data-our-record-door],[data-overview-picks-rows]')].map(x => x.getAttribute('data-hero-head') != null ? 'head' : x.hasAttribute('data-overview-picks-intro') ? 'sentences' : x.hasAttribute('data-our-record-door') ? 'door' : 'rows');
    expect(order).toEqual(['head', 'sentences', 'door', 'rows']);
  });
});

describe('live, before the first tee', () => {
  it('tee times: the group count leaves the right', () => {
    const groups = [...Array(26)].map((_, i) => ({ teeTime: `2026-11-20T0${i % 9}:00:00Z`, startingHole: 1, players: [] })).concat([...Array(26)].map((_, i) => ({ teeTime: `2026-11-20T0${i % 9}:10:00Z`, startingHole: 10, players: [] })));
    const v = mount(<LiveFirstTees groups={groups} zone={null} tournamentId="t" tournamentName={null} />);
    expect(heads(v.container)).toEqual([['ROUND 1 TEE TIMES', '52 groups, off the 1st and 10th']]);
    expect(v.container.querySelector('[data-live-tee-groups]')).toBeNull();
  });
});

const facts: WeekFacts = { champion_player_id: 'p-Cameron Smylie', champion_surname: 'Smylie', rounds: 4, par: 72, path: [{ round: 1, position: 1, tied: false, to_par: -4, back: null, lead_by: 1 }], playoff: false, margin: 2,
  hole_types: [{ par: 3, to_par: 1, rank: 14, tied: false, field: 70 }, { par: 4, to_par: -3, rank: 6, tied: false, field: 70 }, { par: 5, to_par: -9, rank: 1, tied: false, field: 70 }],
  low_round: null, most_birdies: null, field_avg: null, field_size: 144, cut: { line: 1, made: 68 }, hardest: { hole: 17, par: 4, avg_to_par: 0.4 }, easiest: null };
describe('finished (CompletedWeekBlock)', () => {
  it('four heads; top-three column row keeps R4/TOT under the title', () => {
    const rows = [e('Cameron Smylie', { position: 1, score: -18, round_1: -4, round_2: -4, round_3: -4, round_4: -6 }), e('Lucas Herbert', { position: 2, score: -16, round_1: -2, round_2: -4, round_3: -5, round_4: -5 }), e('Cam Davis', { position: 3, score: -14, round_1: -1, round_2: -4, round_3: -4, round_4: -5 })];
    const v = mount(<CompletedWeekBlock facts={facts} rows={rows} />);
    expect(heads(v.container)).toEqual([['HOW IT WAS WON', 'Herbert got within one after round three'], ['SMYLIE ON EACH HOLE TYPE', 'Best in the field on the par 5s'], ['THE TOP THREE', 'Herbert second, two back'], ['THE WEEK', '68 made the cut, at +1']]);
    const cols = v.container.querySelector('[data-cw-section="top"]')!;
    expect([...cols.children].map(c => c.textContent)).toEqual(['', '', 'R4', 'TOT']);
    expect(v.container.querySelector('.cw-kick, .cw-sub')).toBeNull();
  });
});

describe('our picks, finished and upcoming (PicksBlock)', () => {
  const base = { tourCode: 'pga', tournamentId: 't', seasonYear: 2026, currentRound: null, onOpenRecord: () => {}, boardByPlayer: new Map(), startedPlayers: new Set<string>(), championPlayerId: 'p1', championPlayerIds: [], intro: null, onOpenPick: () => {} };
  it('finished: FINAL folds into the eyebrow; title, rest, door, cards', () => {
    const picks = [{ playerId: 'p1', playerName: 'Cameron Smylie' }] as never;
    const v = mount(<PicksBlock {...base} picks={picks} phase="completed" teeByPlayer={null} pickResults={[{ playerId: 'p1', playerName: 'Cameron Smylie', position: 1, tied: false, score: -18, status: null, percentile: 100 }] as never} />);
    expect(heads(v.container)).toEqual([['OUR TOURNAMENT PICKS · FINAL', 'Smylie won it']]);
    expect(v.container.querySelector('.pick-panel-dim')).toBeNull();
    const order = [...v.container.querySelectorAll('[data-hero-head],[data-picks-verdict],[data-our-record-door],[data-overview-picks-grid]')].map(x => x.hasAttribute('data-hero-head') ? 'head' : x.hasAttribute('data-picks-verdict') ? 'rest' : x.hasAttribute('data-our-record-door') ? 'door' : 'cards');
    expect(order).toEqual(['head', 'rest', 'door', 'cards']);
  });
  it('upcoming: tee-day label and its measure are gone; title names the first tee', () => {
    const picks = [{ playerId: 'p1', playerName: 'Ludvig Åberg' }, { playerId: 'p2', playerName: 'Adam Scott' }] as never;
    const iso = '2026-11-26T11:42:00';
    const v = mount(<PicksBlock {...base} picks={picks} phase="upcoming" teeByPlayer={new Map([['p1', iso], ['p2', '2026-11-26T13:00:00']])} pickResults={[]} />);
    const [[eyebrow, title]] = heads(v.container);
    expect(eyebrow).toBe('OUR TOURNAMENT PICKS');
    expect(title).toMatch(/^Åberg off first, \S+ at 11:42$/);
    expect(v.container.querySelector('[data-overview-picks-tee-day],[data-overview-picks-tee-measure]')).toBeNull();
  });
});

describe('upcoming', () => {
  it('your players: the players paragraph is removed', () => {
    const field = ['a', 'b', 'c'].map((id, i) => ({ id, name: `Player ${id}`, worldRank: i + 1 }));
    const v = mount(<YourUpcomingPlayers member followed={new Set(['a', 'b', 'c'])} field={field} drawn={false} zone={null} />);
    expect(heads(v.container)).toEqual([['YOUR PLAYERS', 'Three of your players are in the field']]);
    expect(v.container.querySelector('.upcoming-players-line')).toBeNull();
  });
  it('last year list: year in the eyebrow, TOT on its own row', () => {
    const rows = [{ rank: '1', name: 'Tommy Fleetwood', country: 'ENG', score: '−18', year: '2025', photoUrl: null }, { rank: '2', name: 'Ludvig Åberg', country: 'SWE', score: '−16', year: '2025', photoUrl: null }];
    const v = mount(<UpcomingLastYear rows={rows} />);
    expect(heads(v.container)).toEqual([['LAST YEAR · 2025', 'Åberg second, two back']]);
    expect(v.container.querySelector('[data-overview-board-header]')?.textContent).toBe('TOT');
  });
  it('course: course lead title, par-5 line, Course guide', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: [2, 6, 11, 15].includes(i) ? 5 : 4, yards: 413 + (i === 0 ? 15 : 0) })) as never;
    const v = mount(<UpcomingCourse holes={holes} tournamentId="t" />);
    const [[eyebrow, title]] = heads(v.container);
    expect([eyebrow, title]).toEqual(['THE COURSE', 'Par 76, 7,449 yards']);
    expect(v.container.querySelector('[data-course-line]')?.textContent).toMatch(/^Four par 5s\./);
  });
});

describe('season over', () => {
  const data = { events: 39, winners: 23, maxWins: 4, mostWinsSurname: 'Scheffler', tiedLeaders: 1, standingsSource: null,
    standings: [{ position: 1, name: 'Scottie Scheffler', points: 5204, playerId: null }, { position: 2, name: 'Rory McIlroy', points: 4000, playerId: null }],
    cardLine: { label: 'Top 100 · cards', n: 100 }, cardEarners: [{ name: 'Ludvig Åberg', age: 22, playerId: null, initialName: 'L. Åberg' }] } as unknown as SeasonRecapData;
  it('season, points list and card line heads; youngest paragraph removed', () => {
    const v = mount(<><RecapFacts data={data} /><RecapStandings tour="pga" data={data} /><RecapCardList tour="pga" data={data} /></>);
    expect(heads(v.container)).toEqual([['THE SEASON', '23 different winners in 39 events'], ['THE POINTS LIST', 'Scheffler finished 1,204 points clear'], ['TOP 100 · CARDS', 'Åberg, 22, is the youngest of the 100']]);
    expect(v.container.querySelector('[data-recap-youngest]')).toBeNull();
    expect(v.container.querySelector('[data-hero-head-action]')?.textContent).toBe('See all ›');
  });
  it('our picks: How we pick action', () => {
    const v = mount(<RecapOurRecord tour="pga" year={2026} />);
    expect(heads(v.container)).toEqual([['OUR PICKS · 2026', 'We picked three winners']]);
    expect(v.container.querySelector('[data-hero-head-action]')?.textContent).toBe('How we pick ›');
  });
});
