/**
 * CB112 — every non-club business renders the shared ClubProfileHero.
 * Pure rules (category word, second pill, strip) are asserted directly; the
 * page is rendered for real with its data hooks stubbed.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.fn();
const state: {
  business: Record<string, unknown> | null;
  courses: unknown[];
  rows: unknown[];
  membership: unknown;
  followers: number;
  posts: number;
  nearby: { coursesNear: number | null; top100Near: number | null } | undefined;
} = { business: null, courses: [], rows: [], membership: null, followers: 0, posts: 0, nearby: undefined };

function chainable() {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'gte', 'lte', 'neq', 'is', 'or', 'filter']) q[m] = () => q;
  q.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
    Promise.resolve({ data: state.rows.length ? state.rows : state.courses, error: null }).then(onF, onR);
  return q;
}
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: () => chainable() },
}));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {}, useHeaderVisibility: () => ({}), useHeaderVariant: () => ({}) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: state.business, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: state.membership }) }));
vi.mock('@/hooks/useBusinessPosts', () => ({ useBusinessPostsCount: () => ({ data: state.posts }), useBusinessPosts: () => ({ data: [] }) }));
vi.mock('@/hooks/useBusinessFollow', () => ({ useBusinessFollowersCount: () => ({ data: state.followers }) }));
vi.mock('@/hooks/useBusinessTeam', () => ({ useBusinessTeam: () => ({ data: [] }) }));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null }) }));
vi.mock('@/hooks/useClubRoundsTracked', () => ({ useClubRoundsTracked: () => null }));
vi.mock('@/hooks/useBusinessClubMemberCount', () => ({ useBusinessClubMemberCount: () => ({ data: null }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn() }) }));
vi.mock('@/hooks/messaging/useStartConversation', () => ({ useStartConversation: () => ({ start: vi.fn(), isStarting: false }) }));
vi.mock('@/components/business/verification/useVerificationEvidence', () => ({ useVerificationEvidence: () => ({ line: null }) }));
vi.mock('@/lib/businessAnalyticsTracking', () => ({ trackBusinessProfileVisit: vi.fn(), trackBusinessAction: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/lib/business/shareBusinessProfile', () => ({ shareBusinessProfile: vi.fn(), withShareSource: (u: string) => u }));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => <div data-posts-content="" /> }));
vi.mock('@/components/business/ClubHowItPlays', () => ({ ClubHowItPlays: () => null }));
vi.mock('@/components/business/BusinessTeamTab', () => ({ BusinessTeamTab: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/layout/PageRoot', () => ({ PageRoot: ({ children }: { children: ReactNode }) => <div data-page-root="">{children}</div> }));
vi.mock('@/hooks/useBusinessNearbyCounts', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useBusinessNearbyCounts')>()),
  useBusinessNearbyCounts: () => ({ data: state.nearby }),
}));
const coachState: { data: unknown; isSuccess: boolean; isError: boolean } = { data: null, isSuccess: false, isError: false };
vi.mock('@/features/coach/hooks', () => ({ useCoachResults: () => coachState, useMyCoach: () => ({ data: null }) }));

import BusinessProfilePage from '@/pages/BusinessProfilePage';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { toast } from '@/lib/toast';
import { businessCategoryWord, businessPlaceLine, businessSecondPill, businessStripKeys } from '@/lib/business/businessHero';
import { ClubProfileHero, clubPlace } from '@/components/business/hero/ClubProfileHero';

const t = (_k: string, d: string) => d;

afterEach(() => {
  cleanup(); rpc.mockReset();
  vi.mocked(openExternalUrl).mockClear(); vi.mocked(toast).mockClear();
  Object.assign(state, { business: null, courses: [], rows: [], membership: null, followers: 0, posts: 0, nearby: undefined });
});

const fixture = (over: Record<string, unknown> = {}) => ({
  id: 'b1', name: 'The Fairway Inn', slug: 'fairway', category: 'Hotel / Accommodation',
  location: null, lat: null, lng: null, club_id: null, club_key: null, club_name: null,
  address_label: null, address_line1: null, address_line2: null,
  city: 'London', region: null, postcode: null, country: 'United Kingdom',
  mapbox_place_id: null, location_precision: null, location_updated_at: null,
  description: 'A long bio about the inn.', website: null, email: null, phone: null,
  logo_url: null, cover_image_url: null, is_verified: false, is_deleted: false,
  deleted_at: null, created_at: null, updated_at: null, founded_year: null,
  booking_url: null, opening_hours: null, social_links: null,
  amenities: null, show_opening_hours: null, primary_action: null, ...over,
});

function Loc() { const l = useLocation(); return <div data-loc={l.pathname} />; }
const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/business/fairway']}>
        <Routes>
          <Route path="/business/:idOrSlug" element={<BusinessProfilePage />} />
          <Route path="*" element={<Loc />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};
const cellKeys = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-cell]')).map((e) => e.getAttribute('data-cell'));

describe('CB112 shared hero on the non-club page', () => {
  it('renders the shared hero; old hero, bio block and action rows are absent', async () => {
    state.business = fixture({ website: 'x.com', phone: '1', primary_action: 'website' });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-hero]')).not.toBeNull());
    expect(container.querySelector('[data-profile-subline]')).toBeNull();
    expect(container.querySelector('[data-tee-soon]')).toBeNull();
    expect(screen.queryByRole('button', { name: /read more/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Message /i })).toBeNull();
    const hero = container.querySelector<HTMLElement>('[data-club-hero]');
    if (!hero) throw new Error('Missing hero');
    expect(within(hero).queryByRole('button', { name: 'Call' })).toBeNull();
    const calls = screen.getAllByRole('button', { name: /^Call/ });
    expect(calls).toHaveLength(1);
    expect(calls[0].closest('[data-club-visiting]')).not.toBeNull();
    expect(container.querySelector('[data-club-about]')!.textContent).toBe('A long bio about the inn.');
    expect(container.querySelector('[data-club-place]')!.textContent).toBe('Hotel · London');
  });
});

describe('CB112 category word and place line', () => {
  const cases: Array<[string, string]> = [
    ['Golf Academy', 'Golf academy'], ['Coach / Instructor', 'Golf coach'], ['Driving Range', 'Driving range'],
    ['Club Fitter', 'Club fitter'], ['Retailer / Pro Shop', 'Golf shop'], ['Resort', 'Golf resort'],
    ['Hotel / Accommodation', 'Hotel'], ['Restaurant / Cafe', 'Restaurant'], ['Bar / Pub', 'Bar'],
    ['Brand / Manufacturer', 'Brand'], ['Creator', 'Creator'], ['University / College', 'University golf'],
  ];
  it.each(cases)('%s → %s', (cat, word) => expect(businessCategoryWord(cat, t)).toBe(word));
  it('Other, null and unknown give no word, so the line is place only', () => {
    for (const c of ['Other', null, 'golf_club', 'hotel']) expect(businessCategoryWord(c, t)).toBe('');
    expect(businessPlaceLine('', 'London')).toBe('London');
  });
  it('city London with country United Kingdom reads London', () => {
    expect(clubPlace({ city: 'London', region: null, country: 'United Kingdom', firstCourseRegion: null })).toBe('London');
    expect(businessPlaceLine('Creator', 'London')).toBe('Creator · London');
  });
  it('neither word nor place renders no line', async () => {
    state.business = fixture({ category: 'Other', city: null, country: null });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-hero]')).not.toBeNull());
    expect(container.querySelector('[data-club-place]')).toBeNull();
  });
});

describe('CB112 second pill rules', () => {
  it('(a) booking link labels by category', () => {
    const b = (category: string) => businessSecondPill({ category, booking_url: 'https://b' }, t);
    expect(b('Hotel / Accommodation')).toMatchObject({ kind: 'book', label: 'Book a stay', arrow: true });
    expect(b('Resort')!.label).toBe('Book a stay');
    expect(b('Restaurant / Cafe')!.label).toBe('Book a table');
    expect(b('Bar / Pub')!.label).toBe('Book a table');
    expect(b('Golf Academy')!.label).toBe('Book a lesson');
    expect(b('Coach / Instructor')!.label).toBe('Book a lesson');
    expect(b('Driving Range')!.label).toBe('Book a bay');
    expect(b('Brand / Manufacturer')!.label).toBe('Book');
  });
  it('(b) no link: academy/coach lesson Soon, range bay Soon', () => {
    expect(businessSecondPill({ category: 'Coach / Instructor' }, t)).toMatchObject({ kind: 'soon', label: 'Book a lesson', soonToast: 'Lesson booking is coming soon.' });
    expect(businessSecondPill({ category: 'Driving Range' }, t)).toMatchObject({ kind: 'soon', label: 'Book a bay', soonToast: 'Bay booking is coming soon.' });
  });
  it('(c) promoted contact only when its field exists; (d) otherwise none', () => {
    expect(businessSecondPill({ category: 'Brand / Manufacturer', primary_action: 'website', website: 'a.com' }, t)).toMatchObject({ label: 'Website', arrow: true });
    expect(businessSecondPill({ primary_action: 'call', phone: '1' }, t)).toMatchObject({ label: 'Call', arrow: false });
    expect(businessSecondPill({ primary_action: 'email', email: 'e@x' }, t)).toMatchObject({ label: 'Email', arrow: false });
    expect(businessSecondPill({ primary_action: 'directions', lat: 1, lng: 2 }, t)).toMatchObject({ label: 'Directions', arrow: true });
    expect(businessSecondPill({ primary_action: 'website', website: null }, t)).toBeNull();
    expect(businessSecondPill({ category: 'Creator' }, t)).toBeNull();
  });
  it('hotel with a booking link: Book a stay with arrow opens it', async () => {
    state.business = fixture({ booking_url: 'https://stay.example' });
    const { container } = renderPage();
    const hero = container.querySelector<HTMLElement>('[data-club-hero]');
    if (!hero) throw new Error('Missing hero');
    const btn = within(hero).getByRole('button', { name: 'Book a stay' });
    expect(btn.querySelector('[data-arrow]')).not.toBeNull();
    fireEvent.click(btn);
    expect(openExternalUrl).toHaveBeenCalledWith('https://stay.example');
    expect(container.querySelector('[data-soon-tag]')).toBeNull();
  });
  it('academy without a link: Book a lesson + Soon toasts', async () => {
    state.business = fixture({ category: 'Golf Academy' });
    const { container } = renderPage();
    const hero = container.querySelector<HTMLElement>('[data-club-hero]');
    if (!hero) throw new Error('Missing hero');
    const btn = within(hero).getByRole('button', { name: /Book a lesson/ });
    expect(btn.querySelector('[data-soon-tag]')).not.toBeNull();
    fireEvent.click(btn);
    expect(toast).toHaveBeenCalledWith('Lesson booking is coming soon.');
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
  it('brand with primary website: Website + arrow; none renders no second pill', async () => {
    state.business = fixture({ category: 'Brand / Manufacturer', website: 'brand.com', primary_action: 'website' });
    const r = renderPage();
    const hero = r.container.querySelector<HTMLElement>('[data-club-hero]');
    if (!hero) throw new Error('Missing hero');
    const btn = within(hero).getByRole('button', { name: 'Website' });
    expect(btn.querySelector('[data-arrow]')).not.toBeNull();
    r.unmount();
    state.business = fixture({ category: 'Creator' });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-hero]')).not.toBeNull());
    expect(container.querySelector('[data-second-pill]')).toBeNull();
  });
});

describe('CB112 team row', () => {
  it('Insights white with Post and Edit; no Follow, Message or Your courses', async () => {
    state.membership = { role: 'owner', canViewInsights: true, canManage: true };
    state.business = fixture();
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-actions="team"]')).not.toBeNull());
    const ins = container.querySelector('[data-insights-pill]') as HTMLElement;
    expect(ins.style.background).toBe('rgb(248, 250, 252)');
    const row = Array.from(container.querySelectorAll('[data-club-actions] button'));
    expect(row).toHaveLength(3);
    expect(row[0]).toBe(ins);
    expect(row[1].querySelector('svg.lucide-plus')).not.toBeNull();
    expect(row[2].querySelector('svg.lucide-pencil')).not.toBeNull();
    expect(row.some((b) => /Your courses|Follow/.test(b.textContent || ''))).toBe(false);
    expect(container.querySelector('[data-club-actions] svg.lucide-message-circle')).toBeNull();
    fireEvent.click(ins);
    await waitFor(() => expect(container.querySelector('[data-loc="/business/b1/insights"]')).not.toBeNull());
  });
  it('an editor without insights sees the Post and Edit circles alone', async () => {
    state.membership = { role: 'editor', canViewInsights: false, canManage: false };
    state.business = fixture();
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-actions="team"]')).not.toBeNull());
    expect(container.querySelector('[data-insights-pill]')).toBeNull();
    const row = Array.from(container.querySelectorAll('[data-club-actions] button'));
    expect(row).toHaveLength(2);
    expect(row[0].querySelector('svg.lucide-plus')).not.toBeNull();
    expect(row[1].querySelector('svg.lucide-pencil')).not.toBeNull();
  });
});

describe('CB112 figure strip', () => {
  it('pure order: followers then posts for every category, zeros dropped', () => {
    for (const c of ['Hotel / Accommodation', 'Resort', 'Restaurant / Cafe', 'Bar / Pub', 'Driving Range']) {
      expect(businessStripKeys(c, { coursesNear: 99, top100Near: 5, followers: 212, posts: 9 } as never)).toEqual(['followers', 'posts']);
    }
    expect(businessStripKeys('Hotel / Accommodation', { followers: 0, posts: 9 })).toEqual(['posts']);
    expect(businessStripKeys('Creator', { followers: 0, posts: 4 })).toEqual(['posts']);
    expect(businessStripKeys('Creator', { followers: 0, posts: 0 })).toEqual([]);
  });
  it('hotel with 6 near and 1 Top 100 still shows Followers · Posts only', async () => {
    Object.assign(state, { business: fixture({ lat: 51.4, lng: 0.01 }), nearby: { coursesNear: 6, top100Near: 1 }, followers: 212, posts: 9 });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-strip]')).not.toBeNull());
    expect(cellKeys(container)).toEqual(['followers', 'posts']);
    expect(container.querySelector('[data-cell="coursesNear"]')).toBeNull();
    expect(container.querySelector('[data-cell="followers"]')!.tagName).toBe('BUTTON');
  });
  it('no pin shows Followers · Posts; zero values give no strip', async () => {
    Object.assign(state, { business: fixture(), nearby: undefined, followers: 3, posts: 2 });
    const r = renderPage();
    await waitFor(() => expect(r.container.querySelector('[data-club-strip]')).not.toBeNull());
    expect(cellKeys(r.container)).toEqual(['followers', 'posts']);
    r.unmount();
    Object.assign(state, { business: fixture({ category: 'Creator' }), followers: 0, posts: 0 });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-hero]')).not.toBeNull());
    expect(container.querySelector('[data-club-strip]')).toBeNull();
  });
  it('Followers tap navigates; Posts tap scrolls to From {name}', async () => {
    Object.assign(state, { business: fixture({ category: 'Creator' }), followers: 3, posts: 2 });
    const r = renderPage();
    await waitFor(() => expect(r.container.querySelector('[data-club-feed]')).not.toBeNull());
    expect(r.container.querySelector('[data-business-tabs]')).toBeNull();
    Element.prototype.scrollTo = vi.fn() as never;
    const spy = vi.spyOn(document, 'querySelector');
    fireEvent.click(r.container.querySelector('[data-cell="posts"]')!);
    expect(spy).toHaveBeenCalledWith('[data-club-feed]');
    spy.mockRestore();
    fireEvent.click(r.container.querySelector('[data-cell="followers"]')!);
    await waitFor(() => expect(r.container.querySelector('[data-loc="/business/fairway/followers"]')).not.toBeNull());
  });
});

describe('CB112 figure placement', () => {
  const hero = (over: Partial<React.ComponentProps<typeof ClubProfileHero>> = {}) => {
    const props = {
      name: 'The Fairway Inn', placeLine: 'Hotel · London',
      onShare: vi.fn(), renderMore: (tr: React.ReactElement) => tr, team: null,
      isFollowing: false, onFollowToggle: vi.fn(), onBookTeeTime: vi.fn(), onMessage: vi.fn(),
      ...over,
    };
    return render(<ClubProfileHero {...props} />);
  };
  const twoCells = [
    { key: 'followers', value: '48', label: 'Followers', onTap: vi.fn() },
    { key: 'posts', value: '7', label: 'Posts', onTap: vi.fn() },
  ];
  const strip = (c: HTMLElement) => c.querySelector('[data-club-strip]') as HTMLElement | null;

  it('Follow + Message with no second pill puts 1–2 figures beside, inside the action row', async () => {
    Object.assign(state, { business: fixture({ category: 'Creator' }), followers: 48, posts: 7 });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-strip]')).not.toBeNull());
    const s = strip(container)!;
    expect(s.getAttribute('data-strip-placement')).toBe('beside');
    expect(s.closest('[data-club-actions]')).not.toBeNull();
    expect(s.style.marginLeft).toBe('auto');
    expect(s.style.gap).toBe('14px');
  });

  it('a second pill puts the figures underneath', async () => {
    Object.assign(state, { business: fixture({ booking_url: 'https://stay.example' }), followers: 2, posts: 5 });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-second-pill]')).not.toBeNull());
    const s = strip(container)!;
    expect(s.getAttribute('data-strip-placement')).toBe('below');
    expect(s.closest('[data-club-actions]')).toBeNull();
    expect(s.style.gap).toBe('28px');
    expect(s.style.margin).toBe('16px 20px 0px');
  });

  it('secondAction undefined (club tee-time pill), a team row, or three cells all go below', () => {
    const club = hero({ stripCells: twoCells });
    expect(strip(club.container)!.getAttribute('data-strip-placement')).toBe('below');
    club.unmount();
    const team = hero({ stripCells: twoCells, team: { onInsights: vi.fn() } as never });
    expect(strip(team.container)!.getAttribute('data-strip-placement')).toBe('below');
    team.unmount();
    const three = hero({ secondAction: null, stripCells: [...twoCells, { key: 'extra', value: '3', label: 'Extra' }] });
    expect(strip(three.container)!.getAttribute('data-strip-placement')).toBe('below');
  });

  it('no element inside the strip carries a divider border, in either placement', () => {
    for (const placement of ['beside', 'below'] as const) {
      const v = hero(placement === 'beside' ? { secondAction: null, stripCells: twoCells } : { stripCells: twoCells });
      const s = strip(v.container)!;
      expect(s.getAttribute('data-strip-placement')).toBe(placement);
      for (const el of [s, ...Array.from(s.querySelectorAll<HTMLElement>('*'))]) {
        for (const b of [el.style.borderTop, el.style.borderBottom, el.style.borderLeft]) {
          expect(['', 'none'].includes(b)).toBe(true);
        }
      }
      v.unmount();
    }
  });

  it('no cells renders no strip, and the bio still renders', () => {
    const v = hero({ secondAction: null, about: 'Clubs, fitting and everything in between, since 1998.' });
    expect(strip(v.container)).toBeNull();
    expect(v.container.querySelector('[data-club-about]')!.textContent).toContain('since 1998');
  });

  it('the coach strip renders its four keys, below', async () => {
    Object.assign(coachState, { data: { n: 12, avg_change: -2.4 }, isSuccess: true, isError: false });
    Object.assign(state, { business: fixture({ category: 'Coach / Instructor' }), followers: 3, posts: 2 });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-club-strip]')).not.toBeNull());
    expect(cellKeys(container)).toEqual(['coached', 'avgChange', 'followers', 'posts']);
    expect(strip(container)!.getAttribute('data-strip-placement')).toBe('below');
  });
});

describe('CB112 clubs unchanged', () => {
  it('club keeps the tee-time pill, Your courses white and its own cells', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    state.courses = [{ id: 'k1', name: 'Sundridge', region: 'Kent', country: 'England', thumbnail_image: null }];
    state.membership = { role: 'owner', canViewInsights: true, canManage: true };
    state.business = fixture({ club_id: 'c1', category: 'Golf Club', is_verified: true });
    const { container } = renderPage();
    // Club: the team row carries Your courses (white) before Insights (glass).
    await waitFor(() => expect(container.querySelectorAll('[data-club-actions="team"] button')).toHaveLength(4));
    const row = Array.from(container.querySelectorAll('[data-club-actions="team"] button')) as HTMLElement[];
    expect(row[0].style.background).toBe('rgb(248, 250, 252)');
    expect(row[1]).toBe(container.querySelector('[data-insights-pill]'));
    expect(row[1].style.background).toBe('rgba(255, 255, 255, 0.07)');
    expect(container.querySelector('[data-cell="followers"]')).toBeNull();
    state.membership = null;
    cleanup();
    const v = renderPage();
    await waitFor(() => expect(v.container.querySelector('[data-tee-soon]')).not.toBeNull());
    expect(v.container.querySelector('[data-second-pill]')).toBeNull();
  });
});

describe('CB112 nearby counts hook', () => {
  it('counts nearby courses and distinct Top 100 members, 16 km and limit 100', async () => {
    const real = (await vi.importActual<typeof import('@/hooks/useBusinessNearbyCounts')>('@/hooks/useBusinessNearbyCounts')).useBusinessNearbyCounts;
    rpc.mockResolvedValue({ data: [{ course_id: 'a' }, { course_id: 'b' }, { course_id: 'c' }], error: null });
    state.rows = [{ course_id: 'a' }, { course_id: 'a' }];
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => real('Bar / Pub', 51, 0), { wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> });
    await waitFor(() => expect(result.current.data).toEqual({ coursesNear: 3, top100Near: 1, courses: ['a', 'b', 'c'].map((id) => ({ id, name: '', distanceKm: null, thumbnail: null, ratingAvg: null, reviewCount: 0, isTop100: id === 'a' })) }));
    expect(rpc).toHaveBeenCalledWith('get_nearby_courses', { p_user_lat: 51, p_user_lng: 0, p_radius_km: 16, p_limit: 100 });
  });
  it('is disabled for other categories and without a pin', async () => {
    const real = (await vi.importActual<typeof import('@/hooks/useBusinessNearbyCounts')>('@/hooks/useBusinessNearbyCounts')).useBusinessNearbyCounts;
    const qc = new QueryClient();
    const w = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    renderHook(() => real('Creator', 51, 0), { wrapper: w });
    renderHook(() => real('Hotel / Accommodation', null, null), { wrapper: w });
    expect(rpc).not.toHaveBeenCalled();
  });
});
