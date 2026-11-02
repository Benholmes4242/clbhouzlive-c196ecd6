/**
 * WF1 — Find people page (/find-people).
 *
 * Covers the /golferstofollow redirect (query kept), each tab's grouping and
 * order, hidden empty groups, the tab empty state, every golfer and business
 * reason line, figures with and without a handicap, verified badges,
 * follow/Following/unfollow through the existing useToggleFollow mutation,
 * Follow all, the search swap, and the invite footer.
 *
 * The i18n mock returns defaultValue, so assertions target the English
 * default strings (structure, never translated words).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  people: [] as unknown[],
  biz: [] as unknown[],
  peopleLoading: false,
  bizLoading: false,
  toggle: vi.fn(() => Promise.resolve({ next: true })),
  invite: vi.fn(),
  hideNav: vi.fn(),
  searchPeople: [] as unknown[],
  searchClubs: [] as unknown[],
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: h.toggle, isPending: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => h.hideNav() }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({
  usePeopleSuggestions: () => ({ data: h.people, isLoading: h.peopleLoading, isError: false }),
  useBusinessSuggestions: () => ({ data: h.biz, isLoading: h.bizLoading, isError: false }),
}));
vi.mock('@/features/search-v2/hooks/useGlobalSearchV2', () => ({
  useGlobalSearchV2: (opts: { scope: string }) => ({
    data: {
      people: opts.scope === 'people' ? h.searchPeople : [],
      clubs: opts.scope === 'clubs' ? h.searchClubs : [],
      courses: [], players: [], videos: [], posts: [],
    },
    isLoading: false,
    error: null,
    debouncedQuery: '',
    refetch: () => {},
  }),
}));

import FindPeoplePage, { GolfersToFollowRedirect } from '@/pages/FindPeoplePage';
import { InviteSheetContext } from '@/components/invite/InviteSheetProvider';
import {
  businessGroups,
  businessInitials,
  businessReason,
  clubNameFrom,
  formatMiles,
  golferFigures,
  golferGroups,
  golferReason,
  shortDayMonth,
  suggestedGroups,
  type BusinessSuggestion,
  type PersonSuggestion,
} from '@/features/find-people/findPeopleRules';

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

const FULL_PEOPLE: PersonSuggestion[] = [
  person({ user_id: 'u-club', display_name: 'Niall Devins', reason_type: 'club' }),
  person({ user_id: 'u-played', display_name: 'Chris Leeson', reason_type: 'played_with', reason_course_name: 'Sundridge Park Golf Club (West)', reason_date: '2026-10-11', handicap_index: 12.8, rounds_total: 41 }),
  person({ user_id: 'u-recip', display_name: 'Recip Rory', reason_type: 'reciprocal', handicap_index: null, rounds_total: 12 }),
  person({ user_id: 'u-course', display_name: 'James Spencer', reason_type: 'course', reason_course_name: 'West Kent Golf Club', handicap_index: 15.2, rounds_total: 37 }),
  person({ user_id: 'u-cm', display_name: 'Clubmate Meg', reason_type: 'clubmate_mutual', mutual_count: 4, handicap_index: 22.4, rounds_total: 9 }),
  person({ user_id: 'u-mut', display_name: 'Mutual Mo', reason_type: 'mutual', mutual_count: 7, handicap_index: null, rounds_total: 5 }),
  person({ user_id: 'u-pop', display_name: 'Danny Holmes', reason_type: 'popular', handicap_index: -1.2, rounds_total: 212, is_verified: true }),
  person({ user_id: 'u-act', display_name: 'Active Ann', reason_type: 'active', recent_rounds: 6, handicap_index: 18.0, rounds_total: 30 }),
  person({ user_id: 'u-new', display_name: 'New Ned', reason_type: 'recently_joined', handicap_index: null, rounds_total: 0 }),
];
const FULL_BIZ: BusinessSuggestion[] = [
  biz({}),
  biz({ business_id: 'b-near', name: 'West Kent GC', slug: 'west-kent', reason_type: 'near_club', distance_miles: 6, followers: 310, is_verified: false }),
  biz({ business_id: 'b-coach', name: 'JK Golf Academy', slug: 'jk', reason_type: 'coach', category: 'Golf Academy', distance_miles: 3.42, followers: 42 }),
  biz({ business_id: 'b-pop', name: 'Golf Monthly', slug: 'gm', reason_type: 'popular', category: 'Media', city: null, followers: 3900 }),
];

/* ── render helper ──────────────────────────────────────────────────── */

function renderPage(initial = '/find-people') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InviteSheetContext.Provider value={{ openInviteSheet: h.invite, closeInviteSheet: () => {} }}>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path="/find-people" element={<FindPeoplePage />} />
            <Route path="/golferstofollow" element={<GolfersToFollowRedirect />} />
            <Route path="*" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </InviteSheetContext.Provider>
    </QueryClientProvider>,
  );
}
function Probe() {
  const loc = useLocation();
  return <div data-testid="probe">{loc.pathname + loc.search}</div>;
}

beforeEach(() => {
  h.user = { id: 'viewer' };
  h.people = FULL_PEOPLE;
  h.biz = FULL_BIZ;
  h.peopleLoading = false;
  h.bizLoading = false;
  h.searchPeople = [];
  h.searchClubs = [];
});
afterEach(() => {
  cleanup();
  h.toggle.mockClear();
  h.invite.mockClear();
});

/* ── pure rules ─────────────────────────────────────────────────────── */

describe('WF1 pure rules', () => {
  it('formats miles with one decimal under 10 and whole numbers above', () => {
    expect(formatMiles(6)).toBe('6.0');
    expect(formatMiles(3.42)).toBe('3.4');
    expect(formatMiles(17)).toBe('17');
    expect(formatMiles(10.2)).toBe('10');
    expect(formatMiles(null)).toBe('');
  });

  it('formats a played-with date as d MMM', () => {
    expect(shortDayMonth('2026-10-11')).toBe('11 Oct');
    expect(shortDayMonth(null)).toBe('');
    expect(shortDayMonth('not-a-date')).toBe('');
  });

  it('builds golfer figures with and without a handicap, dropping zero rounds', () => {
    expect(golferFigures(person({ handicap_index: 4.1, rounds_total: 63 }))).toBe('4.1 hcp · 63 rounds');
    expect(golferFigures(person({ handicap_index: null, rounds_total: 20 }))).toBe('20 rounds');
    expect(golferFigures(person({ handicap_index: 9.6, rounds_total: 0 }))).toBe('9.6 hcp');
    expect(golferFigures(person({ handicap_index: -1.2, rounds_total: 212 }))).toBe('+1.2 hcp · 212 rounds');
    expect(golferFigures(person({ handicap_index: null, rounds_total: 0 }))).toBe('');
  });

  it('derives the club name from the your_club business first, then club golfers', () => {
    expect(clubNameFrom(FULL_PEOPLE, FULL_BIZ)).toBe('Sundridge Park GC');
    expect(clubNameFrom(FULL_PEOPLE, [])).toBe('Sundridge Park');
    expect(clubNameFrom([person({ reason_type: 'popular' })], [])).toBeNull();
  });

  it('gives every golfer reason line', () => {
    expect(golferReason(person({ reason_type: 'club' }))?.def).toBe('Member at {{club}}');
    expect(golferReason(person({ reason_type: 'played_with', reason_course_name: 'Sundridge Park Golf Club (West)', reason_date: '2026-10-11' }))?.def).toBe('{{course}}, {{date}}');
    expect(golferReason(person({ reason_type: 'played_with', reason_course_name: null, reason_date: null }))?.def).toBe('Played with you');
    expect(golferReason(person({ reason_type: 'reciprocal' }))?.def).toBe('Follows you');
    expect(golferReason(person({ reason_type: 'course' }))?.def).toBe('Plays {{course}}');
    expect(golferReason(person({ reason_type: 'clubmate_mutual' }))?.def).toBe('Followed by {{count}} from {{club}}');
    expect(golferReason(person({ reason_type: 'mutual' }))?.def).toBe('Followed by {{count}} you follow');
    expect(golferReason(person({ reason_type: 'popular' }))?.def).toBe('Popular on clbhouz');
    expect(golferReason(person({ reason_type: 'active' }))?.def).toBe('{{count}} rounds in the last two weeks');
    expect(golferReason(person({ reason_type: 'recently_joined' }))?.def).toBe('New to clbhouz');
    expect(golferReason(person({ reason_type: 'mystery' }))).toBeNull();
  });

  it('gives every business reason line, with the your_club line differing by tab', () => {
    const own = biz({});
    expect(businessReason(own, 'suggested', 'Golf club')?.def).toBe('Your club · {{category}}');
    expect(businessReason(own, 'businesses', 'Golf club')?.def).toBe('{{category}} · {{city}}');
    expect(businessReason(biz({ city: null }), 'businesses', 'Golf club')?.def).toBe('{{category}}');
    expect(businessReason(biz({ reason_type: 'near_club', distance_miles: 6 }), 'businesses', 'Golf club')?.def).toBe('{{category}} · {{miles}} miles');
    expect(businessReason(biz({ reason_type: 'coach', distance_miles: null }), 'businesses', 'Coach')?.def).toBe('{{category}}');
    expect(businessReason(biz({ reason_type: 'popular' }), 'businesses', 'Media')?.def).toBe('{{category}} · {{city}}');
    expect(businessReason(biz({ reason_type: 'popular', city: null }), 'businesses', 'Media')?.def).toBe('{{category}}');
  });

  it('orders the Suggested groups as the best of everything, capped at 5 with See all', () => {
    const manyPopular = [1, 2, 3, 4, 5].map((i) => biz({ business_id: `bp${i}`, reason_type: 'popular' }));
    const groups = suggestedGroups(FULL_PEOPLE, [...FULL_BIZ, ...manyPopular]);
    expect(groups.map((g) => g.id)).toEqual([
      'from-club', 'played-with', 'follows-you', 'plays-courses', 'known', 'popular', 'active', 'new',
    ]);
    const fromClub = groups[0];
    expect(fromClub.followAll).toBe(true);
    expect(fromClub.businesses[0]?.reason_type).toBe('your_club');
    expect(fromClub.people.every((p) => p.reason_type === 'club')).toBe(true);
    /* Popular: golfers first, then up to 3 businesses, five rows in all. */
    const popular = groups.find((g) => g.id === 'popular')!;
    expect(popular.businesses).toHaveLength(3);
    expect(popular.people.length + popular.businesses.length).toBeLessThanOrEqual(5);
    /* Every non-club group carries a See all {total} link to the Golfers tab. */
    const playedWith = groups.find((g) => g.id === 'played-with')!;
    expect(playedWith.seeAll).toEqual({ tab: 'golfers', total: 1 });
  });

  it('caps a Suggested group at five rows and never repeats a person', () => {
    const seven = [1, 2, 3, 4, 5, 6, 7].map((i) =>
      person({ user_id: `pw${i}`, reason_type: 'played_with', reason_club_name: null }),
    );
    const dup = person({ user_id: 'u-dup', display_name: 'Dup Dan', reason_type: 'popular' });
    const dupClub = person({ user_id: 'u-dup', display_name: 'Dup Dan', reason_type: 'club' });
    const groups = suggestedGroups([...seven, dupClub, dup], []);
    const playedWith = groups.find((g) => g.id === 'played-with')!;
    expect(playedWith.people).toHaveLength(5);
    expect(playedWith.seeAll).toEqual({ tab: 'golfers', total: 7 });
    /* u-dup appears in From {club} first, never again in Popular. */
    const all = groups.flatMap((g) => g.people.map((p) => p.user_id));
    expect(all.filter((id) => id === 'u-dup')).toHaveLength(1);
    expect(groups.find((g) => g.id === 'from-club')!.people.some((p) => p.user_id === 'u-dup')).toBe(true);
  });

  it('orders the Golfers groups by reason and hides empty ones', () => {
    const groups = golferGroups(FULL_PEOPLE, FULL_BIZ);
    expect(groups.map((g) => g.id)).toEqual([
      'from-club', 'played-with', 'follows-you', 'plays-courses', 'known', 'popular', 'active', 'new',
    ]);
    const known = groups.find((g) => g.id === 'known')!;
    expect(known.people.map((p) => p.reason_type)).toEqual(['clubmate_mutual', 'mutual']);
    const sparse = golferGroups([person({ reason_type: 'popular' })], []);
    expect(sparse.map((g) => g.id)).toEqual(['popular']);
  });

  it('orders the Businesses groups and drops club groups without a home club', () => {
    const groups = businessGroups(FULL_PEOPLE, FULL_BIZ);
    expect(groups.map((g) => g.id)).toEqual(['your-club', 'near-club', 'coaches', 'popular']);
    const noClub = businessGroups([person({ reason_type: 'popular' })], [biz({ reason_type: 'popular' })]);
    expect(noClub.map((g) => g.id)).toEqual(['popular']);
  });

  it('builds two-letter business initials', () => {
    expect(businessInitials('Sundridge Park GC')).toBe('SP');
    expect(businessInitials('Titleist')).toBe('TI');
    expect(businessInitials('')).toBe('?');
  });
});

/* ── page ───────────────────────────────────────────────────────────── */

describe('WF1 Find people page', () => {
  it('redirects /golferstofollow to /find-people keeping the query string', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/golferstofollow?tab=golfers']}>
          <Routes>
            <Route path="/golferstofollow" element={<GolfersToFollowRedirect />} />
            <Route path="/find-people" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('/find-people?tab=golfers'));
  });

  it('renders the header, search field and three chips with ?tab= kept', () => {
    renderPage('/find-people?tab=businesses');
    /* FIX §4 — the page is now "Explore the community". */
    expect(screen.getByText('Explore the community')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search golfers and businesses')).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Suggested', 'Golfers', 'Businesses']);
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tabs[1]);
    expect(screen.getByRole('tab', { name: 'Golfers' }).getAttribute('aria-selected')).toBe('true');
  });

  it('groups the Suggested tab as the best of everything with Follow all on the club group', () => {
    renderPage();
    const labels = screen.getAllByTestId('group-label').map((el) => el.textContent);
    /* FIX §5 — every group with rows, in the brief's order. */
    expect(labels).toEqual([
      'From {{club}}', 'Played with you', 'Follows you', 'Plays your courses',
      'Followed by people you know', 'Popular on clbhouz', 'Playing lately', 'New to clbhouz',
    ]);
    expect(screen.getByText('Follow all 2')).toBeTruthy();
    // The your_club business leads the From-club group, before club golfers.
    expect(screen.getByText('Your club · {{category}}')).toBeTruthy();
    expect(screen.getByText('Member at {{club}}')).toBeTruthy();
  });

  it('See all on a capped Suggested group switches to the Golfers tab', () => {
    renderPage();
    const seeAlls = screen.getAllByText(/^See all /);
    expect(seeAlls.length).toBeGreaterThan(0);
    fireEvent.click(seeAlls[0]);
    expect(screen.getByRole('tab', { name: 'Golfers' }).getAttribute('aria-selected')).toBe('true');
  });

  it('hides the bottom nav while the page is open', () => {
    renderPage();
    expect(h.hideNav).toHaveBeenCalled();
  });

  it('shows the joining line under a thin Businesses tab, never an empty page', () => {
    h.biz = [biz({})];
    renderPage('/find-people?tab=businesses');
    expect(screen.getByText('More clubs and businesses are joining clbhouz.')).toBeTruthy();
    cleanup();
    h.biz = FULL_BIZ;
    renderPage('/find-people?tab=businesses');
    expect(screen.queryByText('More clubs and businesses are joining clbhouz.')).toBeNull();
  });

  it('groups the Golfers tab in the brief order', () => {
    renderPage('/find-people?tab=golfers');
    const order = [
      'From {{club}}', 'Played with you', 'Follows you', 'Plays your courses',
      'Followed by people you know', 'Popular on clbhouz', 'Playing lately', 'New to clbhouz',
    ];
    expect(screen.getAllByTestId('group-label').map((el) => el.textContent)).toEqual(order);
  });

  it('groups the Businesses tab and shows per-tab reason lines', () => {
    renderPage('/find-people?tab=businesses');
    expect(screen.getAllByTestId('group-label').map((el) => el.textContent)).toEqual(
      ['Your club', 'Near {{club}}', 'Coaches and academies', 'Popular on clbhouz'],
    );
    // your_club on Businesses reads "{category} · {city}", not "Your club · …".
    expect(screen.getByText('{{category}} · {{city}}')).toBeTruthy();
    expect(screen.queryByText('Your club · {{category}}')).toBeNull();
    expect(screen.getAllByText('{{category}} · {{miles}} miles')).toHaveLength(2);
  });

  it('shows the tab empty state when nothing is suggested', () => {
    h.people = [];
    h.biz = [];
    renderPage();
    expect(screen.getByText('No suggestions yet. Search above, or invite friends.')).toBeTruthy();
  });

  it('renders golfer figures with and without a handicap, and verified badges', () => {
    renderPage('/find-people?tab=golfers');
    expect(screen.getByText('4.1 hcp · 63 rounds')).toBeTruthy();
    expect(screen.getByText('+1.2 hcp · 212 rounds')).toBeTruthy();
    // New Ned: no handicap, no rounds → no figures line at all.
    const ned = screen.getByText('New Ned').closest('[role="button"]')!;
    expect(ned.textContent).not.toContain('hcp');
    expect(ned.textContent).not.toContain('rounds');
    // Danny Holmes is verified; Niall Devins is not.
    expect(screen.getByText('Danny Holmes').parentElement!.querySelector('[aria-label="Verified"]')).toBeTruthy();
    expect(screen.getByText('Niall Devins').parentElement!.querySelector('[aria-label="Verified"]')).toBeNull();
  });

  it('renders business follower figures with a thousands separator', () => {
    renderPage('/find-people?tab=businesses');
    expect(screen.getByText('1,240 followers')).toBeTruthy();
  });

  it('follows and unfollows a golfer through the existing mutation', async () => {
    renderPage('/find-people?tab=golfers');
    const row = screen.getByText('Niall Devins').closest('[role="button"]')!;
    const pill = row.querySelectorAll('button')[0];
    expect(pill.textContent).toBe('Follow');
    fireEvent.click(pill);
    await waitFor(() => expect(pill.textContent).toBe('Following'));
    expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({
      targetActorType: 'personal', targetActorId: 'u-club', isFollowing: false,
    }));
    fireEvent.click(pill);
    await waitFor(() => expect(pill.textContent).toBe('Follow'));
    expect(h.toggle).toHaveBeenLastCalledWith(expect.objectContaining({
      targetActorType: 'personal', targetActorId: 'u-club', isFollowing: true,
    }));
  });

  it('follows a business through the existing mutation', async () => {
    renderPage('/find-people?tab=businesses');
    const row = screen.getByText('Sundridge Park GC').closest('[role="button"]')!;
    const pill = row.querySelectorAll('button')[0];
    fireEvent.click(pill);
    await waitFor(() => expect(pill.textContent).toBe('Following'));
    expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({
      targetActorType: 'business', targetActorId: 'b1', isFollowing: false,
    }));
  });

  it('Follow all follows every row in the group in turn, then reads Following all', async () => {
    renderPage();
    const followAll = screen.getByText('Follow all 2');
    fireEvent.click(followAll);
    await waitFor(() => expect(screen.getByText('Following all')).toBeTruthy());
    expect(h.toggle).toHaveBeenCalledTimes(2);
    expect(h.toggle).toHaveBeenNthCalledWith(1, expect.objectContaining({ targetActorType: 'business', targetActorId: 'b1' }));
    expect(h.toggle).toHaveBeenNthCalledWith(2, expect.objectContaining({ targetActorType: 'personal', targetActorId: 'u-club' }));
  });

  it('swaps the groups for search results while typing', () => {
    h.searchPeople = [{ id: 'su1', display_name: 'Searched Sam', username: 'sam', profile_photo_url: null }];
    h.searchClubs = [{ id: 'sc1', name: 'Searched Club', city: 'Leeds', country: 'England', logo_url: null, slug: 'searched' }];
    renderPage();
    const input = screen.getByPlaceholderText('Search golfers and businesses');
    fireEvent.change(input, { target: { value: 'sam' } });
    expect(screen.queryByText('From {{club}}')).toBeNull();
    expect(screen.getByText('Searched Sam')).toBeTruthy();
    expect(screen.getByText('@sam')).toBeTruthy();
    expect(screen.getByText('Searched Club')).toBeTruthy();
    expect(screen.getByText('Leeds · England')).toBeTruthy();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('From {{club}}')).toBeTruthy();
  });

  it('opens the invite sheet from the pinned footer', () => {
    renderPage();
    expect(screen.getByText("Invite friends who aren't on clbhouz")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }));
    expect(h.invite).toHaveBeenCalledWith('find_people');
  });
});
