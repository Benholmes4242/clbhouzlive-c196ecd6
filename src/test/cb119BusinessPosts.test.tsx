/** CB119: From {business} on every non-club, no business tabs, no skeleton tab row. */
import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';
import type { BusinessProfile } from '@/hooks/useBusinessProfile';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const rpc = vi.fn();
let team: { is_public: boolean }[] = [];
let postsCount: number | undefined = 0;
const feedState = { empty: true, lastProps: null as Record<string, unknown> | null };
const pageState: { business: Record<string, unknown> | null; courses: unknown[] } = { business: null, courses: [] };
function chainable() {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'gte', 'lte', 'neq', 'is', 'or', 'filter']) q[m] = () => q;
  q.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => Promise.resolve({ data: pageState.courses, error: null }).then(onF, onR);
  return q;
}
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a), from: () => chainable() } }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {}, useHeaderVisibility: () => ({}), useHeaderVariant: () => ({}) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: pageState.business, isLoading: false, error: null, refetch: vi.fn() }) }));
let membership: Record<string, unknown> | null = null;
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: membership, isSuccess: true, isError: false }) }));
vi.mock('@/hooks/useBusinessPosts', () => ({ useBusinessPostsCount: () => ({ data: postsCount }), useBusinessPosts: () => ({ data: [] }) }));
vi.mock('@/hooks/useBusinessFollow', () => ({ useBusinessFollowersCount: () => ({ data: 0 }) }));
vi.mock('@/hooks/useBusinessTeam', () => ({ useBusinessTeam: () => ({ data: team }) }));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null }) }));
vi.mock('@/hooks/useClubRoundsTracked', () => ({ useClubRoundsTracked: () => null }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null, availableActors: [], setActiveActor: vi.fn() }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn() }) }));
vi.mock('@/hooks/messaging/useStartConversation', () => ({ useStartConversation: () => ({ start: vi.fn(), isStarting: false }) }));
vi.mock('@/components/business/verification/useVerificationEvidence', () => ({ useVerificationEvidence: () => ({ line: null }) }));
vi.mock('@/lib/businessAnalyticsTracking', () => ({ trackBusinessProfileVisit: vi.fn(), trackBusinessAction: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/lib/business/shareBusinessProfile', () => ({ shareBusinessProfile: vi.fn(), withShareSource: (u: string) => u }));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({
  default: (props: Record<string, unknown>) => { feedState.lastProps = props; return <div data-posts-content>{feedState.empty ? props.emptyOverride as ReactNode : null}</div>; },
}));
vi.mock('@/components/business/ClubHowItPlays', () => ({ ClubHowItPlays: () => null }));
vi.mock('@/components/business/BusinessTeamTab', () => ({ BusinessTeamTab: ({ businessId }: { businessId: string }) => <div data-team-tab={businessId} /> }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/layout/PageRoot', () => ({ PageRoot: ({ children }: { children: ReactNode }) => <div data-page-root="">{children}</div> }));
vi.mock('@/components/business/ClubWhatGolfersSay', () => ({ ClubWhatGolfersSay: () => <div data-say /> }));
vi.mock('@/components/business/ClubYouCard', () => ({ ClubYouCard: () => null }));
/* FeedCard children, as in feedActionsRight.test.tsx. */
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => <div data-testid="actor-picker" /> }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => <div data-testid="liked-by-row" /> }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/ReviewPostCard', () => ({ ReviewPostCard: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => <div data-testid="comment-preview" /> }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import BusinessProfilePage from '@/pages/BusinessProfilePage';
import { ClubFromTheClub } from '@/components/business/ClubFromTheClub';
import { ProfileSurfaceSkeleton } from '@/components/skeletons/ProfileSurfaceSkeleton';

const LONG = 'The Exceptionally Long Named Fairway Golf Shop and Custom Fitting Studio';
const fixture = (over: Partial<BusinessProfile> = {}): BusinessProfile => ({
  id: 'b1', name: 'Test Golf Club', slug: 'test-club', category: 'golf_club', location: null, lat: null, lng: null,
  club_id: 'c1', club_key: null, club_name: null, address_label: null, address_line1: null, address_line2: null,
  city: null, region: null, postcode: null, country: null, mapbox_place_id: null, location_precision: null,
  location_updated_at: null, description: null, website: null, email: null, phone: null, logo_url: null,
  cover_image_url: null, is_verified: false, is_deleted: false, deleted_at: null, created_at: null, updated_at: null,
  founded_year: null, booking_url: null, opening_hours: null, social_links: null, amenities: null,
  show_opening_hours: false, primary_action: null, ...over,
});
function page(over: Partial<BusinessProfile> = {}) {
  pageState.business = fixture(over) as unknown as Record<string, unknown>;
  pageState.courses = over.club_id === null ? [] : [{ id: 'k1', name: 'Course', region: 'Kent', country: 'England', thumbnail_image: null }];
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/test-club']}><Routes><Route path="/business/:idOrSlug" element={<BusinessProfilePage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
const nonClub = (over: Partial<BusinessProfile> = {}) => page({ club_id: null, category: 'Retail / Pro Shop', name: LONG, ...over });

beforeEach(() => { rpc.mockResolvedValue({ data: null, error: null }); team = []; postsCount = 0; feedState.empty = true; membership = null; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('CB119 ClubFromTheClub non-club props', () => {
  it('title is From {name} on one line with an ellipsis; the count keeps its space', () => {
    postsCount = 4;
    render(<ClubFromTheClub businessId="b1" businessName={LONG} postsCount={4} isOwner={false} title={`From ${LONG}`} emptyName={LONG} />);
    const title = document.querySelector<HTMLElement>('[data-club-feed-title]')!;
    expect(title.textContent).toBe(`From ${LONG}`);
    expect(title.style.whiteSpace).toBe('nowrap');
    expect(title.style.overflow).toBe('hidden');
    expect(title.style.textOverflow).toBe('ellipsis');
    expect(title.style.minWidth).toBe('0px');
    const count = document.querySelector<HTMLElement>('[data-club-feed-count]')!;
    expect(count.textContent).toBe('4 posts');
    expect(count.style.flex).toContain('none');
  });
  it('one post reads 1 post', () => {
    render(<ClubFromTheClub businessId="b1" businessName="Shop" postsCount={1} isOwner={false} title="From Shop" emptyName="Shop" />);
    expect(document.querySelector('[data-club-feed-count]')?.textContent).toBe('1 post');
  });
  it('golfer empty sentence uses the full name; no Post pill', () => {
    render(<ClubFromTheClub businessId="b1" businessName={LONG} isOwner={false} title={`From ${LONG}`} emptyName={LONG} />);
    expect(document.querySelector('[data-club-feed-empty]')?.textContent).toBe(`${LONG} hasn't posted yet. Follow to see the first one in your Clubhouse feed.`);
    expect(document.querySelector('[data-club-feed-post]')).toBeNull();
  });
  it('team empty state shows the Post pill when the post gate allows', () => {
    const onPost = vi.fn();
    render(<ClubFromTheClub businessId="b1" businessName={LONG} isOwner title={`From ${LONG}`} emptyName={LONG} onPost={onPost} />);
    fireEvent.click(document.querySelector('[data-club-feed-post]')!);
    expect(onPost).toHaveBeenCalledTimes(1);
  });
  it('defaults keep the club title without the non-club title marker', () => {
    render(<ClubFromTheClub businessId="b1" businessName="Test Golf Club" isOwner={false} />);
    expect(document.querySelector('[data-club-feed]')?.getAttribute('aria-label')).toBe('From the club');
    expect(document.querySelector('[data-club-feed-title]')).toBeNull();
  });
});

describe('CB119 non-club page', () => {
  it('From {name} is the last section, directly after Visiting', async () => {
    const { container } = nonClub();
    await waitFor(() => expect(container.querySelector('[data-club-feed]')).not.toBeNull());
    const feed = container.querySelector('[data-club-feed]')!;
    expect(feed.getAttribute('aria-label')).toBe(`From ${LONG}`);
    expect(feed.previousElementSibling?.hasAttribute('data-club-visiting')).toBe(true);
    const sections = Array.from(container.querySelectorAll('[data-page-root] > *')).filter(e => e.tagName !== 'DIV' || e.hasAttribute('data-club-visiting'));
    expect(sections[sections.length - 1]).toBe(feed);
    expect(feedState.lastProps).toMatchObject({ layout: 'mediaFirst', hideFilter: true });
  });
  it('team with post permission sees the Post pill on the page', async () => {
    membership = { role: 'owner', canManage: true };
    const { container } = nonClub();
    await waitFor(() => expect(container.querySelector('[data-club-feed-post]')).not.toBeNull());
  });
  it.each(['Retail / Pro Shop', 'Hotel', 'Coach / Instructor', 'Restaurant / Cafe', 'Brand / Manufacturer', 'Creator'])('no tablist or About tab for %s', async (category) => {
    team = [{ is_public: true }];
    const { container } = nonClub({ category });
    await waitFor(() => expect(container.querySelector('[data-club-feed]')).not.toBeNull());
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab', { name: 'About' })).toBeNull();
    expect(container.querySelector('[data-business-tabs]')).toBeNull();
  });
  it('hero Posts figure scrolls to the section', async () => {
    postsCount = 3;
    const { container } = nonClub({ category: 'Creator' });
    await waitFor(() => expect(container.querySelector('[data-cell="posts"]')).not.toBeNull());
    const spy = vi.spyOn(document, 'querySelector');
    fireEvent.click(container.querySelector('[data-cell="posts"]')!);
    expect(spy).toHaveBeenCalledWith('[data-club-feed]');
  });
});

describe('CB119 club page unchanged', () => {
  it('From the club, its empty sentence and last position after Visiting', async () => {
    const { container } = page();
    await waitFor(() => expect(container.querySelector('[data-club-feed]')).not.toBeNull());
    const feed = container.querySelector('[data-club-feed]')!;
    expect(feed.getAttribute('aria-label')).toBe('From the club');
    expect(document.querySelector('[data-club-feed-empty]')?.textContent).toMatch(/^Test.* hasn't posted yet\. Follow to see the first one in your Clubhouse feed\.$/);
    expect(feed.compareDocumentPosition(container.querySelector('[data-club-visiting]')!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});

describe('CB119 skeleton', () => {
  it('business skeleton (tabs 0) renders no tab row; personal default keeps 3', () => {
    const a = render(<ProfileSurfaceSkeleton headline counters={4} tabs={0} />);
    const bizCount = a.container.querySelectorAll('[data-skeleton-tabs]').length;
    a.unmount();
    const b = render(<ProfileSurfaceSkeleton headline counters={4} />);
    expect(bizCount).toBe(0);
    expect(b.container.querySelectorAll('[data-skeleton-tabs] > *').length).toBe(3);
  });
});
