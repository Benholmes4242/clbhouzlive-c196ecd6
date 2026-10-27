/**
 * CB103 — golf club profile hero. Renders ClubProfileHero directly with the
 * page's callbacks as spies; the pure place-line and team-gate helpers are
 * asserted as the page uses them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BusinessProfilePage from '@/pages/BusinessProfilePage';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { toast } from '@/lib/toast';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: () => chainable() },
}));

/* ---- page-level render surface (CB103.1) --------------------------------
   The page's own data hooks are stubbed so the contact rows render from a
   fixture; the heroes, the menu and the action rows are the real thing. */
const pageState: { business: Record<string, unknown> | null; courses: unknown[] } = { business: null, courses: [] };

/* Awaitable PostgREST-style chain: every modifier returns the chain, and the
   chain resolves to the fixture rows the page's club-courses query expects. */
function chainable() {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'gte', 'lte', 'neq', 'is', 'or', 'filter']) {
    q[m] = () => q;
  }
  q.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
    Promise.resolve({ data: pageState.courses, error: null }).then(onF, onR);
  return q;
}

vi.mock('@/hooks/useHeaderVisibility', () => ({
  useHideHeader: () => {}, useHeaderVisibility: () => ({}), useHeaderVariant: () => ({}),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({
  useBusinessProfile: () => ({ data: pageState.business, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: null }) }));
vi.mock('@/hooks/useBusinessPosts', () => ({
  useBusinessPostsCount: () => ({ data: 0 }), useBusinessPosts: () => ({ data: [] }),
}));
vi.mock('@/hooks/useBusinessFollow', () => ({ useBusinessFollowersCount: () => ({ data: 0 }) }));
vi.mock('@/hooks/useBusinessTeam', () => ({ useBusinessTeam: () => ({ data: [] }) }));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null }) }));
vi.mock('@/hooks/useClubRoundsTracked', () => ({ useClubRoundsTracked: () => null }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn() }) }));
vi.mock('@/hooks/messaging/useStartConversation', () => ({
  useStartConversation: () => ({ start: vi.fn(), isStarting: false }),
}));
vi.mock('@/components/business/verification/useVerificationEvidence', () => ({
  useVerificationEvidence: () => ({ line: null }),
}));
vi.mock('@/lib/businessAnalyticsTracking', () => ({
  trackBusinessProfileVisit: vi.fn(), trackBusinessAction: vi.fn(),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));
vi.mock('@/lib/toast', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));
vi.mock('@/lib/business/shareBusinessProfile', () => ({
  shareBusinessProfile: vi.fn(), withShareSource: (u: string) => u,
}));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => null }));
vi.mock('@/components/business/ClubHowItPlays', () => ({ ClubHowItPlays: () => null }));
vi.mock('@/components/business/BusinessProfileInfo', () => ({ BusinessProfileInfo: () => null }));
vi.mock('@/components/business/BusinessTeamTab', () => ({ BusinessTeamTab: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/layout/PageRoot', () => ({
  PageRoot: ({ children }: { children: ReactNode }) => <div data-page-root="">{children}</div>,
}));

import { ClubProfileHero, clubPlaceLine, clubTeamGates } from '@/components/business/hero/ClubProfileHero';
import { useBusinessClubMemberCount } from '@/hooks/useBusinessClubMemberCount';

afterEach(() => { cleanup(); rpc.mockReset(); });

const labels = { golfClub: 'Golf club', courses: (n: number) => `${n} courses` };
const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

function hero(over: Partial<React.ComponentProps<typeof ClubProfileHero>> = {}) {
  const props = {
    name: 'Sundridge Park Golf Club', placeLine: 'Golf club · Kent · 2 courses',
    onShare: vi.fn(), renderMore: (tr: React.ReactElement) => tr, team: null,
    isFollowing: false, onFollowToggle: vi.fn(), onBookTeeTime: vi.fn(), onMessage: vi.fn(),
    ...over,
  };
  return { props, ...render(<ClubProfileHero {...props} />) };
}

describe('CB103 place line', () => {
  it('joins city and region', () => {
    expect(clubPlaceLine({ city: 'Bromley', region: 'Kent', courseCount: 1 }, labels)).toBe('Golf club · Bromley, Kent');
  });
  it('uses region alone', () => {
    expect(clubPlaceLine({ region: 'Kent', country: 'England', courseCount: 1 }, labels)).toBe('Golf club · Kent');
  });
  it('falls back to the first course region, then country', () => {
    expect(clubPlaceLine({ firstCourseRegion: 'Kent', country: 'England', courseCount: 1 }, labels)).toBe('Golf club · Kent');
    expect(clubPlaceLine({ country: 'England', courseCount: 1 }, labels)).toBe('Golf club · England');
  });
  it('adds the course count only at two or more', () => {
    expect(clubPlaceLine({ region: 'Kent', courseCount: 2 }, labels)).toBe('Golf club · Kent · 2 courses');
    expect(clubPlaceLine({ region: 'Kent', courseCount: 1 }, labels)).not.toContain('courses');
  });
});

describe('CB103 visitor row', () => {
  it('Follow calls the toggle and Following replaces it', () => {
    const { props, container, rerender } = hero();
    const actions = container.querySelector('[data-club-actions="visitor"]')!;
    fireEvent.click(actions.querySelectorAll('button')[0]);
    expect(props.onFollowToggle).toHaveBeenCalledTimes(1);
    expect(actions.querySelectorAll('button')[0].querySelector('svg')).not.toBeNull();
    rerender(<ClubProfileHero {...props} isFollowing />);
    const first = container.querySelector('[data-club-actions="visitor"] button')!;
    expect(first.querySelector('svg')).toBeNull();
    fireEvent.click(first);
    expect(props.onFollowToggle).toHaveBeenCalledTimes(2);
  });
  it('Book a tee time shows Soon and only calls its toast handler', () => {
    const { props, container } = hero();
    const tee = container.querySelector('[data-tee-soon]') as HTMLButtonElement;
    expect(tee.querySelector('[data-soon-tag]')).not.toBeNull();
    fireEvent.click(tee);
    expect(props.onBookTeeTime).toHaveBeenCalledTimes(1);
    expect(props.onMessage).not.toHaveBeenCalled();
    expect(props.onFollowToggle).not.toHaveBeenCalled();
  });
  it('Message starts a conversation and disables while starting', () => {
    const { props, container, rerender } = hero();
    const msg = () => container.querySelectorAll('[data-club-actions="visitor"] button')[2] as HTMLButtonElement;
    fireEvent.click(msg());
    expect(props.onMessage).toHaveBeenCalledTimes(1);
    rerender(<ClubProfileHero {...props} messageDisabled />);
    expect(msg().disabled).toBe(true);
  });
});

describe('CB103 team row', () => {
  it('gates follow the existing permissions', () => {
    expect(clubTeamGates(null, true)).toBeNull();
    expect(clubTeamGates({ role: 'owner', canViewInsights: true, canManage: true }, true)).toEqual({ yourCourses: true, insights: true, post: true, edit: true });
    expect(clubTeamGates({ role: 'editor', canViewInsights: true, canManage: false }, false)).toEqual({ yourCourses: false, insights: true, post: true, edit: true });
    expect(clubTeamGates({ role: 'analyst', canViewInsights: true, canManage: false }, true)).toEqual({ yourCourses: true, insights: true, post: false, edit: false });
  });
  it('renders only the permitted buttons', () => {
    const onInsights = vi.fn();
    const { container } = hero({ team: { onInsights } });
    const row = container.querySelector('[data-club-actions="team"]')!;
    expect(row.querySelectorAll('button')).toHaveLength(1);
    fireEvent.click(row.querySelector('button')!);
    expect(onInsights).toHaveBeenCalled();
  });
  it('renders all four for a full team member', () => {
    const { container } = hero({ team: { onYourCourses: vi.fn(), onInsights: vi.fn(), onPost: vi.fn(), onEdit: vi.fn() } });
    expect(container.querySelectorAll('[data-club-actions="team"] button')).toHaveLength(4);
  });
  it('a member passing no gate sees the visitor row', () => {
    const { container } = hero({ team: {} });
    expect(container.querySelector('[data-club-actions="visitor"]')).not.toBeNull();
  });
});

describe('CB103 crest row', () => {
  it('Share calls share and More renders through the page menu', () => {
    const renderMore = vi.fn((tr: React.ReactElement) => <div data-menu="">{tr}</div>);
    const { props, container } = hero({ renderMore });
    const crestRow = container.querySelector('[data-club-crest]')!.parentElement!;
    const circles = crestRow.querySelectorAll('button:not([data-club-crest])');
    expect(circles).toHaveLength(2);
    fireEvent.click(circles[0]);
    expect(props.onShare).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-menu] button')).toBe(circles[1]);
  });
  it('the page menu omits Share profile for the club hero', async () => {
    const src = (await import('node:fs')).readFileSync('src/pages/BusinessProfilePage.tsx', 'utf8');
    expect(src).toContain('renderMore={(trigger) => renderMenu(trigger, false)}');
    expect(src.match(/\{withShare && \(/g)).toHaveLength(2);
  });
});

describe('CB103 stat strip', () => {
  const strip = (c: HTMLElement) => c.querySelector('[data-club-strip]') as HTMLElement | null;
  it('hides cells at zero or null and drops the strip when empty', () => {
    const { container } = hero({ avgRating: null, ratingsCount: 0, roundsTracked: 0, membersHere: null });
    expect(strip(container)).toBeNull();
  });
  it('columns adapt to the cells present', () => {
    const { container, rerender, props } = hero({ avgRating: 8.2, ratingsCount: 5, roundsTracked: 1764, membersHere: 21 });
    expect(strip(container)!.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
    expect(container.querySelector('[data-cell="rounds"] [data-cell-value]')!.textContent).toBe((1764).toLocaleString());
    rerender(<ClubProfileHero {...props} avgRating={8.2} ratingsCount={5} roundsTracked={0} membersHere={null} />);
    expect(strip(container)!.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(1);
  });
  it('rating is white below and at 9.0', () => {
    const { container, rerender, props } = hero({ avgRating: 8.9, ratingsCount: 3 });
    const v = () => (container.querySelector('[data-cell="rating"] [data-cell-value]') as HTMLElement).style.color;
    expect(v()).toBe(toRgb('#F8FAFC'));
    rerender(<ClubProfileHero {...props} avgRating={9.0} ratingsCount={3} />);
    expect(v()).toBe(toRgb('#F8FAFC'));
  });
  it('members are not tappable', () => {
    const { container } = hero({ membersHere: 21 });
    expect(container.querySelector('[data-cell="members"]')!.tagName).toBe('DIV');
  });
});

describe('CB103 members hook', () => {
  const wrap = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
  it('reads get_business_club_member_count', async () => {
    rpc.mockResolvedValue({ data: 21, error: null });
    const { result } = renderHook(() => useBusinessClubMemberCount('b1'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.data).toBe(21));
    expect(rpc).toHaveBeenCalledWith('get_business_club_member_count', { p_business_id: 'b1' });
  });
  it('is undefined while loading and on error, so the cell is absent', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useBusinessClubMemberCount('b1'), { wrapper: wrap() });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    const { container } = hero({ membersHere: result.current.data ?? null });
    expect(container.querySelector('[data-cell="members"]')).toBeNull();
  });
});

describe('CB103 about text', () => {
  it('shows More only when clamped', () => {
    const sh = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(10);
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(10);
    const { container, unmount } = hero({ about: 'short' });
    expect(container.querySelector('[data-club-about-toggle]')).toBeNull();
    unmount();
    sh.mockReturnValue(200);
    const r = hero({ about: 'long text' });
    const btn = r.container.querySelector('[data-club-about-toggle]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(r.container.querySelector('[data-club-about]')!.className).not.toContain('line-clamp-3');
    sh.mockRestore(); ch.mockRestore();
  });
});

describe('CB103 non-club hero unchanged', () => {
  it('a non-club business renders the shared hero without the tee-time pill', () => {
    const { container } = hero({ name: 'Fitter', placeLine: 'Club fitter · London', secondAction: null });
    expect(container.querySelector('[data-club-hero]')).not.toBeNull();
    expect(container.querySelector('[data-tee-soon]')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Fitter');
  });
  it('the page picks the club hero only under isClub', async () => {
    const src = (await import('node:fs')).readFileSync('src/pages/BusinessProfilePage.tsx', 'utf8');
    expect(src).toContain('const isClub = !!business.club_id && courses.length > 0;');
    expect(src).toMatch(/\{isClub \? \(\s*<ClubProfileHero/);
  });
});

/* CB103.1 — the page's own contact rows. Rendered for real (heroes, menu and
   rows are the page's) with only its data hooks stubbed, so a promoted book
   action can be judged where it is actually drawn. */
describe('CB103.1 promoted action on a club profile', () => {
  const courseRow = { id: 'k1', name: 'Sundridge Park', region: 'Kent', country: 'England', thumbnail_image: null };
  const fixture = (over: Record<string, unknown> = {}) => ({
    id: 'b1', name: 'Sundridge Park Golf Club', slug: 'sundridge', category: 'golf_club',
    location: null, lat: null, lng: null,
    club_id: 'c1', club_key: null, club_name: null,
    address_label: null, address_line1: null, address_line2: null,
    city: 'Bromley', region: 'Kent', postcode: null, country: 'England',
    mapbox_place_id: null, location_precision: null, location_updated_at: null,
    description: null, website: null, email: null, phone: null,
    logo_url: null, cover_image_url: null, is_verified: false, is_deleted: false,
    deleted_at: null, created_at: null, updated_at: null, founded_year: null,
    booking_url: 'https://tees.example/sundridge', opening_hours: null, social_links: null,
    amenities: null, show_opening_hours: null, primary_action: 'book', ...over,
  });

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/business/sundridge']}>
          <Routes><Route path="/business/:idOrSlug" element={<BusinessProfilePage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  afterEach(() => {
    vi.mocked(openExternalUrl).mockClear();
    vi.mocked(toast).mockClear();
    pageState.business = null; pageState.courses = [];
  });

  it('club with a promoted book action shows no Book button', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    pageState.business = fixture();
    pageState.courses = [courseRow];
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-tee-soon]')).not.toBeNull());

    /* Nothing below the hero offers Book: the row that would carry it is
       absent, because a club's promoted book is treated as no promoted action. */
    const hero = container.querySelector('[data-club-hero]')!;
    const below = Array.from(container.querySelectorAll('button')).filter(b => !hero.contains(b));
    expect(below.some(b => (b.textContent || '').trim() === 'Book')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Book' })).toBeNull();

    /* The hero's own tee-time pill is unchanged: it still reads Soon and only
       raises the toast, never opens the booking URL. */
    const tee = container.querySelector('[data-tee-soon]') as HTMLButtonElement;
    expect(tee.querySelector('[data-soon-tag]')).not.toBeNull();
    fireEvent.click(tee);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(openExternalUrl).not.toHaveBeenCalled();
  });

  it('non-club promoted book still works', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    pageState.business = fixture({ club_id: null });
    pageState.courses = [];
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Book' })).toBeTruthy());
    expect(container.querySelector('[data-tee-soon]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    expect(openExternalUrl).toHaveBeenCalledWith('https://tees.example/sundridge');
  });
});
