import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  people: [] as unknown[],
  biz: [] as unknown[],
  gateEligible: true,
  toggle: vi.fn((_p?: unknown) => Promise.resolve({ next: true })),
  track: vi.fn(),
  toastError: vi.fn(),
  dismissInsert: vi.fn(() => Promise.resolve({ error: null as null | { code?: string; message?: string } })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn((table: string) => {
      if (table === 'suggestion_dismissals') return { insert: h.dismissInsert };
      return { insert: vi.fn(), select: vi.fn() };
    }),
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: h.toggle, isPending: false }) }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({
  usePeopleSuggestions: () => ({ data: h.people, isLoading: false, isError: false }),
  useBusinessSuggestions: () => ({ data: h.biz, isLoading: false, isError: false }),
}));
vi.mock('@/features/social-suggestions/useSuggestedGolfers', () => ({
  useSuggestionGate: () => ({ ready: true, eligible: h.gateEligible, followCount: 0 }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toastError, success: vi.fn() } }));

// CardFeed plumbing tests: Virtuoso renders every item; FeedCard is a stub.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, computeItemKey }: any) => (
    <div>{(data ?? []).map((d: any, i: number) => <div key={computeItemKey(i, d)}>{itemContent(i, d)}</div>)}</div>
  ),
}));
vi.mock('@/components/feed/FeedCard', () => ({
  FeedCard: ({ post }: any) => <div data-testid={`feed-card-${post.id}`} />,
}));
vi.mock('@/hooks/feed/useFeedCommentPreview', () => ({ useFeedCommentPreview: () => ({ map: new Map() }) }));
vi.mock('@/hooks/feed/usePostGolfTags', () => ({ usePostGolfTags: () => ({ withByPost: new Map(), slideTags: new Map() }) }));

import { WhoToFollowRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import { patchFollow, followedThisSession } from '@/lib/followCache';
import type { BusinessSuggestion, PersonSuggestion } from '@/features/find-people/findPeopleRules';

function person(i: number): PersonSuggestion {
  return { user_id: `u${i}`, display_name: `Golfer ${i}`, username: `g${i}`, profile_photo_url: null,
    reason_type: 'club', reason_club_name: 'Sundridge Park', reason_course_name: null, reason_date: null,
    mutual_count: null, recent_rounds: null, rounds_total: 1, handicap_index: 4.1, is_verified: false } as PersonSuggestion;
}
function biz(i: number): BusinessSuggestion {
  return { business_id: `b${i}`, name: `Club ${i}`, slug: `c${i}`, logo_url: null, category: 'Golf Club', city: 'Bromley',
    is_verified: false, followers: 1, reason_type: 'nearby', distance_miles: null } as BusinessSuggestion;
}
let qc: QueryClient;
function renderRail() {
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/clubhouse']}><Routes>
    <Route path="/clubhouse" element={<WhoToFollowRail slot={1} />} /></Routes></MemoryRouter></QueryClientProvider>);
}
const followElsewhere = (type: 'personal' | 'business', id: string, isFollowing = true) =>
  act(() => { patchFollow(qc, { targetActorType: type, targetActorId: id, targetUserId: type === 'personal' ? id : undefined } as never, { isFollowing }); });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  h.user = { id: 'viewer' };
  h.people = [1, 2, 3, 4].map(person);
  h.biz = [];
  h.toggle.mockReset();
  // Like the real useToggleFollow: patchFollow runs in onMutate, before the server answers.
  h.toggle.mockImplementation((p: any) => { patchFollow(qc, p, { isFollowing: !p.isFollowing }); return Promise.resolve({ next: !p.isFollowing }); });
  resetWhoToFollowRailSessionForTests();
  followedThisSession.clearForTests();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Brief 20 C — Who to follow drops anyone followed anywhere', () => {
  it('a follow outside the rail removes the card from a mounted rail and from a rail mounted later', () => {
    renderRail();
    expect(screen.queryByText('Golfer 2')).not.toBeNull();
    followElsewhere('personal', 'u2');
    expect(screen.queryByText('Golfer 2')).toBeNull();
    cleanup();
    renderRail();
    expect(screen.queryByText('Golfer 2')).toBeNull();
    // Never comes back this session, even after an unfollow elsewhere.
    followElsewhere('personal', 'u2', false);
    expect(screen.queryByText('Golfer 2')).toBeNull();
  });

  it('an in-rail follow still dwells three seconds and can be cancelled', async () => {
    renderRail();
    const card = screen.getByText('Golfer 1').closest('[role="button"]') as HTMLElement;
    const pill = () => Array.from(card.querySelectorAll('button')).find((b) => /Follow/.test(b.textContent ?? ''))!;
    fireEvent.click(pill());
    await waitFor(() => expect(pill().textContent).toBe('Following'));
    expect(screen.queryByText('Golfer 1')).not.toBeNull();
    fireEvent.click(pill());
    await waitFor(() => expect(pill().textContent).toBe('Follow'));
    vi.useFakeTimers();
    act(() => { vi.advanceTimersByTime(3500); });
    expect(screen.queryByText('Golfer 1')).not.toBeNull();
  });

  it('an in-rail follow leaves after the three-second window', async () => {
    renderRail();
    const card = screen.getByText('Golfer 1').closest('[role="button"]') as HTMLElement;
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.click(Array.from(card.querySelectorAll('button')).find((b) => b.textContent === 'Follow')!);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(2900); });
    expect(screen.queryByText('Golfer 1')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.queryByText('Golfer 1')).toBeNull();
  });

  it('business suggestions behave the same', () => {
    h.people = [1, 2, 3].map(person);
    h.biz = [biz(1)];
    renderRail();
    expect(screen.queryByText('Club 1')).not.toBeNull();
    followElsewhere('business', 'b1');
    expect(screen.queryByText('Club 1')).toBeNull();
  });
});
