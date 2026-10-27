/** CB107 stored contacts and club-only page behavior. */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BusinessProfilePage from '@/pages/BusinessProfilePage';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { toast } from '@/lib/toast';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const rpc = vi.fn();
let team: { is_public: boolean }[] = [];
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
vi.mock('@/hooks/useBusinessTeam', () => ({ useBusinessTeam: () => ({ data: team }) }));
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
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => <div data-posts-content /> }));
vi.mock('@/components/business/ClubHowItPlays', () => ({ ClubHowItPlays: () => null }));
vi.mock('@/components/business/BusinessProfileInfo', () => ({ BusinessProfileInfo: () => <div data-about-content /> }));
vi.mock('@/components/business/BusinessTeamTab', () => ({ BusinessTeamTab: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/layout/PageRoot', () => ({
  PageRoot: ({ children }: { children: ReactNode }) => <div data-page-root="">{children}</div>,
}));


vi.mock('@/components/business/ClubWhatGolfersSay', () => ({ ClubWhatGolfersSay: () => <div data-say /> }));
vi.mock('@/components/business/ClubYouCard', () => ({ ClubYouCard: () => null }));
import { ClubVisiting } from '@/components/business/ClubVisiting';
import type { BusinessProfile } from '@/hooks/useBusinessProfile';
import { SOCIAL_CONFIG } from '@/lib/business/socialLinks';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';

const fixture = (over: Partial<BusinessProfile> = {}): BusinessProfile => ({
  id: 'b1', name: 'Test Club', slug: 'test-club', category: 'golf_club', location: null, lat: null, lng: null,
  club_id: 'c1', club_key: null, club_name: null, address_label: null, address_line1: null, address_line2: null,
  city: null, region: null, postcode: null, country: null, mapbox_place_id: null, location_precision: null,
  location_updated_at: null, description: null, website: null, email: null, phone: null, logo_url: null,
  cover_image_url: null, is_verified: false, is_deleted: false, deleted_at: null, created_at: null, updated_at: null,
  founded_year: null, booking_url: null, opening_hours: null, social_links: null, amenities: null,
  show_opening_hours: false, primary_action: null, ...over,
});
function card(over: Partial<BusinessProfile> = {}) {
  return render(<ClubVisiting business={fixture(over)} viewerId="u1" firstCourseRegion="Kent" />);
}
function row(id: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`[data-visiting-row="${id}"]`);
  if (!el) throw new Error(`Missing row ${id}`);
  return el;
}
const entry = { open: '07:00', close: '20:00', closed: false };
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: null, error: null }); team = []; });
afterEach(() => { cleanup(); vi.useRealTimers(); pageState.business = null; pageState.courses = []; });

describe('CB107 Visiting contacts', () => {
  it('Book is always Soon and toast-only even with a booking URL', () => {
    const { rerender } = card({ booking_url: 'https://booking.example' });
    expect(within(row('book')).getByText('Soon')).toBeTruthy();
    fireEvent.click(row('book'));
    expect(toast).toHaveBeenCalledWith('Tee-time booking is coming soon.');
    expect(openExternalUrl).not.toHaveBeenCalled(); expect(trackBusinessAction).not.toHaveBeenCalled();
    rerender(<ClubVisiting business={fixture()} />);
    expect(row('book')).toBeTruthy();
  });
  it('Directions uses address_label and tracks the existing maps handler', () => {
    card({ location: 'Garden Road', address_label: 'Garden Road, Bromley, BR1', address_line1: 'Other' });
    expect(row('directions').querySelector('b')?.textContent).toBe('Garden Road, Bromley, BR1');
    fireEvent.click(row('directions'));
    expect(openExternalUrl).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=Garden%20Road', 'external');
    expect(trackBusinessAction).toHaveBeenCalledWith('b1', 'directions', 'u1');
  });
  it('Directions joins available street city and postcode', () => {
    card({ location: 'address', address_line1: 'Garden Road', city: 'Bromley', postcode: 'BR1' });
    expect(row('directions').querySelector('b')?.textContent).toBe('Garden Road, Bromley, BR1');
  });
  it('Directions with a pin and no address uses Directions and the course place', () => {
    card({ lat: 0, lng: 0 });
    expect(row('directions').querySelector('b')?.textContent).toBe('Directions');
    expect(row('directions').querySelector('i')?.textContent).toBe('Kent');
    fireEvent.click(row('directions'));
    expect(openExternalUrl).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=0,0', 'external');
  });
  it('Directions uses the business region before the course region', () => {
    card({ lat: 1, lng: 2, region: 'Surrey' });
    expect(row('directions').querySelector('i')?.textContent).toBe('Surrey');
  });
  it('Directions is absent without location or a complete pin', () => {
    card({ lat: 1, address_label: 'Not a location' });
    expect(document.querySelector('[data-visiting-row="directions"]')).toBeNull();
  });
  it('website is present only when set and opens a normalized URL with tracking', () => {
    const { rerender } = card();
    expect(document.querySelector('[data-visiting-row="website"]')).toBeNull();
    rerender(<ClubVisiting business={fixture({ website: 'https://club.example/' })} viewerId="u1" />);
    expect(row('website').querySelector('i')?.textContent).toBe('club.example');
    fireEvent.click(row('website'));
    expect(openExternalUrl).toHaveBeenCalledWith('https://club.example/');
    expect(trackBusinessAction).toHaveBeenCalledWith('b1', 'website', 'u1');
    rerender(<ClubVisiting business={fixture({ website: 'club.example' })} viewerId="u1" />);
    fireEvent.click(row('website')); expect(openExternalUrl).toHaveBeenLastCalledWith('https://club.example');
  });
  it('phone is present only when set and invokes tel with call tracking', () => {
    const { rerender } = card();
    expect(document.querySelector('[data-visiting-row="phone"]')).toBeNull();
    rerender(<ClubVisiting business={fixture({ phone: '02000000000' })} viewerId="u1" />);
    fireEvent.click(row('phone'));
    expect(trackBusinessAction).toHaveBeenCalledWith('b1', 'call', 'u1');
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
  it('email is present only when set and invokes mailto without action tracking', () => {
    const { rerender } = card();
    expect(document.querySelector('[data-visiting-row="email"]')).toBeNull();
    rerender(<ClubVisiting business={fixture({ email: 'office@club.example' })} viewerId="u1" />);
    expect(row('email').querySelector('i')?.textContent).toBe('office@club.example');
    fireEvent.click(row('email')); expect(trackBusinessAction).not.toHaveBeenCalled();
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
  it('facilities retain stored order', () => {
    const { container } = card({ amenities: ['Pro shop', 'Driving range', 'Restaurant'] });
    expect(Array.from(container.querySelectorAll('.club-visiting-amenities span'), e => e.textContent)).toEqual(['Pro shop', 'Driving range', 'Restaurant']);
  });
  it('socials reuse every SOCIAL_CONFIG URL and omit empty values', () => {
    const links = { instagram: '@club', twitter: '@club', facebook: 'facebook.com/club', tiktok: '@club', youtube: 'youtube.com/club' };
    const { rerender, container } = card({ social_links: links });
    for (const config of SOCIAL_CONFIG) {
      fireEvent.click(screen.getByRole('button', { name: config.label, exact: true }));
      expect(openExternalUrl).toHaveBeenLastCalledWith(config.buildUrl(links[config.key]));
    }
    rerender(<ClubVisiting business={fixture({ social_links: { instagram: ' ' } })} />);
    expect(container.querySelector('.club-visiting-socials')).toBeNull();
  });
});

describe('CB107 opening hours', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 27, 12)); });
  it('open today uses the viewer day and en dash; week starts collapsed and toggles', () => {
    const { container } = card({ show_opening_hours: true, opening_hours: { Tue: entry, Sun: { ...entry, closed: true } } });
    expect(row('hours').querySelector('b')?.textContent).toBe('Open today · 07:00–20:00');
    expect(row('hours').getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.club-visiting-week')).toBeNull();
    fireEvent.click(row('hours'));
    expect(row('hours').getAttribute('aria-expanded')).toBe('true');
    const days = Array.from(container.querySelectorAll('[data-day]'));
    expect(days.map(d => d.getAttribute('data-day'))).toEqual(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
    expect(container.querySelector('[data-day="Tue"]')?.className).toBe('today');
    expect(container.querySelector('[data-day="Sun"]')?.textContent).toBe('SundayClosed');
    fireEvent.click(row('hours')); expect(container.querySelector('.club-visiting-week')).toBeNull();
  });
  it('closed today is reported from today rather than another entry', () => {
    card({ show_opening_hours: true, opening_hours: { Tue: { ...entry, closed: true }, Mon: entry } });
    expect(row('hours').querySelector('b')?.textContent).toBe('Closed today');
  });
  it('no entry today shows Opening hours without a subtitle', () => {
    card({ show_opening_hours: true, opening_hours: { Mon: entry } });
    expect(row('hours').querySelector('b')?.textContent).toBe('Opening hours');
    expect(row('hours').querySelector('i')).toBeNull();
  });
  it('the shared display rule hides disabled and empty hours', () => {
    const { rerender } = card({ show_opening_hours: false, opening_hours: { Tue: entry } });
    expect(document.querySelector('[data-visiting-row="hours"]')).toBeNull();
    rerender(<ClubVisiting business={fixture({ show_opening_hours: true, opening_hours: { Tue: { open: '', close: '', closed: false } } })} />);
    expect(document.querySelector('[data-visiting-row="hours"]')).toBeNull();
  });
});

function page(over: Partial<BusinessProfile> = {}) {
  pageState.business = fixture(over) as unknown as Record<string, unknown>;
  pageState.courses = over.club_id === null ? [] : [{ id: 'k1', name: 'Course', region: 'Kent', country: 'England', thumbnail_image: null }];
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/test-club']}><Routes><Route path="/business/:idOrSlug" element={<BusinessProfilePage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('CB107 page integration', () => {
  it('club Visiting follows What golfers say; contact rows and About are gone', async () => {
    const { container } = page({ website: 'club.example', phone: '02000000000', primary_action: 'website' });
    await waitFor(() => expect(container.querySelector('[data-club-visiting]')).toBeTruthy());
    expect(container.querySelector('[data-say]')?.nextElementSibling?.hasAttribute('data-club-visiting')).toBe(true);
    expect(screen.queryByRole('tab', { name: 'About' })).toBeNull();
    expect(container.querySelector('[data-about-content]')).toBeNull();
    const buttons = screen.getAllByRole('button', { name: /Website|Call/ });
    expect(buttons.every(b => !!b.closest('[data-club-visiting]'))).toBe(true);
  });
  it('no tab bar when only Posts remains; Posts content renders directly', async () => {
    const { container } = page();
    await waitFor(() => expect(container.querySelector('[data-club-visiting]')).toBeTruthy());
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(container.querySelector('[data-posts-content]')).toBeTruthy();
  });
  it('Team stays conditional and tappable alongside Posts', async () => {
    team = [{ is_public: true }];
    const { container } = page();
    await waitFor(() => expect(container.querySelector('[data-club-visiting]')).toBeTruthy());
    expect(screen.getAllByRole('tab').map(e => e.textContent)).toEqual(['Posts','Team']);
    fireEvent.click(screen.getByRole('tab', { name: 'Team' }));
    expect(screen.getByRole('tab', { name: 'Team' }).getAttribute('aria-selected')).toBe('true');
  });
  it('a non-club retains contacts About tab and Posts tab bar without Visiting', async () => {
    const { container } = page({ club_id: null, website: 'club.example', booking_url: 'https://book.example', primary_action: 'book' });
    expect(container.querySelector('[data-club-visiting]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Book', exact: true }));
    expect(openExternalUrl).toHaveBeenCalledWith('https://book.example');
    expect(screen.getByRole('button', { name: 'Website', exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'About' }));
    expect(container.querySelector('[data-about-content]')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Posts' })).toBeTruthy();
  });
});
