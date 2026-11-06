import React from 'react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Pinned to local midday: fixtures are stamped one hour ago and must stay in Today whatever time the suite runs.
vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 6, 12, 0) });
afterAll(() => vi.useRealTimers());
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  feed: null as unknown,
  summaries: new Map<string, unknown>(),
  markRead: vi.fn(),
}));
const chainable: unknown = new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : () => chainable) });
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(), from: () => chainable } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/features/activity-v2/hooks/useSharePrompt', () => ({ useSharePromptFor: () => null }));
vi.mock('@/features/activity-v2/markNotificationRead', () => ({ markNotificationRead: (...args: unknown[]) => h.markRead(...args) }));
vi.mock('@/features/activity-v2/hooks/useActivityFeedV2', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/activity-v2/hooks/useActivityFeedV2')>();
  return { ...orig, useActivityFeedV2: () => h.feed };
});
vi.mock('@/features/activity-v2/hooks/useActivityRoundSummaries', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/activity-v2/hooks/useActivityRoundSummaries')>();
  return { ...orig, useActivityRoundSummaries: () => h.summaries, useActivityRoundPages: () => h.summaries };
});
vi.mock('@/hooks/useUnreadNotifications', () => ({ useUnreadNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('@/features/activity-v2/hooks/useRecordsUnreadCount', () => ({ useRecordsUnreadCount: () => ({ data: 0 }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {} }));
vi.mock('@/components/layout/ManagePageShell', () => ({ ManagePageShell: ({ title, belowTitle, children }: { title: string; belowTitle?: React.ReactNode; children: React.ReactNode }) => <div><h1>{title}</h1>{belowTitle}{children}</div> }));
vi.mock('@/features/activity-v2/components/FriendRequestsRail', () => ({ FriendRequestsRail: () => null }));
vi.mock('@/features/social-suggestions/SuggestedGolfersBlock', () => ({ SuggestedGolfersBlock: () => null }));
vi.mock('@/features/social-suggestions/NobodySawThatRound', () => ({ NobodySawThatRound: () => null }));
vi.mock('@/features/activity-v2/components/FeaturedMomentCard', () => ({ FeaturedMomentCard: () => null, pickFeaturedRow: () => null }));
vi.mock('@/features/activity-v2/components/ActivityActionsSheet', () => ({ ActivityActionsSheet: () => null }));
import { bestRoundLine, foldKey, foldableRounds, openOrder, segmentRows } from '@/features/activity-v2/activityFoldRules';
import { ActivityFoldedRoundsRow } from '@/features/activity-v2/components/ActivityFoldedRoundsRow';
import { LedgerRow } from '@/features/activity-v2/components/LedgerRow';
import { ActivityPageV2 } from '@/features/activity-v2/ActivityPageV2';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';
import type { ActivityRoundSummary } from '@/features/activity-v2/hooks/useActivityRoundSummaries';

function summary(overrides: Partial<ActivityRoundSummary>): ActivityRoundSummary {
  return { whs_score_id: 's1', user_id: 'actor', course_id: 'c1', course_name: 'Sundridge Park Golf Club (East)', gross: 80, course_par: 72, to_par: 8, holes_played: 18, hole_to_par: null, avg_to_par_here: null, other_rounds_here: 0, at_viewer_club: false, ...overrides };
}
function round(id: string, overrides: Partial<ActivityFeedRowV2> = {}): ActivityFeedRowV2 {
  return { notif_id: `n-${id}`, notif_type: 'new_post', created_at: new Date(Date.now() - 3600e3).toISOString(), is_read: true, message: `${id} shared a round.`, title: null, entity_id: 'post', entity_type: 'post', data: { is_round: true, whs_score_id: `s-${id}` }, actor_user_id: `u-${id}`, actor_username: id, actor_display_name: `Actor ${id}`, actor_avatar_url: null, actor_kind: 'personal', actor_route_id: `u-${id}`, liker_avatar_urls: [], target_course_name: null, target_course_image: null, target_poster_url: null, target_review_rating: null, ...overrides };
}
const like: ActivityFeedRowV2 = { ...round('like'), notif_type: 'like', data: null, message: 'Actor like liked your post.' };

afterEach(() => { cleanup(); h.user = { id: 'viewer' }; h.feed = null; h.summaries = new Map(); h.markRead.mockReset(); });

describe('AC2 fold rules', () => {
  it('folds 3+ read rounds at the newest round position and leaves other rows in place', () => {
    const rows = [round('a'), like, round('b'), round('c')];
    const segments = segmentRows(rows, true);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ kind: 'fold' });
    expect(segments[1]).toMatchObject({ kind: 'row', row: { notif_id: 'n-like' } });
    expect((segments[0] as { rows: ActivityFeedRowV2[] }).rows.map((r) => r.notif_id)).toEqual(['n-a', 'n-b', 'n-c']);
  });
  it('does not fold two read rounds', () => {
    expect(segmentRows([round('a'), round('b')], true).every((s) => s.kind === 'row')).toBe(true);
  });
  it('never folds unread rounds', () => {
    const rows = [round('a'), round('b'), round('c'), round('d', { is_read: false })];
    const fold = segmentRows(rows, true).find((s) => s.kind === 'fold');
    expect(fold && (fold as { rows: ActivityFeedRowV2[] }).rows.map((r) => r.notif_id)).toEqual(['n-a', 'n-b', 'n-c']);
    expect(foldableRounds(rows, true)).toHaveLength(3);
  });
  it('folds nothing when folding is disabled', () => {
    expect(segmentRows([round('a'), round('b'), round('c')], false).every((s) => s.kind === 'row')).toBe(true);
  });
  it('keeps non-round rows out of the fold', () => {
    const rows = [round('a'), round('b'), round('c'), like, { ...round('post'), data: { is_round: false, whs_score_id: 's-post' } }];
    const fold = segmentRows(rows, true).find((s) => s.kind === 'fold');
    expect(fold && (fold as { rows: ActivityFeedRowV2[] }).rows).toHaveLength(3);
  });
  it('fold identity is the section label plus the newest round', () => {
    expect(foldKey('Today', [round('a'), round('b')])).toBe('Today:n-a');
  });
});

describe('AC2 best line and open order', () => {
  const rows = [round('a'), round('b'), round('c'), round('d')];
  const summaries = new Map<string, ActivityRoundSummary>([
    ['s-a', summary({ whs_score_id: 's-a', to_par: 12, gross: 84 })],
    ['s-b', summary({ whs_score_id: 's-b', to_par: 3, gross: 75 })],
    ['s-c', summary({ whs_score_id: 's-c', to_par: 8, gross: 80 })],
  ]);
  it('picks the lowest to_par 18-hole round with the shortened course', () => {
    expect(bestRoundLine(rows, summaries)).toEqual({ name: 'Actor b', gross: 75, course: 'Sundridge Park · East' });
  });
  it('ignores 9-hole rounds for the best line', () => {
    const nine = new Map(summaries);
    nine.set('s-b', summary({ whs_score_id: 's-b', to_par: -2, gross: 34, holes_played: 9 }));
    expect(bestRoundLine(rows, nine)?.name).toBe('Actor c');
  });
  it('omits the best line when no folded round has an 18-hole summary', () => {
    expect(bestRoundLine(rows, new Map())).toBeNull();
  });
  it('orders open rounds by to_par ascending with not-ready rounds last, newest first', () => {
    const ordered = openOrder(rows, summaries);
    expect(ordered.map((r) => r.notif_id)).toEqual(['n-b', 'n-c', 'n-a', 'n-d']);
  });
  it('keeps newer rounds first on tied to_par', () => {
    const tied = new Map(summaries);
    tied.set('s-a', summary({ whs_score_id: 's-a', to_par: 3 }));
    expect(openOrder(rows, tied).slice(0, 2).map((r) => r.notif_id)).toEqual(['n-a', 'n-b']);
  });
});

describe('AC2 folded row', () => {
  const rows = [round('a'), round('b'), round('c'), round('d')];
  const summaries = new Map<string, ActivityRoundSummary>([
    ['s-b', summary({ whs_score_id: 's-b', to_par: 3, gross: 75 })],
  ]);
  function mountFold(onOpen = vi.fn()) {
    return render(<MemoryRouter><ActivityFoldedRoundsRow rows={rows} summaries={summaries} onOpen={onOpen} /></MemoryRouter>);
  }
  it('renders the sentence, best line and see-all opener with at most three avatars and no score tile', () => {
    mountFold();
    const fold = screen.getByTestId('activity-fold-row');
    expect(fold).toHaveTextContent('4 golfers posted rounds');
    expect(screen.getByTestId('activity-fold-best')).toHaveTextContent('Best: Actor b, 75 at Sundridge Park · East');
    expect(fold).toHaveTextContent('See all 4 ›');
    expect(screen.getByTestId('activity-fold-stack').children).toHaveLength(3);
    expect(screen.queryByTestId('activity-score-tile')).toBeNull();
  });
  it('omits the best line when nothing qualifies', () => {
    render(<MemoryRouter><ActivityFoldedRoundsRow rows={rows} summaries={new Map()} onOpen={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByTestId('activity-fold-best')).toBeNull();
  });
  it('opens on click and on Enter', () => {
    const onOpen = vi.fn();
    mountFold(onOpen);
    fireEvent.click(screen.getByTestId('activity-fold-row'));
    fireEvent.keyDown(screen.getByTestId('activity-fold-row'), { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});

describe('AC2 crown and legend rows', () => {
  function crownRow(type: string, message: string): ActivityFeedRowV2 {
    return { ...round('crown'), notif_type: type, message, data: { course_name: 'Sundridge Park Golf Club (West)', course_id: 'c1' }, actor_user_id: null, actor_display_name: null };
  }
  it('shortens and bolds the course name in a crown sentence without changing the copy', () => {
    const { container } = render(<MemoryRouter><LedgerRow row={crownRow('crown_taken', 'Matt Grice took your crown at Sundridge Park Golf Club (West)')} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
    const body = container.querySelector('[style*="line-height: 1.35"]');
    expect(body).toHaveTextContent('Matt Grice took your crown at Sundridge Park · West');
    expect(body?.querySelector('span[style*="font-weight: 700"]')).toHaveTextContent('Sundridge Park · West');
  });
  it('shortens an appended legend course name too', () => {
    const { container } = render(<MemoryRouter><LedgerRow row={crownRow('legend_earned', 'You became a legend')} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('span[style*="font-weight: 700"]')).toHaveTextContent('Sundridge Park · West');
  });
  it('leaves non-crown course names full length', () => {
    const review: ActivityFeedRowV2 = { ...round('rev'), notif_type: 'friend_course_review', message: 'Actor rev reviewed a course', data: { course_name: 'Sundridge Park Golf Club (West)' } };
    const { container } = render(<MemoryRouter><LedgerRow row={review} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
    const bolds = [...container.querySelectorAll('span[style*="font-weight: 700"]')];
    expect(bolds.at(-1)).toHaveTextContent('Sundridge Park Golf Club (West)');
  });
});

describe('AC2 page folding', () => {
  const originalIO = window.IntersectionObserver;
  beforeEach(() => {
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
  afterEach(() => {
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = originalIO;
  });

  const rows = [round('a'), like, round('b'), round('c'), round('d', { data: { is_round: true, whs_score_id: 's-d' } })];
  const summaries = new Map<string, ActivityRoundSummary>([
    ['s-a', summary({ whs_score_id: 's-a', to_par: 12, gross: 84 })],
    ['s-b', summary({ whs_score_id: 's-b', to_par: 3, gross: 75 })],
    ['s-c', summary({ whs_score_id: 's-c', to_par: 8, gross: 80 })],
  ]);

  function feedFor(pageRows: ActivityFeedRowV2[]) {
    return { data: { pages: [pageRows] }, isLoading: false, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn(), refetch: vi.fn() };
  }
  function mountPage() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/notificationmessages']}>
          <ActivityPageV2 />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('folds three read rounds on All and keeps the unread round and like row unfolded', () => {
    h.feed = feedFor([round('u', { is_read: false }), ...rows]);
    h.summaries = summaries;
    const { container } = mountPage();
    expect(screen.getByTestId('activity-fold-row')).toHaveTextContent('4 golfers posted rounds');
    const sentences = [...container.querySelectorAll('.activity-round-sentence')].map((el) => el.textContent);
    expect(sentences).toEqual(['Actor u shared a round']);
    expect(screen.getByText(/liked your post/)).toBeTruthy();
  });

  it('opens in place in score order with the not-ready round last, changes the day label and never marks read', () => {
    h.feed = feedFor(rows);
    h.summaries = summaries;
    const { container } = mountPage();
    fireEvent.click(screen.getByTestId('activity-fold-row'));
    expect(screen.queryByTestId('activity-fold-row')).toBeNull();
    expect(screen.getByText('Today · 4 golfers posted rounds')).toBeTruthy();
    const sentences = [...container.querySelectorAll('.activity-round-sentence')].map((el) => el.textContent);
    expect(sentences).toEqual([
      'Actor b shot 75 at Sundridge Park · East',
      'Actor c shot 80 at Sundridge Park · East',
      'Actor a shot 84 at Sundridge Park · East',
      'Actor d shared a round',
    ]);
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy();
    expect(h.markRead).not.toHaveBeenCalled();
  });

  it('Show less folds the rows back', () => {
    h.feed = feedFor(rows);
    h.summaries = summaries;
    mountPage();
    fireEvent.click(screen.getByTestId('activity-fold-row'));
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByTestId('activity-fold-row')).toHaveTextContent('4 golfers posted rounds');
    expect(screen.queryByText('Today · 4 golfers posted rounds')).toBeNull();
  });

  it('keeps the fold open across a refetch of the same section', () => {
    h.feed = feedFor(rows);
    h.summaries = summaries;
    const { rerender } = mountPage();
    fireEvent.click(screen.getByTestId('activity-fold-row'));
    h.feed = feedFor([...rows]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/notificationmessages']}>
          <ActivityPageV2 />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId('activity-fold-row')).toBeNull();
    expect(screen.getByText('Today · 4 golfers posted rounds')).toBeTruthy();
  });

  it('folds on the Friends chip', () => {
    h.feed = feedFor(rows);
    h.summaries = summaries;
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: 'Friends' }));
    expect(screen.getByTestId('activity-fold-row')).toHaveTextContent('4 golfers posted rounds');
  });

  it('never folds on the Mentions chip', () => {
    h.feed = feedFor(rows);
    h.summaries = summaries;
    const { container } = mountPage();
    fireEvent.click(screen.getByRole('button', { name: 'Mentions' }));
    expect(screen.queryByTestId('activity-fold-row')).toBeNull();
    expect(container.querySelectorAll('.activity-round-sentence')).toHaveLength(4);
  });

  it('never folds the New chip', () => {
    h.feed = feedFor([round('u1', { is_read: false }), round('u2', { is_read: false }), round('u3', { is_read: false })]);
    h.summaries = summaries;
    mountPage();
    fireEvent.click(screen.getByRole('button', { name: /New/ }));
    expect(screen.queryByTestId('activity-fold-row')).toBeNull();
    expect(screen.getAllByText(/shared a round/)).toHaveLength(3);
  });
});
