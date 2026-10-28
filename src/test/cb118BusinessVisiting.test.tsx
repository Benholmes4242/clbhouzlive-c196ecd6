/** CB118 non-club contacts, pure rules and page integration. */
import { readFileSync } from 'node:fs';
import { businessSecondPill } from '@/lib/business/businessHero';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (table: string) => chainable(table) },
}));

/* ---- page-level render surface (CB103.1) --------------------------------
   The page's own data hooks are stubbed so the contact rows render from a
   fixture; the heroes, the menu and the action rows are the real thing. */
const pageState: { business: Record<string, unknown> | null; courses: unknown[] } = { business: null, courses: [] };
let clubCoursesResponse: Promise<{ data: unknown[] | null; error: Error | null }> | undefined;

/* Awaitable PostgREST-style chain: every modifier returns the chain, and the
   chain resolves to the fixture rows the page's club-courses query expects. */
function chainable(table: string) {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'gte', 'lte', 'neq', 'is', 'or', 'filter']) {
    q[m] = () => q;
  }
  q.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
    (table === 'golf_courses' && clubCoursesResponse ? clubCoursesResponse : Promise.resolve({ data: pageState.courses, error: null })).then(onF, onR);
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
  return render(<ClubVisiting business={fixture({ club_id: null, category: 'Brand / Manufacturer', ...over })} viewerId="u1" nonClub />);
}
function row(id: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`[data-visiting-row="${id}"]`);
  if (!el) throw new Error(`Missing row ${id}`);
  return el;
}
const entry = { open: '07:00', close: '20:00', closed: false };
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: null, error: null }); team = []; });
afterEach(() => { cleanup(); vi.useRealTimers(); pageState.business = null; pageState.courses = []; clubCoursesResponse = undefined; });


const en = JSON.parse(readFileSync('public/locales/en/common.json', 'utf8'));
const title = (id: string) => row(id).querySelector('b')?.textContent;
const sub = (id: string) => row(id).querySelector('i')?.textContent;
const kicker = () => document.querySelector('.club-visiting-kicker')?.textContent;
describe('CB118 business Visiting', () => {
  it.each(['address', 'poi', 'postcode'] as const)('%s location offers Directions and Visiting', precision => {
    card({ location: 'Garden Road', location_precision: precision, address_label: 'Garden Road, Bromley, BR1' });
    expect(kicker()).toBe(en.business.visiting.visiting);
    expect(title('directions')).toBe('Garden Road, Bromley, BR1');
    fireEvent.click(row('directions'));
    expect(trackBusinessAction).toHaveBeenCalledWith('b1', 'directions', 'u1');
    expect(openExternalUrl).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=Garden%20Road', 'external');
  });
  it('pin uses Bromley and ignores the address label', () => {
    card({ lat: 0, lng: 1, location_precision: 'pin', city: 'Bromley', address_label: 'Coarse address' });
    expect(kicker()).toBe(en.business.visiting.visiting);
    expect(title('directions')).toBe(en.business.visiting.directions);
    expect(sub('directions')).toBe('Bromley');
    fireEvent.click(row('directions'));
    expect(openExternalUrl).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=0,1', 'external');
  });
  it('precise location without address uses place and omits empty subtitle', () => {
    const r = card({ lat: 1, lng: 2, location_precision: 'address', region: 'Kent' });
    expect(sub('directions')).toBe('Kent');
    r.rerender(<ClubVisiting nonClub business={fixture({ lat: 1, lng: 2, location_precision: 'pin' })} />);
    expect(row('directions').querySelector('i')).toBeNull();
  });
  it.each(['city','region','country',null] as const)('coarse %s location never offers Directions despite coordinates', location_precision => {
    card({ location: 'London', lat: 1, lng: 2, location_precision, website: 'clbhouz.co.uk' });
    expect(document.querySelector('[data-visiting-row="directions"]')).toBeNull();
    expect(kicker()).toBe(en.business.visiting.contact);
  });
  it('hours create Visiting and expand the same seven-day week', () => {
    const { container } = card({ show_opening_hours: true, opening_hours: { Mon: entry } });
    expect(kicker()).toBe(en.business.visiting.visiting);
    expect(row('hours')).toHaveAttribute('aria-expanded','false');
    fireEvent.click(row('hours'));
    expect(container.querySelectorAll('[data-day]')).toHaveLength(7);
    fireEvent.click(row('hours'));
    expect(container.querySelector('.club-visiting-week')).toBeNull();
  });
  it('clbhouz city-only Contact retains website email public team and five socials', () => {
    render(<ClubVisiting nonClub business={fixture({ club_id: null, name: 'clbhouz', city: 'London', country: 'United Kingdom', location: 'London', location_precision: 'city', website: 'clbhouz.co.uk', email: 'support@clbhouz.co.uk', social_links: { instagram: '@clbhouz', twitter: '@clbhouz', facebook: 'clbhouz', tiktok: '@clbhouz', youtube: 'clbhouz' } })} publicTeamCount={2} />);
    expect(kicker()).toBe(en.business.visiting.contact);
    expect(document.querySelector('[data-visiting-row="directions"]')).toBeNull();
    expect(sub('website')).toBe('clbhouz.co.uk');
    expect(sub('email')).toBe('support@clbhouz.co.uk');
    expect(document.querySelectorAll('.club-visiting-socials button')).toHaveLength(5);
    expect(row('team')).toBeTruthy();
  });
  it.each(['Hotel / Accommodation','Resort','Restaurant / Cafe','Bar / Pub','Golf Academy','Coach / Instructor','Driving Range','Brand / Manufacturer'])('%s booking reuses hero rule and opens tracked normalized link', category => {
    card({ category, booking_url: 'stay.example/path/' });
    expect(title('book')).toBe(businessSecondPill({ category, booking_url: 'stay.example/path/' }, (key, fallback) => fallback)?.label);
    expect(sub('book')).toBe('stay.example/path');
    expect(row('book').querySelector('.lucide-arrow-up-right')).toBeTruthy();
    fireEvent.click(row('book'));
    expect(openExternalUrl).toHaveBeenCalledWith('https://stay.example/path/');
    expect(trackBusinessAction).toHaveBeenCalledWith('b1','website','u1');
  });
  it.each(['Golf Academy','Coach / Instructor','Driving Range'])('%s without link offers Soon and the hero toast', category => {
    card({ category });
    const expected = businessSecondPill({ category }, (key, fallback) => fallback);
    expect(title('book')).toBe(expected?.label);
    expect(row('book').querySelector('.club-visiting-tag')).toBeTruthy();
    fireEvent.click(row('book'));
    expect(toast).toHaveBeenCalledWith(expected?.soonToast);
    expect(openExternalUrl).not.toHaveBeenCalled();
    expect(trackBusinessAction).not.toHaveBeenCalled();
  });
  it('brand without booking has no booking row', () => {
    card({ website: 'brand.example', primary_action: 'website' });
    expect(document.querySelector('[data-visiting-row="book"]')).toBeNull();
  });
  it('Call and Email invoke existing handlers with non-club titles', () => {
    const location = { href: '' } as Location;
    const spy = vi.spyOn(window, 'location', 'get').mockReturnValue(location);
    card({ phone: '02000000000', email: 'help@example.com' });
    expect(title('phone')).toBe(en.business.visiting.call);
    expect(title('email')).toBe(en.business.visiting.email);
    fireEvent.click(row('phone')); expect(location.href).toBe('tel:02000000000');
    expect(trackBusinessAction).toHaveBeenCalledWith('b1','call','u1');
    vi.mocked(trackBusinessAction).mockClear();
    fireEvent.click(row('email')); expect(location.href).toBe('mailto:help@example.com');
    expect(trackBusinessAction).not.toHaveBeenCalled(); spy.mockRestore();
  });
  it.each(['Golf Academy','Coach / Instructor','Brand / Manufacturer'])('%s team row opens the existing team sheet with matching title', category => {
    render(<ClubVisiting nonClub business={fixture({ category })} publicTeamCount={2} />);
    const coach = category !== 'Brand / Manufacturer';
    expect(title('team')).toBe(coach ? en.business.visiting.meetCoaches : en.business.visiting.meetTeam);
    fireEvent.click(row('team'));
    expect(document.querySelector('#club-team-sheet-title')?.textContent).toBe(coach ? en.business.visiting.coaches : en.business.visiting.team);
  });
  it('empty non-club card is absent', () => { card(); expect(document.querySelector('[data-club-visiting]')).toBeNull(); });
  it('unusable hours and an incomplete pin cannot create a card', () => {
    card({ lat: 1, location_precision: 'pin', opening_hours: { Mon: entry }, show_opening_hours: false });
    expect(document.querySelector('[data-club-visiting]')).toBeNull();
  });
  it('amenities alone retain a Contact card in stored order', () => {
    card({ amenities: ['Parking', 'Restaurant'] });
    expect(kicker()).toBe(en.business.visiting.contact);
    expect(Array.from(document.querySelectorAll('.club-visiting-amenities span'), n => n.textContent)).toEqual(['Parking','Restaurant']);
  });
  it('team count has singular and plural keys without club wording', () => {
    expect(en.business.visiting.people_one).toBe('{{count}} person');
    expect(en.business.visiting.people_other).toBe('{{count}} people');
  });
  it('club defaults retain tee-time Call the club and Email the club', () => {
    render(<ClubVisiting business={fixture({ phone: '1', email: 'a@b', booking_url: 'https://book' })} />);
    expect(title('book')).toBe('Book a tee time');
    expect(title('phone')).toBe('Call the club');
    expect(title('email')).toBe('Email the club');
    fireEvent.click(row('book')); expect(toast).toHaveBeenCalledWith('Tee-time booking is coming soon.');
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
  it('page places the card directly after mentions and before unchanged tabs with shared booking callback', () => {
    const source = readFileSync('src/pages/BusinessProfilePage.tsx','utf8');
    const mentions = source.indexOf('<BusinessMentionsRail');
    const visiting = source.indexOf('<ClubVisiting', mentions);
    expect(visiting).toBeGreaterThan(mentions);
    expect(visiting).toBeLessThan(source.indexOf('data-business-tabs'));
    expect(source.slice(visiting, source.indexOf('/>', visiting))).toContain('onBook={bizSecond?.onTap}');
  });
});

describe('CB118.1 club courses loading identity', () => {
  function mount(over: Partial<BusinessProfile> = {}) {
    pageState.business = fixture({ website: 'club.example', ...over }) as unknown as Record<string, unknown>;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return { client, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/business/test-club']}><Routes><Route path="/business/:idOrSlug" element={<BusinessProfilePage />} /></Routes></MemoryRouter></QueryClientProvider>) };
  }
  function delayedCourses() {
    let resolve: ((value: { data: unknown[] | null; error: Error | null }) => void) | undefined;
    clubCoursesResponse = new Promise(done => { resolve = done; });
    return (value: { data: unknown[] | null; error: Error | null }) => { if (!resolve) throw new Error('Course response resolver missing'); resolve(value); };
  }
  it('club_id with pending courses shows the existing skeleton and no Visiting, tabs or non-club sections', () => {
    delayedCourses(); const { container, client } = mount();
    expect(client.getQueryState(['business-club-courses','c1'])?.status).toBe('pending');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden','true');
    expect(container.querySelector('.clb-shimmer-dark')).not.toBeNull();
    expect(container.querySelector('[data-page-root]')).toBeNull();
    expect(container.querySelector('[data-club-visiting]')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(container.querySelector('[data-business-nearby], [data-business-mentions], [data-about-content], [data-posts-content]')).toBeNull();
  });
  it('resolved club courses render the club layout without an intermediate non-club card', async () => {
    const resolve = delayedCourses(); const { container } = mount();
    const nonClubNodes: Element[] = [];
    // ClubFromTheClub legitimately renders PostsTabContent; watch only
    // non-club layout roots, including the shared Visiting card's variant.
    const nonClubSelector = '[role="tablist"], [data-business-you], [data-business-nearby], [data-business-followers], [data-business-mentions], [data-visiting-variant="business"]';
    const observer = new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(nonClubSelector)) nonClubNodes.push(node);
      nonClubNodes.push(...node.querySelectorAll(nonClubSelector));
    } });
    observer.observe(container, { subtree: true, childList: true });
    try {
      await act(async () => resolve({ data: [{ id:'k1', name:'Course', region:'Kent', country:'England', thumbnail_image:null }], error:null }));
      await waitFor(() => expect(container.querySelector('[data-say]')?.nextElementSibling).toHaveAttribute('data-club-visiting'));
      expect(container.querySelector('[data-page-root]')).not.toBeNull();
      expect(screen.queryByRole('tablist')).toBeNull();
      expect(nonClubNodes).toHaveLength(0);
    } finally { observer.disconnect(); }
  });
  it('courses query error keeps the existing non-club fallback', async () => {
    clubCoursesResponse = Promise.resolve({ data:null, error:new Error('Course read refused') });
    const { container, client } = mount();
    await waitFor(() => expect(client.getQueryState(['business-club-courses','c1'])?.status).toBe('error'));
    expect(container.querySelector('[data-club-visiting]')).not.toBeNull();
    expect(container.querySelector('[data-business-tabs]')).not.toBeNull();
    expect(screen.getByRole('tab', { name:'About' })).toBeInTheDocument();
    expect(container.querySelector('[data-posts-content]')).not.toBeNull();
  });
  it('business without club_id never waits for pending club courses', () => {
    delayedCourses(); const { container, client } = mount({ club_id:null, category:'Brand / Manufacturer' });
    expect(client.getQueryState(['business-club-courses',null])?.fetchStatus).toBe('idle');
    expect(container.querySelector('[data-page-root]')).not.toBeNull();
    expect(container.querySelector('[data-club-visiting]')).not.toBeNull();
    expect(screen.getByRole('tab', { name:'About' })).toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('aria-hidden','true');
  });
});
