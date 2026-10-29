import { afterEach, describe, expect, it } from 'vitest';
import i18n from 'i18next';
import enTourhub from '../../public/locales/en/tourhub.json';
import { resolveChampionPlayerId, pickWonTournament } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BOARD_GEOMETRY, BoardTable, computeBoardColumns, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { formatOverviewDateRange, getOverviewCountdown, overviewChampionScoreLabel } from '@/features/tourhub/components/overview-v3/HybridHero';
import { detectTopTie, fmtScore, shortenName } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { compactUpcomingFacts, overviewTournamentDoorKey, shouldLoadUpcomingFacts, shouldShowOverviewBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { PhotoBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { buildLeaderTrio } from '@/features/tourhub/components/overview-v3/HybridHero';
import { countInWords, pickMovementCards } from '@/features/tourhub/components/overview-v3/overviewTokens';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { MiniBoard, heroBoardColumns, heroTieRoles, shouldShowPrize } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { OVERVIEW_PHOTO_BAND_HEIGHT, PHOTO_BAND_HEIGHT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
import { OVERVIEW_HERO_HEIGHT, OVERVIEW_HERO_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';
import { isAlsoThisWeek, shouldShowAlsoThisWeekFigures, statusFor } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import { fullTourLabel } from '@/features/tourhub/_shared/tourOrder';
import { selectComingUpRail } from '@/features/tourhub/overview/sections/ComingUp';
import { selectOverviewBandStory } from '@/features/tourhub/overview/sections/StoryBand';
import { selectOverviewNews } from '@/features/tourhub/overview/sections/OverviewNews';
import { storyTime } from '@/features/tourhub/news/storyTime';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import type { ComingUpRow } from '@/features/tourhub/overview/data/useComingUp';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import { surnameOf } from '@/features/tourhub/_shared/playerName';

afterEach(() => cleanup());

const NOW = new Date('2026-09-17T12:00:00Z');

describe('tour player surnames', () => {
  it.each([
    ['Alejandro Del Rey', 'Del Rey'],
    ['Erik van Rooyen', 'van Rooyen'],
    ['Michael Van der Valk', 'Van der Valk'],
    ['J.J. Spaun', 'Spaun'],
    ['Adam Scott', 'Scott'],
    ['Scheffler', 'Scheffler'],
    ['', ''],
  ])('extracts %s as %s', (fullName, expected) => {
    expect(surnameOf(fullName)).toBe(expected);
  });

  it('keeps a compound surname intact in the ticker fallback', () => {
    expect(shortenName('Alejandro Del Rey')).toBe('A. Del Rey');
    expect(shortenName('Erik van Rooyen')).toBe('E. van Rooyen');
  });
});

describe('Tour Overview Design A hero facts', () => {
  it('keeps the overview at 386 without changing the shared news hero height', () => {
    expect(OVERVIEW_PHOTO_BAND_HEIGHT).toBe(386);
    expect(OVERVIEW_HERO_TOTAL_HEIGHT).toBe('386px');
    expect(PHOTO_BAND_HEIGHT).toBe(340);
    expect(OVERVIEW_HERO_HEIGHT).toBe('340px');
  });
  it('uses days and hours under 48 hours out', () => {
    expect(getOverviewCountdown('2026-09-19T11:00:00Z', NOW)).toEqual([
      { value: 1, label: 'days' },
      { value: 23, label: 'hours' },
    ]);
  });

  it('uses one days box at least 48 hours out', () => {
    expect(getOverviewCountdown('2026-09-19T15:00:00Z', NOW)).toEqual([
      { value: 2, label: 'days' },
    ]);
  });

  it('uses hours and minutes below 24 hours', () => {
    expect(getOverviewCountdown('2026-09-17T15:42:00Z', NOW)).toEqual([
      { value: 3, label: 'hours' },
      { value: 42, label: 'minutes' },
    ]);
  });

  it('uses one minutes box below one hour', () => {
    expect(getOverviewCountdown('2026-09-17T12:38:00Z', NOW)).toEqual([
      { value: 38, label: 'minutes' },
    ]);
  });

  it('withholds an invalid countdown', () => {
    expect(getOverviewCountdown('', NOW)).toEqual([]);
  });

  it('formats compact same-month and cross-month date ranges', () => {
    expect(formatOverviewDateRange('2026-09-17', '2026-09-20')).toBe('17–20 Sep');
    expect(formatOverviewDateRange('2026-09-28', '2026-10-01')).toBe('28 Sep – 1 Oct');
  });

  it('formats true-minus scores and detects tied leaders', () => {
    expect(fmtScore(-18)).toBe('−18');
    expect(detectTopTie([{ score: -18 }, { score: -18 }, { score: -17 }])).toEqual({ count: 2, score: '−18' });
  });

  it('keeps the wonBy/playoff qualifier in the separate scoreLabel register', () => {
    const t = (key: string, options?: { count: number }) => key.endsWith('playoff') ? 'playoff' : `by ${options?.count}`;
    expect(overviewChampionScoreLabel(false, 2, t)).toBe('by 2');
    expect(overviewChampionScoreLabel(true, null, t)).toBe('playoff');
    expect(overviewChampionScoreLabel(false, null, t)).toBeUndefined();
  });

  it('does not invent a tie when the rest of the field merely shares the leader score', () => {
    const rows = [{ position: 1, score: 0 }, { position: 132, score: 0 }];
    expect(rows.filter((row) => row.position === 1)).toHaveLength(1);
  });
});

function slide(type: HeroSlide['type'], startDate: string): HeroSlide {
  return { type, tournament: { id: 't', startDate, currentRound: null } } as HeroSlide;
}

describe('Tour Overview correctness gates', () => {
  it('uses the correct tournament door in every lifecycle state', () => {
    expect(overviewTournamentDoorKey('live')).toBe('overview.ticker.fullLeaderboard');
    expect(overviewTournamentDoorKey('completed')).toBe('overview.ticker.fullResults');
    expect(overviewTournamentDoorKey('upcoming')).toBe('overview.leaderboardBand.ctaUpcoming');
  });

  it('loads the facts line for upcoming tournaments only', () => {
    expect(shouldLoadUpcomingFacts('upcoming')).toBe(true);
    expect(shouldLoadUpcomingFacts('live')).toBe(false);
    expect(shouldLoadUpcomingFacts('completed')).toBe(false);
  });

  it('closes the upcoming facts line around one, two, or three populated facts', () => {
    const tee = { label: 'FIRST TEE', value: '3:00 PM', trailing: null, trailingColor: 'white' };
    const defending = { label: 'DEFENDING', value: 'Barron', trailing: '−12', trailingColor: 'red' };
    const field = { label: 'FIELD', value: '9 of top 20', trailing: null, trailingColor: 'white' };
    expect(compactUpcomingFacts([null, defending, null])).toEqual([defending]);
    expect(compactUpcomingFacts([tee, defending, null])).toEqual([tee, defending]);
    expect(compactUpcomingFacts([tee, defending, field])).toEqual([tee, defending, field]);
  });

  it('withholds level-par field-order rows until a position or score is posted', () => {
    expect(shouldShowOverviewBoard([{ position: null, score: 0 }, { position: null, score: 0 }])).toBe(false);
    expect(shouldShowOverviewBoard([{ position: 1, score: 0, thru: 1 }])).toBe(true);
    expect(shouldShowOverviewBoard([{ position: null, score: -1, round_1: -1 }])).toBe(true);
  });

  it('shows prize when ANY row in the tournament has money, whatever the slice', () => {
    const row = (id: string, money: number | null) => ({ id, position: 1, score: -10, money });
    const paid = Array.from({ length: 6 }, (_, index) => row(String(index), 1_000 + index));
    expect(shouldShowPrize(paid)).toBe(true);
    // A hole inside the slice no longer kills the column — the rule is the
    // tournament, not the visible rows.
    expect(shouldShowPrize([row('paid', 1_000), row('missing', null)])).toBe(true);
    // A hole beyond the slice is irrelevant either way.
    expect(shouldShowPrize([...paid.slice(0, 5), row('outside-slice', null)])).toBe(true);
    expect(shouldShowPrize([row('a', null), row('b', null)])).toBe(false);
    expect(shouldShowPrize([])).toBe(false);
  });

  it('draws a round column per played round, and none at all when the board carries totals with no round breakdown', () => {
    const row = (id: string, rounds: Partial<{ round_1: number; round_2: number; round_3: number }>) => ({
      id, position: Number(id), score: -10,
      player: { id: `player-${id}`, full_name: `Player ${id}` },
      ...rounds,
    });
    const board = (entries: ReturnType<typeof row>[]) => createElement(
      QueryClientProvider,
      { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
      createElement(
        MemoryRouter,
        null,
        createElement(MiniBoard, { tournamentId: 'event', entries, limit: 5, phase: 'completed', theme: 'heroBoard' }),
      ),
    );
    const played = render(board([
      row('1', { round_1: -2, round_2: -3, round_3: -5 }),
      row('2', { round_1: -1, round_2: -4, round_3: -5 }),
    ]));
    const playedHeader = played.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(playedHeader?.textContent).toContain('R1');
    expect(playedHeader?.textContent).toContain('R2');
    expect(playedHeader?.textContent).toContain('R3');
    expect(playedHeader?.style.gridTemplateColumns).toBe('24px minmax(0, 1fr) 26px 26px 26px 40px');
    played.unmount();

    const totalsOnly = render(board([row('1', {}), row('2', {})]));
    const totalsHeader = totalsOnly.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(totalsHeader?.textContent).not.toContain('R1');
    expect(totalsHeader?.style.gridTemplateColumns).toBe('24px minmax(0, 1fr) 40px');
  });

  it('marks the current round live only until the tournament is complete', () => {
    const entries: BoardEntry[] = [{
      id: 'leader',
      position: 1,
      score: -26,
      round_4: -10,
      player: { id: 'leader', full_name: 'Jacob Bridgeman' },
    }];

    expect(computeBoardColumns(entries, 4).liveRound).toBe(4);
    expect(computeBoardColumns(entries, 4, true).liveRound).toBeNull();
  });

  it('keeps Also This Week inside the coming Sunday', () => {
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-20T20:00:00Z'), NOW)).toBe(true);
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-21T00:00:00Z'), NOW)).toBe(false);
    expect(isAlsoThisWeek(slide('live', '2026-09-10T00:00:00Z'), NOW)).toBe(true);
  });

  it('shows weekday alone beyond 24 hours and adds time inside 24 hours', () => {
    expect(statusFor(slide('upcoming', '2026-09-19T15:00:00Z'), NOW)).toBe('Starts Saturday');
    const localTime = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date('2026-09-17T15:42:00Z'));
    expect(statusFor(slide('upcoming', '2026-09-17T15:42:00Z'), NOW)).toContain(localTime);
  });

  it('uses the same full tour kicker grammar in both tournament lists', () => {
    expect(['pga', 'euro', 'lpga', 'pgad', 'champ', 'liv'].map((tour) => fullTourLabel(tour))).toEqual([
      'PGA TOUR', 'DP WORLD TOUR', 'LPGA TOUR', 'KORN FERRY TOUR', 'CHAMPIONS TOUR', 'LIV GOLF',
    ]);
  });

  it('removes the entire figures column before a tournament starts', () => {
    const tournament = { leaderScore: -8, leaderName: 'Maria Player' } as HeroSlide['tournament'];
    expect(shouldShowAlsoThisWeekFigures({ type: 'upcoming', tournament })).toBe(false);
    expect(shouldShowAlsoThisWeekFigures({ type: 'live', tournament })).toBe(true);
    expect(shouldShowAlsoThisWeekFigures({ type: 'live', tournament: { ...tournament, leaderScore: null } })).toBe(false);
  });
});

function story(id: string, publishedAt: string, tournamentId: string | null, image = true): TourStory {
  return { id, slug: id, kicker: 'DP WORLD TOUR', headline: id, standfirst: null, body_blocks: [], image_url: image ? `${id}.jpg` : null, image_credit: null, tour_slug: 'euro', tournament_id: tournamentId, published_at: publishedAt };
}

describe('Tour Overview H12 material breaks', () => {
  const now = new Date('2026-09-17T20:00:00Z');

  it('prefers a seven-day tournament story over a newer generic fallback', () => {
    const stories = [story('generic', '2026-09-17T19:00:00Z', null), story('matched', '2026-09-12T12:00:00Z', 'hero')];
    expect(selectOverviewBandStory(stories, 'hero', now)?.id).toBe('matched');
  });

  it('uses the seven-day fallback and withholds older or unphotographed stories', () => {
    expect(selectOverviewBandStory([story('fresh', '2026-09-15T12:00:00Z', null)], 'hero', now)?.id).toBe('fresh');
    expect(selectOverviewBandStory([story('stale', '2026-09-10T19:59:59Z', null)], 'hero', now)).toBeNull();
    expect(selectOverviewBandStory([story('bare', '2026-09-17T19:00:00Z', 'hero', false)], 'hero', now)).toBeNull();
  });

  it('never repeats the band story in News', () => {
    const stories = [story('band', '2026-09-17T19:00:00Z', 'hero'), story('lead', '2026-09-17T18:00:00Z', null), story('row', '2026-09-17T17:00:00Z', null)];
    const news = selectOverviewNews(stories, 'band');
    expect(news.hero?.id).toBe('lead');
    expect([news.hero, ...news.features, ...news.rows].filter(Boolean).map((item) => item?.id)).not.toContain('band');
  });

  it('builds one hero, an exact two-up, and three rows from six stories', () => {
    const stories = Array.from({ length: 7 }, (_, index) => story(`story-${index + 1}`, `2026-09-17T${19 - index}:00:00Z`, null));
    const news = selectOverviewNews(stories);
    expect(news.hero?.id).toBe('story-1');
    expect(news.features.map((item) => item.id)).toEqual(['story-2', 'story-3']);
    expect(news.rows.map((item) => item.id)).toEqual(['story-4', 'story-5', 'story-6']);
  });

  it('falls a lone feature candidate through to rows', () => {
    const two = [story('hero', '2026-09-17T19:00:00Z', null), story('row', '2026-09-17T18:00:00Z', null)];
    const news = selectOverviewNews(two);
    expect(news.features).toEqual([]);
    expect(news.rows.map((item) => item.id)).toEqual(['row']);
  });

  it('uses a complete two-up and one row when four stories remain', () => {
    const four = Array.from({ length: 4 }, (_, index) => story(`story-${index + 1}`, `2026-09-17T${19 - index}:00:00Z`, null));
    const news = selectOverviewNews(four);
    expect(news.features.map((item) => item.id)).toEqual(['story-2', 'story-3']);
    expect(news.rows.map((item) => item.id)).toEqual(['story-4']);
  });

  it('keeps the first six chronological events and does not stretch a two-event source', () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({ id: `event-${index}` } as ComingUpRow));
    expect(selectComingUpRail(rows, 'event-1').map((row) => row.id)).toEqual(['event-0', 'event-2', 'event-3', 'event-4', 'event-5', 'event-6']);
    expect(selectComingUpRail(rows.slice(0, 2))).toHaveLength(2);
  });
});

describe('story elapsed-time labels', () => {
  const now = new Date('2026-09-23T20:00:00Z');
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

  it('uses elapsed-hour boundaries rather than calendar days', () => {
    expect(storyTime(hoursAgo(23), now)).toBe('23H AGO');
    expect(storyTime(hoursAgo(25), now)).toBe('YESTERDAY');
    expect(storyTime(hoursAgo(47), now)).toBe('YESTERDAY');
    expect(storyTime(hoursAgo(49), now)).toBe('2 DAYS AGO');
    expect(storyTime(hoursAgo(72), now)).toBe('3 DAYS AGO');
    expect(storyTime(hoursAgo(192), now)).toBe('15 SEP');
  });

  it('labels today’s 15 Sep feed story honestly and selects it as the fallback', () => {
    const feedNow = new Date('2026-09-17T21:16:00Z');
    const feedStory = story('15-sep', '2026-09-15T13:15:00Z', null);
    expect(storyTime(feedStory.published_at, feedNow)).toBe('2 DAYS AGO');
    expect(selectOverviewBandStory([feedStory], 'unmatched-hero', feedNow)?.id).toBe('15-sep');
  });
});

// CORRECTION 3 — the trophy marks the CHAMPION, not position 1 and not "T1".
describe('our picks trophy', () => {
  const entries = [
    { player: { id: 'zj-uuid', sr_id: 'zj-sr' }, position: 1, position_tied: true, score: -12 },
    { player: { id: 'rs-uuid', sr_id: 'rs-sr' }, position: 1, position_tied: true, score: -12 },
    { player: { id: 'ra-uuid', sr_id: 'ra-sr' }, position: 3, position_tied: true, score: -10 },
  ];

  it('resolves the champion by sr_id on a completed event only', () => {
    expect(resolveChampionPlayerId(entries, 'zj-sr', 'completed')).toBe('zj-uuid');
    expect(resolveChampionPlayerId(entries, 'zj-sr', 'live')).toBeNull();
    expect(resolveChampionPlayerId(entries, 'zj-sr', 'upcoming')).toBeNull();
    expect(resolveChampionPlayerId(entries, null, 'completed')).toBeNull();
    expect(resolveChampionPlayerId(entries, 'nobody-sr', 'completed')).toBeNull();
  });

  it('gives the trophy to the playoff winner and not to the T1 loser', () => {
    const champion = resolveChampionPlayerId(entries, 'zj-sr', 'completed');
    expect(pickWonTournament('zj-uuid', champion)).toBe(true);
    expect(pickWonTournament('rs-uuid', champion)).toBe(false);
    expect(pickWonTournament('ra-uuid', champion)).toBe(false);
    expect(pickWonTournament('zj-uuid', null)).toBe(false);
    expect(pickWonTournament(null, champion)).toBe(false);
  });
});

describe('heroBoardColumns', () => {
  it('live, one round: SHAPE only — TODAY would equal TOT', () => {
    expect(heroBoardColumns({ roundCount: 1, roundInProgress: true, completed: false })).toEqual({ today: false, rounds: false, shape: true });
  });
  it('live, two or more rounds: TODAY and SHAPE', () => {
    expect(heroBoardColumns({ roundCount: 2, roundInProgress: true, completed: false })).toEqual({ today: true, rounds: false, shape: true });
  });
  it('not live, two or more rounds: round columns, no SHAPE', () => {
    expect(heroBoardColumns({ roundCount: 3, roundInProgress: false, completed: true })).toEqual({ today: false, rounds: true, shape: false });
  });
  it('not live, one round or fewer: neither, no SHAPE', () => {
    expect(heroBoardColumns({ roundCount: 1, roundInProgress: false, completed: false })).toEqual({ today: false, rounds: false, shape: false });
  });
});

describe('hero board carries no THRU or MOV key', () => {
  it('the returned object has exactly today, rounds and shape', () => {
    for (const opts of [
      { roundCount: 1, roundInProgress: true, completed: false },
      { roundCount: 4, roundInProgress: true, completed: false },
      { roundCount: 4, roundInProgress: false, completed: true },
    ]) {
      expect(Object.keys(heroBoardColumns(opts)).sort()).toEqual(['rounds', 'shape', 'today']);
    }
  });
  it('SHAPE is present on a live multi-round board and absent on a single-round one that is not live', () => {
    expect(heroBoardColumns({ roundCount: 3, roundInProgress: true, completed: false }).shape).toBe(true);
    expect(heroBoardColumns({ roundCount: 1, roundInProgress: false, completed: false }).shape).toBe(false);
  });
});

describe('heroTieRoles', () => {
  it('T1 T1 T1 T4 T4 is two groups', () => {
    expect(heroTieRoles([1, 1, 1, 4, 4].map((position) => ({ position })))).toEqual(['first', 'middle', 'last', 'first', 'last']);
  });
  it('all five tied is one group', () => {
    expect(heroTieRoles([2, 2, 2, 2, 2].map((position) => ({ position })))).toEqual(['first', 'middle', 'middle', 'middle', 'last']);
  });
  it('a tie continuing past the limit ends on the last visible row; a lone visible tied row is solo', () => {
    expect(heroTieRoles([1, 2, 3, 3, 5].map((position) => ({ position })))).toEqual(['solo', 'solo', 'first', 'last', 'solo']);
  });
  it('missed-cut rows never group', () => {
    expect(heroTieRoles([{ position: 70, status: 'MC' }, { position: 70, status: 'MC' }])).toEqual(['solo', 'solo']);
  });
});

describe('MiniBoard heroBoard render', () => {
  const mountBoard = (entries: BoardEntry[], currentRound: number, phase: 'live' | 'completed') => render(createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, null,
      createElement(MiniBoard, { tournamentId: 'event', entries, limit: 5, currentRound, phase, theme: 'heroBoard', totalRounds: 4 })),
  ));
  it('live round two takes the mock grammar POS | PLAYER | TODAY | SHAPE | TOT', () => {
    const entries = [
      { id: 'a', position: 1, score: -6, thru: 9, round_1: -1, round_2: -5, player: { id: 'pa', full_name: 'Player A' } },
      { id: 'b', position: 2, score: -4, thru: 8, round_1: -4, round_2: 0, player: { id: 'pb', full_name: 'Player B' } },
    ] as unknown as BoardEntry[];
    const view = mountBoard(entries, 2, 'live');
    const header = view.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.gridTemplateColumns).toBe('26px minmax(0,1fr) 40px 44px 42px');
    expect(view.container.querySelectorAll('[data-hero-shape]').length).toBe(2);
  });
  it('renders no THRU cell and no MOV track in any phase', () => {
    const entries = [
      { id: 'a', position: 1, score: -6, thru: 9, round_1: -1, round_2: -5, player: { id: 'pa', full_name: 'Player A' } },
      { id: 'b', position: 2, score: -4, thru: 18, round_1: -4, round_2: 0, player: { id: 'pb', full_name: 'Player B' } },
    ] as unknown as BoardEntry[];
    for (const [round, phase] of [[1, 'live'], [2, 'live'], [2, 'completed']] as const) {
      const view = mountBoard(entries, round, phase);
      expect(view.container.querySelectorAll('[data-hero-thru]').length).toBe(0);
      expect(view.container.textContent).not.toContain('\u25B2');
      expect(view.container.textContent).not.toContain('MOV');
      view.unmount();
    }
  });
});

describe('MiniBoard hero rows', () => {
  i18n.addResourceBundle(i18n.language || 'en', 'tourhub', enTourhub, true, true);
  const mount = (entries: BoardEntry[], currentRound: number, phase: 'live' | 'completed' = 'live') => render(createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, null,
      createElement(MiniBoard, { tournamentId: 'event', entries, limit: 5, currentRound, phase, theme: 'heroBoard' })),
  ));
  it('a team row with no player id is not a button', () => {
    const entries = [
      { id: 't', position: 1, score: -9, thru: 9, round_1: -5, team: { display_name: 'Team Lowry', members: [{ player: { full_name: 'Shane Lowry' } }, { player: { full_name: 'Rory McIlroy' } }] } },
    ] as unknown as BoardEntry[];
    const view = mount(entries, 1);
    expect(view.container.querySelectorAll('button').length).toBe(0);
    expect(view.container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Team Lowry: Shane Lowry, Rory McIlroy, 1, −9');
  });
  it('a player row is a button labelled name, position, score', () => {
    const entries = [
      { id: 'a', position: 2, position_tied: true, score: -4, thru: 9, round_1: -4, player: { id: 'pa', full_name: 'Player A' } },
    ] as unknown as BoardEntry[];
    const view = mount(entries, 1);
    expect(view.container.querySelector('button')?.getAttribute('aria-label')).toBe('Player A, T2, −4');
  });
  it('live round two renders no MOV track before POS', () => {
    const entries = [
      { id: 'a', position: 1, score: -6, thru: 9, round_1: -1, round_2: -5, player: { id: 'pa', full_name: 'Player A' } },
      { id: 'b', position: 2, score: -4, thru: 9, round_1: -4, round_2: 0, player: { id: 'pb', full_name: 'Player B' } },
    ] as unknown as BoardEntry[];
    const view = mount(entries, 2);
    const header = view.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.gridTemplateColumns.startsWith('26px minmax(0,1fr)')).toBe(true);
    expect(view.container.textContent).not.toContain('\u25B2');
  });
});

describe('one board geometry', () => {
  const liveEntries = [
    { id: 'a', position: 1, score: -5, thru: 9, round_1: -3, round_2: -2, player: { id: 'pa', full_name: 'Player A' } },
    { id: 'b', position: 2, score: -4, thru: 7, round_1: -2, round_2: -2, player: { id: 'pb', full_name: 'Player B' } },
  ] as unknown as BoardEntry[];
  const wrap = (el: ReturnType<typeof createElement>) => createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, null, el),
  );

  it('BoardTable right-aligns THRU and round columns and keeps POS centred', () => {
    const view = render(wrap(createElement(BoardTable, {
      entries: liveEntries, cutState: { kind: 'none', cutline: null, extraCount: 0 }, currentRound: 2, showHeader: true,
    })));
    const c = view.container;
    const thruHeader = c.querySelector<HTMLElement>('[data-board-thru-header]');
    expect(thruHeader?.style.textAlign).toBe('right');
    const thruCells = c.querySelectorAll<HTMLElement>('[data-board-thru-cell]');
    expect(thruCells.length).toBeGreaterThan(0);
    thruCells.forEach((el) => expect(el.style.textAlign).toBe('right'));
    const roundHeaders = c.querySelectorAll<HTMLElement>('[data-board-round-header]');
    expect(roundHeaders.length).toBeGreaterThan(0);
    roundHeaders.forEach((el) => expect(el.style.textAlign).toBe('right'));
    c.querySelectorAll<HTMLElement>('[data-board-round-cell]').forEach((el) => expect(el.style.textAlign).toBe('right'));
    expect(c.querySelector<HTMLElement>('[data-board-pos-header]')?.style.textAlign).toBe('center');
  });

  it('the hero board draws round cells at BoardTable\'s round-cell width', () => {
    const entries = liveEntries.map((e) => ({ ...e, thru: 18 }));
    const view = render(wrap(createElement(MiniBoard, { tournamentId: 'event', entries, limit: 5, phase: 'completed', theme: 'heroBoard' })));
    const header = view.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.gridTemplateColumns).toContain(`${BOARD_GEOMETRY.cell}px ${BOARD_GEOMETRY.cell}px`);
    expect(header?.style.gridTemplateColumns.endsWith(`${BOARD_GEOMETRY.tot}px`)).toBe(true);
  });
});

describe('BRIEF_TOUR_OVERVIEW_MOCK_EXACT coverage', () => {
  i18n.addResourceBundle(i18n.language || 'en', 'tourhub', enTourhub, true, true);
  const t = i18n.getFixedT(i18n.language || 'en', 'tourhub') as unknown as (k: string, o?: Record<string, unknown>) => string;

  it('(a) the round spine renders live and suspended, never upcoming or a finished result', () => {
    const states: Array<[HeroState, boolean]> = [
      [{ kind: 'live', round: 2, totalRounds: 4 }, true],
      [{ kind: 'suspended', round: 3, totalRounds: 4, reason: null }, true],
      [{ kind: 'upcoming', variant: 'later' as never, countdown: '', meta: '' }, false],
      [{ kind: 'results', variant: 'final' as never, finishDate: '2026-10-10', meta: '' }, false],
    ];
    for (const [state, shown] of states) {
      const view = render(createElement(PhotoBand, { title: 'Event', venueName: null, datesString: null, venueImageUrl: null, state, tourLabel: null, leader: null, countdown: [], startDay: null, onOpen: () => {} }));
      const spine = view.container.querySelector('[data-overview-round-spine]');
      expect(Boolean(spine)).toBe(shown);
      if (spine) {
        expect(spine.querySelectorAll('[data-round-node]').length).toBe(4);
        expect(spine.querySelector('[data-round-node="live"]')?.textContent).toBe(`R${(state as { round: number }).round}`);
      }
      view.unmount();
    }
  });

  it('(b) countInWords is words for 2–10 and a numeral past 10; the trio caps state the TRUE count', () => {
    expect([2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => countInWords(n, t))).toEqual(['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']);
    expect(countInWords(11, t)).toBe('11');
    const rows = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, position: 1, position_tied: true, score: -12, player: { id: `p${id}`, full_name: `Player ${id.toUpperCase()}` } })) as unknown as BoardEntry[];
    const trio = buildLeaderTrio(rows, false, 'pga', t);
    expect(trio?.faces.length).toBe(3);
    expect(trio?.caps).toBe('Five tied');
    const sole = buildLeaderTrio([{ ...rows[0], position_tied: false }, { ...rows[1], position: 2 }] as BoardEntry[], false, 'pga', t);
    expect(sole?.faces.length).toBe(1);
    expect(sole?.caps).toBe('A');
  });

  it('(c) the tie cap renders once over a tied top group whose rows carry no position; absent when the top is not tied', () => {
    const mountLive = (entries: BoardEntry[]) => render(createElement(
      QueryClientProvider,
      { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
      createElement(MemoryRouter, null,
        createElement(MiniBoard, { tournamentId: 'event', entries, limit: 5, currentRound: 2, phase: 'live', theme: 'heroBoard', totalRounds: 4 })),
    ));
    const tied = [
      { id: 'a', position: 1, position_tied: true, score: -6, thru: 9, round_1: -1, round_2: -5, player: { id: 'pa', full_name: 'Player A' } },
      { id: 'b', position: 1, position_tied: true, score: -6, thru: 9, round_1: -3, round_2: -3, player: { id: 'pb', full_name: 'Player B' } },
      { id: 'c', position: 1, position_tied: true, score: -6, thru: 9, round_1: -4, round_2: -2, player: { id: 'pc', full_name: 'Player C' } },
      { id: 'd', position: 4, score: -4, thru: 9, round_1: -4, round_2: 0, player: { id: 'pd', full_name: 'Player D' } },
    ] as unknown as BoardEntry[];
    const view = mountLive(tied);
    const caps = view.container.querySelectorAll('[data-hero-tie-cap]');
    expect(caps.length).toBe(1);
    expect(caps[0].textContent).toBe('T1Three tied');
    const group = view.container.querySelector('[data-hero-tie-group]')!;
    expect(group.querySelectorAll('[data-hero-tie="capped"]').length).toBe(3);
    group.querySelectorAll('[data-hero-tie="capped"]').forEach((cell) => {
      // CB57 adds an aria-hidden bracket, not a visible position label.
      expect(cell.querySelector(':not(.sr-only):not([data-hero-tie-bracket])')).toBeNull();
    });
    view.unmount();
    const solo = mountLive([{ ...tied[0], position_tied: false }, { ...tied[3], position: 2 }] as BoardEntry[]);
    expect(solo.container.querySelector('[data-hero-tie-cap]')).toBeNull();
    expect(solo.container.querySelector('[data-hero-tie-group]')).toBeNull();
  });

  it('(d) pickMovementCards drops zeros, keeps the three largest, gained before lost, never pads', () => {
    const c = (key: string, delta: number) => ({ key, delta });
    expect(pickMovementCards([c('z', 0), c('a', -5), c('b', 2), c('c', 7), c('d', -1), c('e', 3)]).map((x) => x.key)).toEqual(['c', 'e', 'a']);
    expect(pickMovementCards([c('a', 0), c('b', -2)]).map((x) => x.key)).toEqual(['b']);
    expect(pickMovementCards([c('a', 0)])).toEqual([]);
  });
});
