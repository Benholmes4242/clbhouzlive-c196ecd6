import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'fs';
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ count }: { count?: number }) => <span><b>{count} new</b> since your last visit</span>,
  useTranslation: () => ({
    t: (k: string, o?: { defaultValue?: string; count?: number; n?: number; query?: string }) => {
      if (k === 'news.page.searchEmpty') return `No stories match "${o?.query}".`;
      if (k === 'news.page.searchPlaceholder') return 'Search stories';
      if (k === 'news.page.showOlder') return 'Show older stories';
      if (k === 'news.page.read') return '✓ Read';
      if (k === 'news.minRead') return `${o?.n} min read`;
      if (o?.count != null) {
        if (k.includes('searchResults')) return `${o.count} ${o.count === 1 ? 'STORY' : 'STORIES'}`;
        if (k.includes('yourPlayersCount')) return `${o.count} ${o.count === 1 ? 'story' : 'stories'}`;
        if (k.includes('likes')) return `${o.count} ${o.count === 1 ? 'like' : 'likes'}`;
        if (k.includes('comments')) return `${o.count} ${o.count === 1 ? 'comment' : 'comments'}`;
        if (k.includes('minutes')) return `${o.count} min read`;
      }
      return o?.defaultValue ?? '';
    },
  }),
}));
const h = vi.hoisted(() => ({
  stories: [] as import('@/features/tourhub/news/useTourStories').TourStory[],
  engagement: {} as Record<string, { likeCount: number; commentCount: number; viewerLiked: boolean }>,
  follows: new Set<string>(),
  user: { id: 'member' } as { id: string } | null,
  guest: false,
  eventNames: new Map<string, string>(),
  search: { debounced: '', active: false, results: [] as unknown[], isLoading: false, settled: false },
  tournament: null as Record<string, unknown> | null,
  tournamentPending: false,
  board: undefined as unknown[] | undefined,
  from: vi.fn(),
}));
vi.mock('@/features/tourhub/news/useTourStories', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/news/useTourStories')>();
  return { ...orig, useTourStories: () => ({ stories: h.stories, isLoading: false, latestAt: null }) };
});
vi.mock('@/features/stories/useStoryEngagement', () => ({
  useStoryEngagement: () => ({ engagementFor: (id: string) => h.engagement[id] ?? { likeCount: 0, commentCount: 0, viewerLiked: false } }),
}));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: h.follows }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => h.guest }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/features/tourhub/overview/sections/useOverviewNewsData', () => ({ useOverviewNewsData: () => new Map() }));
vi.mock('@/features/tourhub/news/newsPageData', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/news/newsPageData')>();
  return {
    ...orig,
    useNewsEventNames: () => ({ data: h.eventNames }),
    useNewsSearch: () => h.search,
    useNewsEventBoard: () => ({ data: h.board }),
  };
});
vi.mock('@/features/tourhub/hooks/useTourHubData', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/hooks/useTourHubData')>();
  return { ...orig, useTourTournament: () => ({ data: h.tournament, isPending: h.tournamentPending }) };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (...args: unknown[]) => h.from(...args) } }));
import { NewsTab } from '@/features/tourhub/news/NewsTab';
import { NewsEventCard } from '@/features/tourhub/news/NewsEventCard';
import { NEWS_LAST_SEEN, NEWS_OPENED } from '@/features/tourhub/news/newsVisit';
import {
  archiveGroups, assignTopStories, eventChips, eventStartLine, highlightSegments,
  marginWord, yourPlayersStories,
} from '@/features/tourhub/news/newsPageRules';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

const NOW = new Date('2026-10-28T12:00:00'); // a Wednesday
const day = 24 * 3600e3;
function story(id: string, overrides: Partial<TourStory> = {}): TourStory {
  return {
    id, slug: id, kicker: `Kicker ${id}`, headline: `Headline ${id}`, standfirst: `Standfirst ${id}`,
    body_blocks: [], image_url: `/img/${id}.jpg`, image_credit: null,
    tour_slug: 'pga', tournament_id: null, published_at: new Date(NOW.getTime() - day).toISOString(),
    ...overrides,
  };
}
/** 18 stories: lead + your-players + pair + 3 rows + 11 archive. */
function pageStories(): TourStory[] {
  const list: TourStory[] = [
    story('lead', { tournament_id: 't1', published_at: new Date(NOW.getTime() - 2 * 3600e3).toISOString() }),
    story('yours', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 5 * 3600e3).toISOString() }),
    story('pair-a'), story('pair-b'),
    story('row-a'), story('row-b'), story('row-c'),
  ];
  const archiveDates = [
    0, 1, 2,           // this week (Wed 28, Tue 27, Mon 26)
    4, 6,              // last week (Sat 24, Thu 22)
    10, 20,            // earlier October
    40,                // September 2026
    400, 500,          // 2025
  ];
  archiveDates.forEach((daysBack, i) => {
    list.push(story(`arc-${i}`, {
      published_at: new Date(NOW.getTime() - daysBack * day).toISOString(),
      tournament_id: i < 4 ? 't1' : i < 7 ? 't2' : 't3',
    }));
  });
  return list;
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
  localStorage.clear();
  h.stories = pageStories();
  h.engagement = {};
  h.follows = new Set();
  h.user = { id: 'member' };
  h.guest = false;
  h.eventNames = new Map([['t1', 'Abu Dhabi Aldar Championship'], ['t2', 'Irish Open'], ['t3', 'BMW PGA Championship']]);
  h.search = { debounced: '', active: false, results: [], isLoading: false, settled: false };
  h.tournament = null;
  h.tournamentPending = false;
  h.board = undefined;
  h.from.mockReset();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function mountPage() {
  return render(<MemoryRouter><NewsTab immersiveHero={false} /></MemoryRouter>);
}

describe('News page head and freshness', () => {
  it('renders the Tour News head with the search button and no hero under the chrome', () => {
    mountPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Tour News' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search stories' })).toBeTruthy();
  });
  it('shares the overview freshness rule: a story opened there is not new here', () => {
    localStorage.setItem(NEWS_LAST_SEEN, String(NOW.getTime() - 3 * 3600e3));
    localStorage.setItem(NEWS_OPENED, JSON.stringify(['lead']));
    mountPage();
    // lead (2h ago) is opened; yours (5h ago) predates the baseline.
    expect(screen.queryByText(/new since your last visit/)).toBeNull();
    localStorage.setItem(NEWS_OPENED, JSON.stringify([]));
    cleanup();
    mountPage();
    expect(screen.getByText(/new since your last visit/)).toHaveTextContent('1 new');
  });
  it('hides the new line on a first visit', () => {
    mountPage();
    expect(screen.queryByText(/new since your last visit/)).toBeNull();
  });
});

describe('News page lead', () => {
  it('keeps everything at the bottom of a 440px hero with nothing over the top', () => {
    mountPage();
    const lead = screen.getByTestId('tour-news-lead');
    expect(lead.className).toBe('tour-news-lead');
    const copy = lead.querySelector('.tour-news-lead-copy');
    expect(copy?.querySelector('h2')).toHaveTextContent('Headline lead');
    expect(copy?.querySelector('.tour-news-standfirst')).toHaveTextContent('Standfirst lead');
    // Only the photo precedes the bottom copy — nothing sits over the top.
    const children = [...lead.children];
    expect(children[0].tagName).toBe('IMG');
    expect(children[1]).toBe(copy);
    expect(children).toHaveLength(2);
  });
  it('appends like and comment counts to the details line only above zero, with singular forms', () => {
    h.engagement = { lead: { likeCount: 1, commentCount: 0, viewerLiked: false }, 'pair-a': { likeCount: 12, commentCount: 2, viewerLiked: false } };
    mountPage();
    const lead = screen.getByTestId('tour-news-lead');
    expect(lead.querySelector('.overview-news-details')).toHaveTextContent('1 like');
    expect(lead.querySelector('.overview-news-details')).not.toHaveTextContent('comment');
    expect(screen.getByLabelText('Read Headline pair-a').querySelector('.overview-news-details')).toHaveTextContent('12 likes · 2 comments');
  });
  it('has no like or comment buttons anywhere on the page', () => {
    mountPage();
    expect(screen.queryByLabelText(/like story/i)).toBeNull();
    expect(screen.queryByLabelText(/comments/i)).toBeNull();
  });
});

describe('News page event card', () => {
  const tournament = (status: string, start: string, end: string, round = 3) => ({
    id: 't1', name: 'Abu Dhabi Aldar Championship hosted by Nobody', status,
    start_date: start, end_date: end, current_round: round, tour_code: 'euro',
  });
  const entry = (id: string, pos: number, score: number, name: string, thru: number | null = 12) => ({
    id, tournament_id: 't1', position: pos, position_tied: false, score, thru, today: -2, today_round: 3,
    player: { id, full_name: name, last_name: name.split(' ').pop() },
  });
  it('before: start date, countdown and field-not-out while no draw exists', () => {
    h.tournament = tournament('scheduled', '2026-10-31T09:00:00', '2026-11-02T18:00:00');
    h.board = [];
    render(<MemoryRouter><NewsEventCard tournamentId="t1" follows={new Set()} /></MemoryRouter>);
    expect(screen.getByTestId('tour-news-event-start')).toHaveTextContent('Starts Sat 31 Oct · in 3 days · field not out yet');
    expect(screen.getByTestId('tour-news-event-card')).toHaveTextContent('Abu Dhabi Aldar Championship');
  });
  it('before: drops the field clause once a draw exists', () => {
    h.tournament = tournament('scheduled', '2026-10-29T09:00:00', '2026-11-01T18:00:00');
    h.board = [entry('p1', 1, 0, 'Tommy Fleetwood', null)];
    render(<MemoryRouter><NewsEventCard tournamentId="t1" follows={new Set()} /></MemoryRouter>);
    expect(screen.getByTestId('tour-news-event-start')).toHaveTextContent('Starts Thu 29 Oct · tomorrow');
    expect(screen.getByTestId('tour-news-event-start')).not.toHaveTextContent('field not out');
  });
  it('live: top three rows, a followed player amber inside and outside the top three', () => {
    h.tournament = tournament('inprogress', '2026-10-26T09:00:00', '2026-10-29T18:00:00');
    h.board = [
      entry('p1', 1, -15, 'Tyrrell Hatton', 14),
      entry('p2', 2, -13, 'Rasmus Hojgaard', null),
      entry('p3', 3, -12, 'Tommy Fleetwood', 12),
      entry('p4', 4, -11, 'Rory McIlroy', 9),
    ];
    render(<MemoryRouter><NewsEventCard tournamentId="t1" follows={new Set(['p3', 'p4'])} /></MemoryRouter>);
    const card = screen.getByTestId('tour-news-event-card');
    expect(card).toHaveTextContent('Live · R3');
    const rows = screen.getAllByTestId('tour-news-event-row');
    expect(rows).toHaveLength(4);
    expect(rows[2].className).toContain('you');
    expect(rows[2]).toHaveTextContent('★ Fleetwood');
    expect(rows[3].className).toContain('you');
    expect(rows[3]).toHaveTextContent('★ McIlroy');
    expect(card).toHaveTextContent('Full leaderboard ›');
  });
  it('finished: winner by a margin, and the playoff form when tied', () => {
    h.tournament = tournament('closed', '2026-10-22T09:00:00', '2026-10-25T18:00:00');
    h.board = [entry('p1', 1, -18, 'Tyrrell Hatton'), { ...entry('p2', 2, -16, 'Rory McIlroy') }];
    const { unmount } = render(<MemoryRouter><NewsEventCard tournamentId="t1" follows={new Set()} /></MemoryRouter>);
    expect(screen.getByTestId('tour-news-event-result')).toHaveTextContent('Hatton won at −18, by two.');
    unmount();
    h.board = [entry('p1', 1, -18, 'Tyrrell Hatton'), entry('p2', 1, -18, 'Rory McIlroy')];
    render(<MemoryRouter><NewsEventCard tournamentId="t1" follows={new Set()} /></MemoryRouter>);
    expect(screen.getByTestId('tour-news-event-result')).toHaveTextContent('Hatton won in a playoff.');
  });
  it('uses deriveHeroState and carries no marquee', () => {
    const source = readFileSync('src/features/tourhub/news/NewsTab.tsx', 'utf8');
    expect(source).not.toContain('StoryLeaderboardStrip');
    expect(source).not.toContain('HeroWireTicker');
    const cardSource = readFileSync('src/features/tourhub/news/NewsEventCard.tsx', 'utf8');
    expect(cardSource).toContain('deriveHeroState');
    expect(cardSource).not.toContain('HeroWireTicker');
  });
});

describe('News page Your players', () => {
  it('lists up to three followed-player stories from the last 30 days, excluding the lead', () => {
    h.follows = new Set(['p1']);
    h.stories = [
      story('lead', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: NOW.toISOString() }),
      story('y1', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - day).toISOString() }),
      story('y2', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 2 * day).toISOString() }),
      story('y3', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 3 * day).toISOString() }),
      story('y4', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 4 * day).toISOString() }),
      story('old', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 40 * day).toISOString() }),
    ];
    mountPage();
    const section = screen.getByTestId('tour-news-your-players');
    expect(section).toHaveTextContent('YOUR PLAYERS');
    expect(section).toHaveTextContent('3 stories');
    expect(screen.getByLabelText('Read Headline y1')).toBeTruthy();
    expect(screen.getByLabelText('Read Headline y3')).toBeTruthy();
    expect(screen.queryByLabelText('Read Headline y4')).toBeNull();
  });
  it('uses the singular count for one story', () => {
    h.follows = new Set(['p1']);
    h.stories = [story('lead'), story('y1', { body_blocks: [{ type: 'player', player_id: 'p1' } as never] })];
    mountPage();
    expect(screen.getByTestId('tour-news-your-players')).toHaveTextContent('1 story');
  });
  it('is absent for guests and for members with no matching stories', () => {
    h.follows = new Set(['p1']);
    h.guest = true;
    h.user = null;
    const { unmount } = mountPage();
    expect(screen.queryByTestId('tour-news-your-players')).toBeNull();
    unmount();
    h.guest = false;
    h.user = { id: 'member' };
    h.follows = new Set();
    mountPage();
    expect(screen.queryByTestId('tour-news-your-players')).toBeNull();
  });
});

describe('News page Top stories and archive', () => {
  it('shows no story twice above the archive', () => {
    mountPage();
    const labels = screen.getAllByLabelText(/^Read Headline/).map((el) => el.getAttribute('aria-label'));
    expect(new Set(labels).size).toBe(labels.length);
  });
  it('groups the archive This week / Last week / month / month with year, weekday under the day', () => {
    mountPage();
    const headings = [...document.querySelectorAll('.tour-news-grp')].map((el) => el.textContent);
    expect(headings).toEqual(['THIS WEEK', 'LAST WEEK', 'OCTOBER', 'SEPTEMBER', 'SEPTEMBER 2025']);
    const firstRow = document.querySelector('.tour-news-ar');
    expect(firstRow?.querySelector('.tour-news-ar-date b')).toHaveTextContent('28');
    expect(firstRow?.querySelector('.tour-news-ar-date small')).toHaveTextContent('WED');
  });
  it('fades opened stories and swaps the reading time for ✓ Read', () => {
    localStorage.setItem(NEWS_OPENED, JSON.stringify(['arc-0']));
    mountPage();
    const readRow = screen.getByLabelText('Read Headline arc-0');
    expect(readRow.className).toContain('read');
    expect(readRow.querySelector('.tour-news-ar-meta')).toHaveTextContent('✓ Read');
    expect(readRow.querySelector('.tour-news-ar-meta')).not.toHaveTextContent('min read');
  });
  it('pages the archive with Show older stories', () => {
    mountPage();
    // 11 archive stories, page size 10: one is held back.
    expect(screen.queryByLabelText('Read Headline arc-10')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show older stories' }));
    expect(screen.getByLabelText('Read Headline arc-10')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show older stories' })).toBeNull();
  });
});

describe('News page By event', () => {
  it('names chips from the tournament read, with counts, newest story first', () => {
    mountPage();
    const rail = screen.getByRole('group', { name: 'By event' });
    const chips = [...rail.querySelectorAll('.tour-news-chip')].map((el) => el.textContent);
    expect(chips[0]).toBe('All');
    expect(chips[1]).toContain('Abu Dhabi Aldar Championship');
    expect(chips[1]).toContain('4');
    expect(chips[2]).toContain('Irish Open');
    expect(chips[3]).toContain('BMW PGA Championship');
  });
  it('filters the archive only — lead, Your players and Top stories stay', () => {
    h.follows = new Set(['p1']);
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: /Irish Open/ }));
    expect(screen.getByTestId('tour-news-lead')).toBeTruthy();
    expect(screen.getByTestId('tour-news-your-players')).toBeTruthy();
    expect(screen.getByLabelText('Read Headline pair-a')).toBeTruthy();
    // t2 stories are arc-4..arc-6.
    expect(screen.getByLabelText('Read Headline arc-4')).toBeTruthy();
    expect(screen.queryByLabelText('Read Headline arc-0')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByLabelText('Read Headline arc-0')).toBeTruthy();
  });
  it('renders no rail below three tournaments', () => {
    h.stories = pageStories().map((s) => (s.tournament_id === 't3' ? { ...s, tournament_id: 't2' } : s));
    mountPage();
    expect(screen.queryByRole('group', { name: 'By event' })).toBeNull();
  });
});

describe('News page search', () => {
  it('replaces the head with a focused field and Cancel restores the page', () => {
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: 'Search stories' }));
    expect(screen.getByTestId('tour-news-searchbar')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Tour News' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('heading', { name: 'Tour News' })).toBeTruthy();
    expect(screen.getByTestId('tour-news-lead')).toBeTruthy();
  });
  it('lists results newest first with the month under the day and the match underlined', () => {
    h.search = {
      debounced: 'rahm', active: true, settled: true, isLoading: false,
      results: [story('r1', { headline: 'Jon Rahm gives it back', published_at: '2026-10-19T10:00:00' })],
    };
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: 'Search stories' }));
    expect(screen.getByText('1 STORY')).toBeTruthy();
    const row = screen.getByLabelText('Read Jon Rahm gives it back');
    expect(row.querySelector('.tour-news-ar-date small')).toHaveTextContent('OCT');
    expect(row.querySelector('mark')).toHaveTextContent('Rahm');
  });
  it('shows the empty message when nothing matches', () => {
    h.search = { debounced: 'zzzz', active: true, settled: true, isLoading: false, results: [] };
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: 'Search stories' }));
    expect(screen.getByText('No stories match "zzzz".')).toBeTruthy();
  });
});

describe('News page pure rules', () => {
  it('groups archives on a Monday week boundary and names earlier months', () => {
    const groups = archiveGroups([
      story('a', { published_at: '2026-10-26T09:00:00' }), // Mon, this week
      story('b', { published_at: '2026-10-25T09:00:00' }), // Sun, last week
      story('c', { published_at: '2026-10-01T09:00:00' }),
      story('d', { published_at: '2025-09-15T09:00:00' }),
    ], NOW);
    expect(groups.map((g) => g.label)).toEqual(['THIS WEEK', 'LAST WEEK', 'OCTOBER', 'SEPTEMBER 2025']);
  });
  it('orders event chips by newest story and counts them', () => {
    const chips = eventChips([
      story('a', { tournament_id: 't1', published_at: '2026-10-20T09:00:00' }),
      story('b', { tournament_id: 't2', published_at: '2026-10-27T09:00:00' }),
      story('c', { tournament_id: 't1', published_at: '2026-10-21T09:00:00' }),
      story('d', { tournament_id: null }),
    ]);
    expect(chips).toEqual([
      { id: 't2', count: 1, newestAt: Date.parse('2026-10-27T09:00:00') },
      { id: 't1', count: 2, newestAt: Date.parse('2026-10-21T09:00:00') },
    ]);
  });
  it('assigns the pair only when two remain and caps rows at three', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => story(id));
    const { pair, rows } = assignTopStories(pool, new Set(['a']));
    expect(pair.map((s) => s.id)).toEqual(['b', 'c']);
    expect(rows.map((s) => s.id)).toEqual(['d', 'e', 'f']);
    expect(assignTopStories([story('only')], new Set()).pair).toEqual([]);
  });
  it('selects Your players stories by follow, recency and lead exclusion', () => {
    const follows = new Set(['p1']);
    const list = [
      story('lead', { body_blocks: [{ type: 'player', player_id: 'p1' } as never] }),
      story('hit', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 29 * day).toISOString() }),
      story('miss-old', { body_blocks: [{ type: 'player', player_id: 'p1' } as never], published_at: new Date(NOW.getTime() - 31 * day).toISOString() }),
      story('miss-player', { body_blocks: [{ type: 'player', player_id: 'p9' } as never] }),
    ];
    expect(yourPlayersStories(list, follows, 'lead', NOW).map((s) => s.id)).toEqual(['hit']);
    expect(yourPlayersStories(list, new Set(), 'lead', NOW)).toEqual([]);
  });
  it('highlights every case-insensitive match', () => {
    expect(highlightSegments('Rahm and rahm again', 'RAHM')).toEqual([
      { text: 'Rahm', match: true }, { text: ' and ', match: false },
      { text: 'rahm', match: true }, { text: ' again', match: false },
    ]);
  });
  it('formats the event start line with today/tomorrow forms and margin words', () => {
    expect(eventStartLine('2026-10-28T09:00:00', NOW)?.countdown).toBe('today');
    expect(eventStartLine('2026-10-29T09:00:00', NOW)?.countdown).toBe('tomorrow');
    expect(eventStartLine('2026-11-05T09:00:00', NOW)).toEqual({ date: 'Thu 5 Nov', countdown: 'in 8 days' });
    expect(marginWord(2)).toBe('two');
    expect(marginWord(11)).toBe('11');
  });
});

describe('News search read', () => {
  function searchBuilder(rows: unknown[]) {
    const calls: { or?: string; limit?: number } = {};
    const builder: Record<string, unknown> = {
      select: () => builder, not: () => builder, lte: () => builder,
      or: (clause: string) => { calls.or = clause; return builder; },
      order: () => builder,
      limit: (n: number) => { calls.limit = n; return builder; },
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    h.from.mockReturnValue(builder);
    return calls;
  }
  it('reads the server once after 250ms from the second character, within the lens', async () => {
    const rows = [
      { id: 's1', slug: 's1', headline: 'Rahm one', standfirst: null, kicker: null, body_blocks: [], image_url: null, image_credit: null, tour_slug: 'pga', tournament_id: null, published_at: '2026-10-19T10:00:00' },
      { id: 's2', slug: 's2', headline: 'Rahm two', standfirst: null, kicker: null, body_blocks: [], image_url: null, image_credit: null, tour_slug: 'lpga', tournament_id: null, published_at: '2026-10-18T10:00:00' },
      { id: 's3', slug: 's3', headline: 'Rahm three', standfirst: null, kicker: null, body_blocks: [], image_url: null, image_credit: null, tour_slug: null, tournament_id: null, published_at: '2026-10-17T10:00:00' },
    ];
    const calls = searchBuilder(rows);
    const { useNewsSearch } = await import('@/features/tourhub/news/newsPageData');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
    );
    const hook = renderHook(({ q }) => useNewsSearch(q, 'pga'), { initialProps: { q: 'r' }, wrapper });
    expect(h.from).not.toHaveBeenCalled();
    hook.rerender({ q: 'rahm' });
    await waitFor(() => expect(h.from).toHaveBeenCalledWith('tour_stories'));
    expect(calls.or).toBe('headline.ilike.%rahm%,standfirst.ilike.%rahm%,kicker.ilike.%rahm%');
    expect(calls.limit).toBe(50);
    await waitFor(() => expect(hook.result.current.settled).toBe(true));
    // The lens keeps pga and cross-tour (null) stories, drops lpga.
    expect(hook.result.current.results.map((s) => s.id)).toEqual(['s1', 's3']);
  });
});
