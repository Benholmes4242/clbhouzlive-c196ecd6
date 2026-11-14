import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Lewy Hayward's real WAGR shape: rank 318 (321 last week, 643 a year ago,
// 4,440 in July 2024), best 312th, 3 wins, 15 top 10s, 36 counting events.
const h = vi.hoisted(() => ({
  summary: null as any,
  history: [] as any[],
  events: [] as any[],
  historyError: false,
  eventsError: false,
  link: null as any,
  invoke: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toast } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: h.invoke }, from: (table: string) => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    delete: () => chain,
    single: () => Promise.resolve({ data: { show_tour_results: true }, error: null }),
    maybeSingle: () => Promise.resolve({ data: table === 'amateur_rank_links' ? h.link : h.summary, error: null }),
    then: (resolve: any) => Promise.resolve(table === 'amateur_career_moments' ? { data: [], error: null } : {
      data: table === 'amateur_rank_history' ? (h.historyError ? null : h.history) : h.eventsError ? null : h.events,
      error: (table === 'amateur_rank_history' ? h.historyError : h.eventsError) ? new Error('read failed') : null,
    }).then(resolve),
  };
  return chain;
} } }));

import { ProfileRankingTab } from '@/features/amateur-ranking/ProfileRankingTab';
import { SettingsWagrCard } from '@/features/amateur-ranking/SettingsWagrCard';
import { axisLabel, eventMonthLabel, finishLabel, insertRankingTab, rankingChartPoints, rankingLabelY, rankingMovement, rankingTabVisible } from '@/features/amateur-ranking/rankingTabRules';
import { wagrOrdinal } from '@/features/amateur-ranking/wagrSettingsRules';

const LEWY_SUMMARY = { user_id: 'member', rank: 318, best_rank: 312, wins: 3, top10s: 15, counting_events: 36, points_average: 590.49, divisor: 40, rank_week: 202645, fetched_at: '2026-11-12T00:00:00Z' };
const LEWY_HISTORY = [
  { id: 1, user_id: 'member', week: 202428, rank: 4440, finish: '1', event_name: 'English Amateur', points: 12, event_id: 1 },
  { id: 2, user_id: 'member', week: 202440, rank: 800, finish: null, event_name: null, points: null, event_id: null },
  { id: 3, user_id: 'member', week: 202544, rank: 643, finish: null, event_name: null, points: null, event_id: null },
  { id: 4, user_id: 'member', week: 202644, rank: 321, finish: null, event_name: null, points: null, event_id: null },
  { id: 5, user_id: 'member', week: 202645, rank: 318, finish: '2', event_name: 'Swedish International', points: 8.46, event_id: 6 },
];
// Real database shape: event_week is the DATE of the ISO week's Thursday;
// the WAGR "WW/YYYY" text lives in week_year.
const LEWY_EVENTS = [
  { wagr_event_id: 6, user_id: 'member', event_name: "Swedish International Men's Amateur Championship", event_week: '2026-09-24', country: 'Sweden', finish: '2', points: 8.46, counting: true, week_year: '39/2026', event_type: null, format: null, updated_at: '' },
  { wagr_event_id: 5, user_id: 'member', event_name: 'Bernhard Langer German International Amateur', event_week: '2026-09-17', country: 'Germany', finish: '21', points: 3.64, counting: true, week_year: '38/2026', event_type: null, format: null, updated_at: '' },
  { wagr_event_id: 4, user_id: 'member', event_name: "Men's and Women's Home International Matches", event_week: '2026-08-27', country: 'Ireland', finish: 'Participant', points: 1.62, counting: true, week_year: '35/2026', event_type: null, format: null, updated_at: '' },
  { wagr_event_id: 3, user_id: 'member', event_name: "South of Ireland Men's Amateur Open Championship", event_week: '2026-07-23', country: 'Ireland', finish: '33', points: 4.94, counting: true, week_year: '30/2026', event_type: null, format: null, updated_at: '' },
  { wagr_event_id: 2, user_id: 'member', event_name: 'European Amateur Team Championship', event_week: '2026-07-16', country: 'Estonia', finish: 'Participant', points: 2.4, counting: true, week_year: '29/2026', event_type: null, format: null, updated_at: '' },
  { wagr_event_id: 1, user_id: 'member', event_name: 'English Men\'s Open Amateur Stroke Play', event_week: '2026-06-18', country: null, finish: '5', points: null, counting: true, week_year: '25/2026', event_type: null, format: null, updated_at: '' },
];

const clients: QueryClient[] = [];
function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(node, { wrapper });
}
beforeEach(() => {
  vi.clearAllMocks();
  h.summary = LEWY_SUMMARY; h.history = LEWY_HISTORY; h.events = LEWY_EVENTS;
  h.historyError = false; h.eventsError = false; h.link = null;
  h.invoke.mockImplementation(async () => ({ data: {}, error: null }));
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

// --- Tab gating ---
it('Ranking tab shows for a personal non-pro with a summary row', () => {
  expect(rankingTabVisible(true, null, LEWY_SUMMARY)).toBe(true);
});
it('No summary row means no Ranking tab', () => {
  expect(rankingTabVisible(true, null, null)).toBe(false);
});
it('A verified pro never gets a Ranking tab', () => {
  expect(rankingTabVisible(true, { pro_kind: 'tour_pro' }, LEWY_SUMMARY)).toBe(false);
});
it('Business profiles never get a Ranking tab', () => {
  expect(rankingTabVisible(false, null, LEWY_SUMMARY)).toBe(false);
});
it('Ranking is inserted directly after Posts', () => {
  const tabs = insertRankingTab([{ id: 'activity', label: 'Posts' }, { id: 'courses', label: 'Courses' }, { id: 'handicap', label: 'Handicap' }]);
  expect(tabs.map(t => t.id)).toEqual(['activity', 'ranking', 'courses', 'handicap']);
});

// --- Movement wording ---
it('Movement matches Lewy: up 3 this week, up 325 in a year', () => {
  expect(rankingMovement(LEWY_HISTORY)).toEqual({ thisWeek: { direction: 'up', amount: 3 }, year: { direction: 'up', amount: 325 } });
});
it('Movement down when the rank worsens', () => {
  const rows = LEWY_HISTORY.map(r => ({ ...r }));
  rows[3] = { ...rows[3], rank: 300 }; rows[4] = { ...rows[4], rank: 318 };
  expect(rankingMovement(rows)?.thisWeek).toEqual({ direction: 'down', amount: 18 });
});
it('Equal ranks read no change', () => {
  const rows = LEWY_HISTORY.map(r => ({ ...r }));
  rows[3] = { ...rows[3], rank: 318 };
  expect(rankingMovement(rows)?.thisWeek).toEqual({ direction: 'same', amount: 0 });
});
it('No year-old row leaves the year part out', () => {
  expect(rankingMovement(LEWY_HISTORY.slice(3))?.year).toBeNull();
});
it('Fewer than two weeks of history shows no movement', () => {
  expect(rankingMovement([LEWY_HISTORY[4]])).toBeNull();
  expect(rankingMovement([LEWY_HISTORY[3], { ...LEWY_HISTORY[4], id: 6, week: 202644 }])).toBeNull();
});

// --- Chart maths ---
it('Chart first and last points match the log scale', () => {
  const points = rankingChartPoints(LEWY_HISTORY);
  expect(points[0]).toMatchObject({ x: 4, y: 100, rank: 4440 });
  expect(points[4]).toMatchObject({ x: 346, y: 14, rank: 318 });
});
it('Win dots come only from rows finishing 1', () => {
  const wins = rankingChartPoints(LEWY_HISTORY).filter(p => p.finish === '1');
  expect(wins).toHaveLength(1);
  expect(wins[0]).toMatchObject({ x: 4, y: 100 });
});
it('Rank labels flip under their point only below y 4', () => {
  expect(rankingLabelY(100, -16, 14)).toBe(84);
  expect(rankingLabelY(14, -8, 14)).toBe(6);
  expect(rankingLabelY(50, -8, 14)).toBe(42);
  expect(rankingLabelY(11, -8, 14)).toBe(25);
});
it('Lewy last label stays at y 6.6, unflipped', () => {
  expect(rankingLabelY(14.6, -8, 14)).toBe(6.6);
});
it('Equal ranks sit on the middle line', () => {
  const points = rankingChartPoints([LEWY_HISTORY[3], { ...LEWY_HISTORY[4], rank: 321 }]);
  expect(points.map(p => p.y)).toEqual([57, 57]);
});
it('Axis and event labels come from the ISO week Thursday', () => {
  expect(axisLabel(202428)).toBe('JUL 2024');
  expect(axisLabel(202645)).toBe('NOV 2026');
  expect(eventMonthLabel({ event_week: '2026-09-24', week_year: '39/2026' })).toBe('Sep 2026');
});
it('Event label falls back to week_year, then blank', () => {
  expect(eventMonthLabel({ event_week: null, week_year: '39/2026' })).toBe('Sep 2026');
  expect(eventMonthLabel({ event_week: null, week_year: null })).toBe('');
});

// --- Ordinals and finishes ---
it('Ordinals cover 11th, 12th, 13th, 21st and 112th', () => {
  expect([11, 12, 13, 21, 112].map(wagrOrdinal)).toEqual(['11th', '12th', '13th', '21st', '112th']);
});
it('Participant reads Team dimmed; other words show as-is', () => {
  expect(finishLabel('Participant')).toEqual({ text: 'Team', dim: true });
  expect(finishLabel('2')).toEqual({ text: '2nd', dim: false });
  expect(finishLabel('WD')).toEqual({ text: 'WD', dim: true });
});

// --- The tab itself ---
it('Tab renders Lewy headline, movement, tiles and foot', async () => {
  mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('▲ 3');
  expect(screen.getByText('WORLD AMATEUR RANKING')).toBeInTheDocument();
  expect(screen.getByText('▲ 3')).toBeInTheDocument();
  expect(screen.getByText('▲ 325')).toBeInTheDocument();
  expect(screen.getByText('312th')).toBeInTheDocument();
  expect(screen.getByText('BEST RANK')).toBeInTheDocument();
  expect(screen.getByText('TOP 10S')).toBeInTheDocument();
  expect(screen.getByText('Points average 590.49 · last 104 weeks · updated weekly from WAGR®')).toBeInTheDocument();
});
it('Chart draws with two or more rows and labels the ends', async () => {
  const view = mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('4,440');
  const svg = view.container.querySelector('svg.amr-ch');
  expect(svg).not.toBeNull();
  expect(svg!.querySelectorAll('circle[fill="#FBBC2E"]')).toHaveLength(1);
  expect(screen.getByText('4,440')).toBeInTheDocument();
  expect(screen.getByText('JUL 2024')).toBeInTheDocument();
  expect(screen.getByText('NOV 2026')).toBeInTheDocument();
});
it('A single history row draws no chart', async () => {
  h.history = [LEWY_HISTORY[4]];
  const view = mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('#318');
  expect(view.container.querySelector('svg.amr-ch')).toBeNull();
});
it('Five events show, then See all expands in place', async () => {
  mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('RECENT EVENTS');
  expect(screen.getAllByText('PTS')).toHaveLength(5);
  expect(screen.queryByText('English Men\'s Open Amateur Stroke Play')).toBeNull();
  fireEvent.click(screen.getByText('See all 6 counting events ›'));
  expect(screen.getAllByText('PTS')).toHaveLength(6);
  expect(screen.getByText('English Men\'s Open Amateur Stroke Play')).toBeInTheDocument();
  expect(screen.queryByText(/See all/)).toBeNull();
});
it('Event rows show ordinal finishes, Team and the points dash', async () => {
  mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('RECENT EVENTS');
  expect(screen.getByText('2nd')).toBeInTheDocument();
  expect(screen.getByText('21st')).toBeInTheDocument();
  expect(screen.getAllByText('Team')).toHaveLength(2);
  expect(screen.getByText('Sep 2026 · Sweden')).toBeInTheDocument();
  fireEvent.click(screen.getByText('See all 6 counting events ›'));
  expect(screen.getByText('Jun 2026')).toBeInTheDocument();
  expect(screen.getByText('–')).toBeInTheDocument();
});
it('A failed events read removes only the events section', async () => {
  h.eventsError = true;
  mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('#318');
  expect(screen.queryByText('RECENT EVENTS')).toBeNull();
  expect(screen.getByText('312th')).toBeInTheDocument();
});
it('A failed history read removes movement and chart but keeps figures', async () => {
  h.historyError = true;
  const view = mount(<ProfileRankingTab userId="member" />);
  await screen.findByText('#318');
  expect(view.container.querySelector('svg.amr-ch')).toBeNull();
  expect(screen.queryByText(/this week/)).toBeNull();
  expect(screen.getByText('312th')).toBeInTheDocument();
});

// --- Settings card through the shared hook ---
it('SettingsWagrCard still shows 318, 312th and 36 through the shared summary hook', async () => {
  h.link = { status: 'verified', last_synced_at: null };
  const view = mount(<SettingsWagrCard userId="member" />);
  await screen.findByText('312th');
  expect(view.container.querySelector('[data-figure="World rank"] b')?.textContent).toBe('318');
  expect(view.container.querySelector('[data-figure="Events"] b')?.textContent).toBe('36');
});
