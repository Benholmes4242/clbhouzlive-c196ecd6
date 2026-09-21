import { describe, expect, it } from 'vitest';
import { formatOverviewChampionScore, formatOverviewDateRange, getOverviewCountdown } from '@/features/tourhub/components/overview-v3/HybridHero';
import { detectTopTie, fmtScore, shortenName } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { compactUpcomingFacts, overviewTournamentDoorKey, shouldLoadUpcomingFacts, shouldShowOverviewBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { shouldShowOverviewPrize } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
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

  it('keeps the established playoff and winning-margin copy in the champion strip score', () => {
    const t = (key: string, options?: { count: number }) => key.endsWith('playoff') ? 'playoff' : `by ${options?.count}`;
    expect(formatOverviewChampionScore(-26, false, 2, t)).toBe('−26 · by 2');
    expect(formatOverviewChampionScore(-18, true, null, t)).toBe('−18 · playoff');
    expect(formatOverviewChampionScore(-12, false, null, t)).toBe('−12');
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
    expect(shouldShowOverviewBoard([{ position: 1, score: 0 }])).toBe(true);
    expect(shouldShowOverviewBoard([{ position: null, score: -1 }])).toBe(true);
  });

  it('shows prize only when every displayed completed row has money', () => {
    const row = (id: string, money: number | null) => ({ id, position: 1, score: -10, money });
    const paid = Array.from({ length: 6 }, (_, index) => row(String(index), 1_000 + index));
    expect(shouldShowOverviewPrize(paid, 5)).toBe(true);
    expect(shouldShowOverviewPrize([row('paid', 1_000), row('missing', null)], 5)).toBe(false);
    expect(shouldShowOverviewPrize([...paid.slice(0, 5), row('outside-slice', null)], 5)).toBe(true);
    expect(shouldShowOverviewPrize([], 5)).toBe(false);
  });

  it('keeps Also This Week inside the coming Sunday', () => {
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-20T20:00:00Z'), NOW)).toBe(true);
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-21T00:00:00Z'), NOW)).toBe(false);
    expect(isAlsoThisWeek(slide('live', '2026-09-10T00:00:00Z'), NOW)).toBe(true);
  });

  it('shows weekday alone beyond 24 hours and adds time inside 24 hours', () => {
    expect(statusFor(slide('upcoming', '2026-09-19T15:00:00Z'), NOW)).toBe('Starts Saturday');
    expect(statusFor(slide('upcoming', '2026-09-17T15:42:00Z'), NOW)).toContain('15:42');
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
