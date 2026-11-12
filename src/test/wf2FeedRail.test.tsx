/**
 * WF2 — Who to follow rail in the Clubhouse feed (wf2-feed-rail.html).
 *
 * Covers the railRules ordering/slicing/placement, the rail card's reason and
 * figures lines, follow/Following/unfollow through useToggleFollow, dismissal
 * into suggestion_dismissals with restore-on-error, the rail closing when its
 * last card goes, See all → /find-people, CardFeed's renderBeforePost
 * plumbing (rails above posts 3 and 15 only, indices unchanged, other users
 * unaffected), and the Activity block's switch to get_people_suggestions with
 * a mute See all.
 *
 * The i18n mock returns defaultValue, so assertions target the English
 * default strings (structure, never translated words).
 */
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
  toggle: vi.fn(() => Promise.resolve({ next: true })),
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
import {
  businessCategoryLabel,
  railCardId,
  railCards,
  railBusinessReason,
  railGolferReason,
  railSlotCards,
  railSlotForPostIndex,
  type RailCard,
} from '@/features/find-people/railRules';
import type { BusinessSuggestion, PersonSuggestion } from '@/features/find-people/findPeopleRules';
import { SuggestedGolfersBlock } from '@/features/social-suggestions/SuggestedGolfersBlock';
import { CardFeed } from '@/components/feed/CardFeed';

/* ── fixtures ───────────────────────────────────────────────────────── */

function person(over: Partial<PersonSuggestion>): PersonSuggestion {
  return {
    user_id: 'u1', display_name: 'Niall Devins', username: 'niall', profile_photo_url: null,
    reason_type: 'club', reason_club_name: 'Sundridge Park', reason_course_name: null,
    reason_date: null, mutual_count: null, recent_rounds: null, rounds_total: 63,
    handicap_index: 4.1, is_verified: false, ...over,
  };
}
function biz(over: Partial<BusinessSuggestion>): BusinessSuggestion {
  return {
    business_id: 'b1', name: 'Sundridge Park GC', slug: 'sundridge-park', logo_url: null,
    category: 'Golf Club', city: 'Bromley', is_verified: true, followers: 1240,
    reason_type: 'your_club', distance_miles: null, ...over,
  };
}
const people = (n: number) =>
  Array.from({ length: n }, (_, i) => person({ user_id: `u${i + 1}`, display_name: `Golfer ${i + 1}` }));

const idOf = (c: RailCard) => railCardId(c);

function Probe() {
  const loc = useLocation();
  return <div data-testid="probe">{loc.pathname}</div>;
}

function renderRail(slot: 1 | 2) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/clubhouse']}>
        <Routes>
          <Route path="/clubhouse" element={<WhoToFollowRail slot={slot} />} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  h.user = { id: 'viewer' };
  h.people = [];
  h.biz = [];
  h.gateEligible = true;
  h.toggle.mockClear();
  h.track.mockClear();
  h.toastError.mockClear();
  h.dismissInsert.mockClear();
  h.dismissInsert.mockResolvedValue({ error: null });
  resetWhoToFollowRailSessionForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* ── railRules ──────────────────────────────────────────────────────── */

describe('railCards ordering', () => {
  it('puts the your_club business first, then golfers in server order with a business after every 3 golfers', () => {
    const cards = railCards(people(7), [
      biz({ business_id: 'b-own', reason_type: 'your_club' }),
      biz({ business_id: 'b-near', reason_type: 'near_club' }),
      biz({ business_id: 'b-coach', reason_type: 'coach' }),
      biz({ business_id: 'b-pop', reason_type: 'popular' }),
    ]);
    expect(cards.map(idOf)).toEqual([
      'b:b-own',
      'p:u1', 'p:u2', 'p:u3', 'b:b-near',
      'p:u4', 'p:u5', 'p:u6', 'b:b-coach',
      'p:u7',
    ]);
  });

  it('works with no your_club business and no businesses at all', () => {
    expect(railCards(people(4), []).map(idOf)).toEqual(['p:u1', 'p:u2', 'p:u3', 'p:u4']);
    expect(railCards(people(2), [biz({ business_id: 'b-near', reason_type: 'near_club' })]).map(idOf))
      .toEqual(['p:u1', 'p:u2']);
  });
});

describe('railSlotCards', () => {
  it('slot 1 takes cards 0–9 and slot 2 takes cards 10–19', () => {
    const cards = railCards(people(24), [biz({ business_id: 'b-own' })]);
    const s1 = railSlotCards(cards, 1, new Set());
    const s2 = railSlotCards(cards, 2, new Set());
    expect(s1).toHaveLength(10);
    expect(s1.map(idOf)).toEqual(cards.slice(0, 10).map(idOf));
    expect(s2).toHaveLength(10);
    expect(s2.map(idOf)).toEqual(cards.slice(10, 20).map(idOf));
  });

  it('renders nothing for a slot with fewer than 3 cards', () => {
    const cards = railCards(people(2), []);
    expect(railSlotCards(cards, 1, new Set())).toEqual([]);
    expect(railSlotCards(cards, 2, new Set())).toEqual([]);
    const eleven = railCards(people(11), []);
    expect(railSlotCards(eleven, 1, new Set())).toHaveLength(10);
    expect(railSlotCards(eleven, 2, new Set())).toEqual([]); // only 1 left over
  });

  it('filters dismissed cards before slicing so the rest close up', () => {
    const cards = railCards(people(12), []);
    const hidden = new Set([railCardId(cards[0])]);
    const s1 = railSlotCards(cards, 1, hidden);
    expect(s1).toHaveLength(10);
    expect(s1[0]).toEqual(cards[1]);
    expect(s1[9]).toEqual(cards[10]); // card 10 closed up into slot 1
  });
});

describe('railSlotForPostIndex', () => {
  it('places slot 1 above post 3 and slot 2 above post 15, nothing elsewhere', () => {
    expect(railSlotForPostIndex(3, 20)).toBe(1);
    expect(railSlotForPostIndex(15, 20)).toBe(2);
    expect(railSlotForPostIndex(0, 20)).toBeNull();
    expect(railSlotForPostIndex(2, 20)).toBeNull();
    expect(railSlotForPostIndex(4, 20)).toBeNull();
    expect(railSlotForPostIndex(14, 20)).toBeNull();
    expect(railSlotForPostIndex(16, 20)).toBeNull();
  });

  it('renders no rail in a feed with fewer than 4 posts', () => {
    expect(railSlotForPostIndex(3, 3)).toBeNull();
    expect(railSlotForPostIndex(3, 0)).toBeNull();
  });
});

describe('rail reasons and labels', () => {
  it('club golfer reads "Also a member at {club}"', () => {
    const r = railGolferReason(person({ reason_club_name: 'Sundridge Park' }));
    expect(r?.def).toBe('Also a member at {{club}}');
    expect(r?.vars).toEqual({ club: 'Sundridge Park' });
  });

  it('played_with reads "Played {shortCourseName} with you", falling back to "Played with you"', () => {
    const withCourse = railGolferReason(person({ reason_type: 'played_with', reason_course_name: 'Sundridge Park Golf Club (West)' }));
    expect(withCourse?.def).toBe('Played {{course}} with you');
    expect(withCourse?.vars).toEqual({ course: 'Sundridge Park · West' });
    const noCourse = railGolferReason(person({ reason_type: 'played_with', reason_course_name: null }));
    expect(noCourse?.def).toBe('Played with you');
  });

  it('every other golfer reason is the Find people line', () => {
    expect(railGolferReason(person({ reason_type: 'reciprocal' }))?.def).toBe('Follows you');
    expect(railGolferReason(person({ reason_type: 'popular' }))?.def).toBe('Popular on clbhouz');
  });

  it('your_club business reads "Your club"; other businesses use the Businesses-tab line', () => {
    expect(railBusinessReason(biz({}), 'Golf club')?.def).toBe('Your club');
    const coach = railBusinessReason(
      biz({ business_id: 'b-coach', reason_type: 'coach', category: 'Golf Academy', distance_miles: 3.42 }),
      businessCategoryLabel(biz({ reason_type: 'coach', category: 'Golf Academy', distance_miles: 3.42 })),
    );
    expect(coach?.def).toBe('{{category}} · {{miles}} miles');
    expect(coach?.vars).toEqual({ category: 'Golf academy', miles: '3.4' });
  });

  it('businessCategoryLabel matches the page: Golf Club → "Golf club", known words, unknown → ""', () => {
    expect(businessCategoryLabel(biz({ category: 'Golf Club' }))).toBe('Golf club');
    expect(businessCategoryLabel(biz({ category: 'Golf Academy' }))).toBe('Golf academy');
    expect(businessCategoryLabel(biz({ category: 'Something Else' }))).toBe('');
  });
});

/* ── the rail component ─────────────────────────────────────────────── */

describe('WhoToFollowRail', () => {
  it('renders the header, sub and cards; See all goes to /find-people', () => {
    h.people = people(4);
    h.biz = [biz({})];
    renderRail(1);
    expect(screen.getByText('Who to follow')).toBeTruthy();
    expect(screen.getByText('Golfers and clubs you might know')).toBeTruthy();
    expect(screen.getByText('Sundridge Park GC')).toBeTruthy();
    fireEvent.click(screen.getByText('See all'));
    expect(screen.getByTestId('probe').textContent).toBe('/find-people');
    expect(h.track).toHaveBeenCalledWith('who_to_follow_see_all', { slot: 1 });
  });

  it('cards row allows vertical feed scroll (touch-action includes pan-y)', () => {
    h.people = people(4);
    h.biz = [biz({})];
    renderRail(1);
    const row = screen.getByTestId('who-to-follow-rail-1').querySelector('.no-scrollbar') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.style.touchAction).toContain('pan-y');
    expect(row.style.touchAction).toContain('pan-x');
    expect(row.style.overscrollBehaviorX).toBe('contain');
  });

  it('renders nothing when the slot has fewer than 3 cards', () => {
    h.people = people(2);
    h.biz = [];
    const { container } = renderRail(1);
    expect(container.firstChild).toBeNull();
  });

  it('shows the rail reason lines and figures, with blank figures keeping their height', () => {
    h.people = [
      person({ user_id: 'u-club', display_name: 'Niall Devins' }),
      person({ user_id: 'u-played', display_name: 'Chris Leeson', reason_type: 'played_with', reason_course_name: 'Sundridge Park Golf Club (West)', handicap_index: 12.8, rounds_total: 41 }),
      person({ user_id: 'u-new', display_name: 'Rob Bennett', reason_type: 'recently_joined', handicap_index: null, rounds_total: 0 }),
    ];
    h.biz = [];
    renderRail(1);
    // The i18n mock returns the defaultValue uninterpolated; the pure-rules
    // tests above pin the interpolation vars.
    expect(screen.getByText('Also a member at {{club}}')).toBeTruthy();
    expect(screen.getByText('Played {{course}} with you')).toBeTruthy();
    expect(screen.getByText('New to clbhouz')).toBeTruthy();
    expect(screen.getByText('4.1 hcp · 63 rounds')).toBeTruthy();
    expect(screen.getByText('12.8 hcp · 41 rounds')).toBeTruthy();
    // Rob has no figures and no when line: the slot stays blank but keeps its 35px height.
    const robCard = screen.getByText('Rob Bennett').closest('[role="button"]') as HTMLElement;
    const slot = robCard.querySelector('[data-testid="rail-slot"]') as HTMLElement;
    expect(slot.style.height).toBe('35px');
    expect(slot.textContent).toBe('');
  });

  it('shows the verified badge and the business initials tile', () => {
    h.people = people(3);
    h.biz = [biz({ is_verified: true })];
    renderRail(1);
    const card = screen.getByText('Sundridge Park GC').closest('[role="button"]') as HTMLElement;
    expect(card.querySelector('[data-verified-badge], svg')).toBeTruthy();
    expect(screen.getByText('SP')).toBeTruthy(); // businessInitials on the white tile
    expect(screen.getByText('Your club')).toBeTruthy();
    expect(screen.getByText('1,240 followers')).toBeTruthy();
  });

  it('follows and unfollows a golfer through useToggleFollow, filling the pill ink', async () => {
    h.people = people(3);
    h.biz = [];
    renderRail(1);
    const card = screen.getByText('Golfer 1').closest('[role="button"]') as HTMLElement;
    const pill = Array.from(card.querySelectorAll('button')).find((b) => b.textContent === 'Follow')!;
    fireEvent.click(pill);
    await waitFor(() => expect(h.toggle).toHaveBeenCalledTimes(1));
    expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({
      targetActorType: 'personal',
      targetActorId: 'u1',
      targetUserId: 'u1',
      isFollowing: false,
    }));
    await waitFor(() => expect(pill.textContent).toBe('Following'));
    expect(pill.style.background).toBe('rgb(248, 250, 252)'); // A.INK fill
    expect(h.track).toHaveBeenCalledWith('who_to_follow_follow', { slot: 1, actor_type: 'personal', reason_type: 'club' });

    fireEvent.click(pill);
    await waitFor(() => expect(h.toggle).toHaveBeenCalledTimes(2));
    expect(h.toggle).toHaveBeenLastCalledWith(expect.objectContaining({ isFollowing: true }));
    await waitFor(() => expect(pill.textContent).toBe('Follow'));
  });

  it('follows a business through useToggleFollow with the business actor type', async () => {
    h.people = people(3);
    h.biz = [biz({})];
    renderRail(1);
    const card = screen.getByText('Sundridge Park GC').closest('[role="button"]') as HTMLElement;
    const pill = Array.from(card.querySelectorAll('button')).find((b) => b.textContent === 'Follow')!;
    fireEvent.click(pill);
    await waitFor(() => expect(h.toggle).toHaveBeenCalledTimes(1));
    expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({
      targetActorType: 'business',
      targetActorId: 'b1',
      targetUserId: undefined,
      isFollowing: false,
    }));
    await waitFor(() => expect(pill.textContent).toBe('Following'));
  });

  it('✕ writes the suggestion_dismissals row and removes the card after 200ms', () => {
    vi.useFakeTimers();
    h.people = people(4);
    h.biz = [];
    renderRail(1);
    fireEvent.click(screen.getByLabelText('Hide Golfer 1'));
    expect(h.dismissInsert).toHaveBeenCalledWith({ actor_type: 'personal', actor_id: 'u1' });
    expect(h.track).toHaveBeenCalledWith('who_to_follow_dismiss', { slot: 1, actor_type: 'personal', reason_type: 'club' });
    expect(screen.queryByText('Golfer 1')).toBeTruthy(); // still closing
    act(() => { vi.advanceTimersByTime(250); });
    expect(screen.queryByText('Golfer 1')).toBeNull();
    expect(screen.getByText('Golfer 2')).toBeTruthy();
  });

  it('ignores a duplicate-key error but restores the card with a toast on any other error', async () => {
    vi.useFakeTimers();
    h.people = people(4);
    h.biz = [];
    h.dismissInsert.mockResolvedValue({ error: { code: '23505', message: 'dup' } });
    renderRail(1);
    fireEvent.click(screen.getByLabelText('Hide Golfer 1'));
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(screen.queryByText('Golfer 1')).toBeNull();
    expect(h.toastError).not.toHaveBeenCalled();

    h.dismissInsert.mockResolvedValue({ error: { code: '42501', message: 'rls' } });
    fireEvent.click(screen.getByLabelText('Hide Golfer 2'));
    await act(async () => { vi.advanceTimersByTime(250); });
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('Golfer 2')).toBeTruthy(); // put back
    expect(h.toastError).toHaveBeenCalledWith("Couldn't hide that. Try again.");
  });

  it('closes the rail when every card in the slot is gone', () => {
    vi.useFakeTimers();
    h.people = people(6);
    h.biz = [];
    renderRail(1);
    // Dismissing four of six leaves two cards — below the 3-card minimum —
    // so the rail closes and unmounts.
    for (const name of ['Golfer 1', 'Golfer 2', 'Golfer 3', 'Golfer 4']) {
      fireEvent.click(screen.getByLabelText(`Hide ${name}`));
      act(() => { vi.advanceTimersByTime(250); });
    }
    act(() => { vi.advanceTimersByTime(250); });
    expect(screen.queryByTestId('who-to-follow-rail-1')).toBeNull();
  });

  it('fires who_to_follow_viewed once per slot at 50% visibility', () => {
    const original = window.IntersectionObserver;
    let cb: IntersectionObserverCallback | null = null;
    window.IntersectionObserver = class {
      constructor(c: IntersectionObserverCallback) { cb = c; }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    } as unknown as typeof IntersectionObserver;
    try {
      h.people = people(3);
      h.biz = [];
      renderRail(1);
      const el = screen.getByTestId('who-to-follow-rail-1');
      act(() => {
        cb?.([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
      });
      expect(h.track).toHaveBeenCalledWith('who_to_follow_viewed', { slot: 1 });
      act(() => {
        cb?.([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
      });
      expect(h.track.mock.calls.filter((c) => c[0] === 'who_to_follow_viewed')).toHaveLength(1);
    } finally {
      window.IntersectionObserver = original;
    }
  });
});

/* ── CardFeed placement ─────────────────────────────────────────────── */

const feedPost = (id: string) => ({
  id,
  createdAt: new Date().toISOString(),
  mediaItems: [],
}) as any;

function renderFeed(count: number, withProp: boolean) {
  const posts = Array.from({ length: count }, (_, i) => feedPost(`p${i}`));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const renderBeforePost = (postIndex: number) => {
    const slot = railSlotForPostIndex(postIndex, posts.length);
    return slot ? <div data-testid={`rail-slot-${slot}`} /> : null;
  };
  return render(
    <QueryClientProvider client={qc}>
      <CardFeed
        posts={posts}
        onLike={() => {}}
        onComment={() => {}}
        onShare={() => {}}
        onProfile={() => {}}
        getLikeState={() => null}
        getCommentCount={() => 0}
        {...(withProp ? { renderBeforePost } : {})}
      />
    </QueryClientProvider>,
  );
}

describe('CardFeed renderBeforePost', () => {
  it('renders the rail above posts 3 and 15 only, with post indices unchanged', () => {
    renderFeed(20, true);
    expect(screen.getByTestId('rail-slot-1')).toBeTruthy();
    expect(screen.getByTestId('rail-slot-2')).toBeTruthy();
    // The rail sits ABOVE the card at that index, inside the same item.
    const card3 = document.querySelector('[data-card-index="3"]') as HTMLElement;
    expect(card3.previousElementSibling?.getAttribute('data-testid')).toBe('rail-slot-1');
    const card15 = document.querySelector('[data-card-index="15"]') as HTMLElement;
    expect(card15.previousElementSibling?.getAttribute('data-testid')).toBe('rail-slot-2');
    // Indices are contiguous and unchanged.
    const indices = Array.from(document.querySelectorAll('[data-card-index]')).map((el) =>
      Number(el.getAttribute('data-card-index')),
    );
    expect(indices).toEqual(Array.from({ length: 20 }, (_, i) => i));
    // No rail markers anywhere else.
    expect(document.querySelectorAll('[data-testid^="rail-slot-"]')).toHaveLength(2);
  });

  it('renders no rail in a feed with fewer than 4 posts', () => {
    renderFeed(3, true);
    expect(document.querySelectorAll('[data-testid^="rail-slot-"]')).toHaveLength(0);
    expect(screen.getByTestId('feed-card-p0')).toBeTruthy();
  });

  it('other CardFeed users pass nothing and are unchanged', () => {
    renderFeed(20, false);
    expect(document.querySelectorAll('[data-testid^="rail-slot-"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-card-index]')).toHaveLength(20);
  });
});

/* ── Activity block (WF2 §9) ────────────────────────────────────────── */

describe('SuggestedGolfersBlock', () => {
  function renderBlock() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <SuggestedGolfersBlock />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('reads get_people_suggestions rows with golferReason and golferFigures', () => {
    h.people = [
      person({ user_id: 'u1', display_name: 'Niall Devins', reason_type: 'club', reason_club_name: 'Sundridge Park' }),
      person({ user_id: 'u2', display_name: 'No Hcp Ned', reason_type: 'reciprocal', handicap_index: null, rounds_total: 20 }),
      person({ user_id: 'u3', display_name: 'Popular Pam', reason_type: 'popular', handicap_index: -1.2, rounds_total: 212 }),
    ];
    renderBlock();
    // i18n mock returns the defaultValue uninterpolated.
    expect(screen.getByText('Member at {{club}}')).toBeTruthy();
    expect(screen.getByText('Follows you')).toBeTruthy();
    expect(screen.getByText('Popular on clbhouz')).toBeTruthy();
    expect(screen.getByText('4.1 hcp · 63 rounds')).toBeTruthy();
    // No handicap when the server sends null: rounds only, never "hcp".
    expect(screen.getByText('20 rounds')).toBeTruthy();
    const nedRow = screen.getByText('No Hcp Ned').closest('[role="button"]') as HTMLElement;
    expect(nedRow.textContent).not.toContain('hcp');
    expect(screen.getByText('+1.2 hcp · 212 rounds')).toBeTruthy();
  });

  it('no reason line is amber, including club and reciprocal', () => {
    h.people = [
      person({ user_id: 'u1', display_name: 'Niall Devins', reason_type: 'club', reason_club_name: 'Sundridge Park' }),
      person({ user_id: 'u2', display_name: 'Ned', reason_type: 'reciprocal' }),
    ];
    renderBlock();
    for (const el of [screen.getByText('Member at {{club}}'), screen.getByText('Follows you')]) {
      expect(el.style.color).not.toBe('rgb(247, 147, 30)');
      expect(el.style.color.toLowerCase()).not.toBe('#f7931e');
    }
  });

  it('See all is mute, not amber', () => {
    h.people = people(3);
    const { container } = renderBlock();
    // The header's See all is the first button in the section (its label
    // comes from the catalogue, which the i18n mock renders as '').
    const seeAll = container.querySelector('section button') as HTMLElement;
    expect(seeAll).toBeTruthy();
    expect(seeAll.style.color).toBe('rgba(248, 250, 252, 0.62)');
    expect(seeAll.style.color).not.toBe('#F7931E');
  });

  it('renders nothing when the gate is not eligible', () => {
    h.gateEligible = false;
    h.people = people(3);
    const { container } = renderBlock();
    expect(container.firstChild).toBeNull();
  });
});


describe('Who to follow canonical avatar fallbacks', () => {
  it('MasterGolf Travel without a logo uses dark SquircleAvatar initials MT, not a white tile', () => {
    h.people = people(3);
    h.biz = [biz({ name: 'MasterGolf Travel', logo_url: null })];
    renderRail(1);
    const initials = screen.getByText('MT');
    expect(initials.matches('[data-avatar-fallback]')).toBeTruthy();
    const card = screen.getByText('MasterGolf Travel').closest('[role="button"]');
    const whiteTiles = Array.from(card?.querySelectorAll('div') ?? []).filter(el => el.style.background === 'rgb(248, 250, 252)');
    expect(whiteTiles).toHaveLength(0);
  });

  it('a person without a photo uses two initials SC', () => {
    h.people = [person({ display_name: 'Sarah Collins', profile_photo_url: null }), ...people(3).slice(1)];
    h.biz = [];
    renderRail(1);
    expect(screen.getByText('SC').matches('[data-avatar-fallback]')).toBeTruthy();
  });
});
