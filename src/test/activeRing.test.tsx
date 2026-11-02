/**
 * ACTIVE RING — when-line rules, ring component, rail card, Find people rows
 * and the batched useRecentActivity read (active-ring-signed-off.html).
 * The i18n mock returns defaultValue, so assertions target structure and the
 * English defaults, never translated words.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  people: [] as unknown[],
  biz: [] as unknown[],
  rows: [] as unknown[],
  rpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: h.rpc,
    from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve({ error: null })) })),
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({
  usePeopleSuggestions: () => ({ data: h.people, isLoading: false, isError: false }),
  useBusinessSuggestions: () => ({ data: h.biz, isLoading: false, isError: false }),
}));
vi.mock('@/features/search-v2/hooks/useGlobalSearchV2', () => ({
  useGlobalSearchV2: () => ({
    data: { people: [], clubs: [], courses: [], players: [], videos: [], posts: [] },
    isLoading: false, error: null, debouncedQuery: '', refetch: () => {},
  }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { activityLine, type RecentActivity } from '@/features/find-people/activeRingRules';
import { ActiveRing, ACTIVE_RING_GRADIENT } from '@/features/find-people/ActiveRing';
import { useRecentActivity } from '@/features/find-people/useRecentActivity';
import { WhoToFollowRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import FindPeoplePage from '@/pages/FindPeoplePage';
import { InviteSheetContext } from '@/components/invite/InviteSheetProvider';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import type { PersonSuggestion } from '@/features/find-people/findPeopleRules';

const NOW = new Date('2026-11-02T12:00:00Z');
const act = (over: Partial<RecentActivity>): RecentActivity => ({
  actor_id: 'u1', kind: 'post', post_id: 'p1', created_at: NOW.toISOString(), course_name: null, ...over,
});
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

function person(over: Partial<PersonSuggestion>): PersonSuggestion {
  return {
    user_id: 'u1', display_name: 'Niall Devins', username: 'niall', profile_photo_url: null,
    reason_type: 'popular', reason_club_name: null, reason_course_name: null,
    reason_date: null, mutual_count: null, recent_rounds: null, rounds_total: 63,
    handicap_index: 4.1, is_verified: false, ...over,
  };
}

function Probe() {
  const loc = useLocation();
  return <div data-testid="probe">{loc.pathname}</div>;
}
function wrap(ui: React.ReactNode, initial = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InviteSheetContext.Provider value={{ openInviteSheet: () => {}, closeInviteSheet: () => {} }}>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path={initial} element={ui} />
            <Route path="*" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </InviteSheetContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  h.user = { id: 'viewer' };
  h.people = [
    person({ user_id: 'u-ring', display_name: 'Danny Holmes', username: 'danny' }),
    person({ user_id: 'u-plain', display_name: 'David Lang', username: 'david' }),
    person({ user_id: 'u-third', display_name: 'Simon Savage', username: 'simon' }),
  ];
  h.biz = [];
  h.rows = [{ actor_id: 'u-ring', kind: 'round', post_id: 'post-9', created_at: NOW.toISOString(), course_name: 'Sundridge Park Golf Club (East)' }];
  h.rpc.mockReset();
  h.rpc.mockImplementation(() => Promise.resolve({ data: h.rows, error: null }));
  resetWhoToFollowRailSessionForTests();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('activityLine', () => {
  it('round with a course reads Played {course}, shortened', () => {
    const c = 'Sundridge Park Golf Club (East)';
    expect(activityLine(act({ kind: 'round', course_name: c }), NOW).def).toBe(`Played ${shortCourseName(c)}`);
    expect(shortCourseName(c)).not.toBe(c);
  });
  it('round without a course', () => {
    expect(activityLine(act({ kind: 'round' }), NOW).def).toBe('Played a round');
  });
  it('review with a course', () => {
    expect(activityLine(act({ kind: 'review', course_name: 'Walton Heath' }), NOW).def).toBe('Reviewed Walton Heath');
  });
  it('review without a course', () => {
    expect(activityLine(act({ kind: 'review' }), NOW).def).toBe('Posted a review');
  });
  it('post ago boundaries', () => {
    const line = (ms: number) => activityLine(act({ created_at: ago(ms) }), NOW).def;
    expect(line(59_000)).toBe('Posted just now');
    expect(line(60_000)).toBe('Posted 1m ago');
    expect(line(59 * 60_000)).toBe('Posted 59m ago');
    expect(line(60 * 60_000)).toBe('Posted 1h ago');
    expect(line((23 * 60 + 59) * 60_000)).toBe('Posted 23h ago');
  });
});

describe('ActiveRing', () => {
  it('active renders the gradient and the surface-coloured gap', () => {
    const { container } = render(<ActiveRing active surface="card"><i /></ActiveRing>);
    const outer = container.querySelector('[data-active-ring="on"]') as HTMLElement;
    expect(outer.style.padding).toBe('1.5px');
    // jsdom drops gradients from style, so read the server markup instead.
    const html = renderToStaticMarkup(<ActiveRing active surface="card"><i /></ActiveRing>);
    expect(html).toContain(`background:${ACTIVE_RING_GRADIENT}`);
    const gap = container.querySelector('[data-active-ring-gap]') as HTMLElement;
    expect(gap.style.padding).toBe('2px');
    expect(gap.style.background).toBe('rgb(23, 23, 27)');
  });
  it('inactive renders 3.5px padding and no gradient', () => {
    const { container } = render(<ActiveRing active={false} surface="canvas"><i /></ActiveRing>);
    const outer = container.querySelector('[data-active-ring="off"]') as HTMLElement;
    expect(outer.style.padding).toBe('3.5px');
    expect(renderToStaticMarkup(<ActiveRing active={false} surface="canvas"><i /></ActiveRing>)).not.toContain('gradient');
    expect(container.querySelector('[data-active-ring-gap]')).toBeNull();
  });
});

describe('WhoToFollowRail', () => {
  const cardOf = (name: string) => screen.getByText(name).closest('[role="button"]') as HTMLElement;

  it('a ringed card shows the when line and its avatar opens the post, not the profile', async () => {
    wrap(<WhoToFollowRail slot={1} />);
    const btn = await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
    const when = cardOf('Danny Holmes').querySelector('[data-testid="rail-when"]') as HTMLElement;
    expect(when.textContent).toMatch(/^Played /);
    fireEvent.click(btn);
    expect(screen.getByTestId('probe').textContent).toBe('/post/post-9');
  });
  it('an unringed card has an empty when line of the same height and no avatar button; cards are 252 tall', async () => {
    wrap(<WhoToFollowRail slot={1} />);
    await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
    const card = cardOf('David Lang');
    const when = card.querySelector('[data-testid="rail-when"]') as HTMLElement;
    expect(when.textContent).toBe('');
    expect(when.style.height).toBe('15px');
    expect(screen.queryByRole('button', { name: "Open David Lang's latest post" })).toBeNull();
    expect(card.style.height).toBe('252px');
    expect(cardOf('Danny Holmes').style.height).toBe('252px');
  });
});

describe('FindPeoplePage rows', () => {
  const rowOf = (name: string) => screen.getByText(name).closest('[role="button"]') as HTMLElement;

  it('the row is a role="button" div, not a <button>', () => {
    wrap(<FindPeoplePage />, '/find-people');
    const row = rowOf('David Lang');
    expect(row.tagName).toBe('DIV');
    expect(row.getAttribute('tabindex')).toBe('0');
  });
  it('a ringed row shows "{when} · {reason}"', async () => {
    wrap(<FindPeoplePage />, '/find-people');
    await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
    const line = rowOf('Danny Holmes').querySelector('[data-testid="row-reason"]') as HTMLElement;
    const whenSpan = line.querySelector('span') as HTMLElement;
    expect(whenSpan.textContent).toMatch(/^Played /);
    expect(whenSpan.style.fontWeight).toBe('600');
    expect(line.textContent!.startsWith(`${whenSpan.textContent} · `)).toBe(true);
  });
  it('tapping the ringed avatar navigates to the post and not the profile', async () => {
    wrap(<FindPeoplePage />, '/find-people');
    fireEvent.click(await screen.findByRole('button', { name: "Open Danny Holmes's latest post" }));
    expect(screen.getByTestId('probe').textContent).toBe('/post/post-9');
  });
  it('keyboard Enter on the row opens the profile', () => {
    wrap(<FindPeoplePage />, '/find-people');
    fireEvent.keyDown(rowOf('David Lang'), { key: 'Enter' });
    const path = screen.getByTestId('probe').textContent!;
    expect(path).not.toBe('/find-people');
    expect(path.startsWith('/post/')).toBe(false);
  });
});

describe('useRecentActivity', () => {
  const qcWrap = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
  );
  it('makes one rpc call for many ids', async () => {
    const ids = Array.from({ length: 30 }, (_, i) => `id-${i}`);
    const { result } = renderHook(() => useRecentActivity(ids), { wrapper: qcWrap });
    await waitFor(() => expect(result.current.size).toBe(1));
    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith('get_recent_activity', { p_actor_ids: ids });
  });
  it('is disabled with no ids', async () => {
    renderHook(() => useRecentActivity([]), { wrapper: qcWrap });
    await new Promise((r) => setTimeout(r, 20));
    expect(h.rpc).not.toHaveBeenCalled();
  });
});
