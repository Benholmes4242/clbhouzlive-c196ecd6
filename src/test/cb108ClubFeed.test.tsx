/** CB108 From the club: FeedCard mediaFirst layout, club feed section, tabs removed. */
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
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: null }) }));
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
vi.mock('@/components/business/BusinessProfileInfo', () => ({ BusinessProfileInfo: () => <div data-about-content /> }));
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
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => [], useTeamBusinessIds: () => [] }));
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
import { FeedCard } from '@/components/feed/FeedCard';
import { ClubFromTheClub } from '@/components/business/ClubFromTheClub';
import { ClubVisiting } from '@/components/business/ClubVisiting';

const POST: FeedPost = {
  id: 'p1', userId: 'u9', actorType: 'business', actorId: 'b1', username: 'club', displayName: 'Sundridge Park Golf Club',
  avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: 'Greens are full', mediaItems: [],
  createdAt: '2026-10-20T00:00:00Z', likeCount: 3, commentCount: 2, shareCount: 0, review: null, isReview: false,
  isLikedByMe: false, isFollowedByMe: false,
};
const IMG = [{ id: 'm1', type: 'image', url: 'https://x.test/a.jpg', imageUrl: 'https://x.test/a.jpg', width: 4, height: 5 }] as unknown as FeedPost['mediaItems'];
const commentPreview = { id: 'c1', content: 'Nice', recent: [{ id: 'c1', content: 'Nice' }] } as never;

function card(over: Partial<React.ComponentProps<typeof FeedCard>> = {}) {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <FeedCard post={POST} liked={false} likeCount={3} commentCount={2} onLike={() => {}} onComment={() => {}} onShare={() => {}}
      onOpenMedia={() => {}} onProfile={() => {}} commentPreviewEnabled commentPreview={commentPreview} {...over} />
  </MemoryRouter></QueryClientProvider>);
}
/** Document order of the marked parts that are present. */
function order(): string[] {
  const marks: Array<[string, Element | null]> = [
    ['caption', screen.queryByText('Greens are full', { exact: false })],
    ['media', document.querySelector('img')],
    ['actions', screen.queryByRole('button', { name: 'Send' })],
    ['likedBy', screen.queryByTestId('liked-by-row')],
    ['comments', screen.queryByTestId('comment-preview')],
    ['addComment', document.querySelector('[data-feed-section="add-comment"]')],
  ];
  return marks.filter(([, el]) => !!el)
    .sort(([, a], [, b]) => (a!.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map(([k]) => k);
}
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
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: null, error: null }); team = []; postsCount = 0; feedState.empty = true; feedState.lastProps = null; });
afterEach(() => { cleanup(); pageState.business = null; pageState.courses = []; });

describe('CB108 FeedCard layout', () => {
  it("'standard' order is unchanged: caption, media, actions, liked-by, comments; no add-comment row", () => {
    card({ post: { ...POST, mediaItems: IMG }, currentUserId: 'u1' });
    expect(order()).toEqual(['caption', 'media', 'actions', 'likedBy', 'comments']);
  });
  it("'mediaFirst' with media: media, actions, liked-by, name-led caption, comments, add-a-comment", () => {
    card({ post: { ...POST, mediaItems: IMG }, currentUserId: 'u1', layout: 'mediaFirst' });
    expect(order()).toEqual(['media', 'actions', 'likedBy', 'caption', 'comments', 'addComment']);
    expect(document.querySelector('[data-caption-lead]')?.textContent).toBe('Sundridge Park');
  });
  it("'mediaFirst' text-only: caption body at 15.5px without a lead, then actions", () => {
    card({ currentUserId: 'u1', layout: 'mediaFirst' });
    expect(order()).toEqual(['caption', 'actions', 'likedBy', 'comments', 'addComment']);
    expect(document.querySelector('[data-caption-lead]')).toBeNull();
    const body = screen.getByText('Greens are full').closest('div') as HTMLElement;
    expect(body.style.fontSize).toBe('15.5px');
    expect(body.style.lineHeight).toBe('1.5');
  });
  it('Add a comment row is signed-in only and opens comments with add_comment_row', () => {
    const onComment = vi.fn();
    const { unmount } = card({ layout: 'mediaFirst', onComment });
    expect(document.querySelector('[data-feed-section="add-comment"]')).toBeNull();
    unmount();
    card({ layout: 'mediaFirst', onComment, currentUserId: 'u1' });
    fireEvent.click(document.querySelector('[data-feed-section="add-comment"]')!);
    expect(onComment).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), null, 'add_comment_row');
  });
  it('double-tap on the media still likes in mediaFirst', async () => {
    const onLike = vi.fn();
    card({ post: { ...POST, mediaItems: IMG }, layout: 'mediaFirst', onLike, currentUserId: 'u1' });
    const btn = document.querySelector('img')!.closest('button')!;
    fireEvent.click(btn); fireEvent.click(btn);
    await waitFor(() => expect(onLike).toHaveBeenCalledTimes(1));
  });
});

describe('CB108 From the club section', () => {
  const section = (p: Partial<React.ComponentProps<typeof ClubFromTheClub>> = {}) =>
    render(<ClubFromTheClub businessId="b1" businessName="Sundridge Park Golf Club" isOwner={false} {...p} />);
  it('heading count: plural, singular, hidden at 0 and unknown', () => {
    const { rerender } = section({ postsCount: 24 });
    expect(document.querySelector('[data-club-feed-count]')?.textContent).toBe('24 posts');
    rerender(<ClubFromTheClub businessId="b1" businessName="X" isOwner={false} postsCount={1} />);
    expect(document.querySelector('[data-club-feed-count]')?.textContent).toBe('1 post');
    rerender(<ClubFromTheClub businessId="b1" businessName="X" isOwner={false} postsCount={0} />);
    expect(document.querySelector('[data-club-feed-count]')).toBeNull();
    rerender(<ClubFromTheClub businessId="b1" businessName="X" isOwner={false} postsCount={null} />);
    expect(document.querySelector('[data-club-feed-count]')).toBeNull();
  });
  it('posts render mediaFirst with no filter chip', () => {
    section();
    expect(feedState.lastProps).toMatchObject({ layout: 'mediaFirst', hideFilter: true, actorType: 'business', actorId: 'b1' });
  });
  it('visitor empty state names the club and shows no Post pill', () => {
    section();
    expect(document.querySelector('[data-club-feed-empty]')?.textContent).toContain("Sundridge Park hasn't posted yet.");
    expect(document.querySelector('[data-club-feed-post]')).toBeNull();
  });
  it('team empty state shows the Post pill that opens the studio', () => {
    const onPost = vi.fn();
    section({ onPost });
    expect(document.querySelector('[data-club-feed-empty]')?.textContent).toContain('Your first post shows here');
    fireEvent.click(document.querySelector('[data-club-feed-post]')!);
    expect(onPost).toHaveBeenCalledTimes(1);
  });
});

describe('CB108 club page tabs', () => {
  it('a club has no tab bar; From the club is last and follows Visiting', async () => {
    const { container } = page();
    await waitFor(() => expect(container.querySelector('[data-club-feed]')).toBeTruthy());
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    const visiting = container.querySelector('[data-club-visiting]')!;
    expect(visiting.compareDocumentPosition(container.querySelector('[data-club-feed]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('Meet the team shows only with a public team and opens BusinessTeamTab in a sheet', () => {
    const { rerender } = render(<ClubVisiting business={fixture()} publicTeamCount={0} />);
    expect(document.querySelector('[data-visiting-row="team"]')).toBeNull();
    rerender(<ClubVisiting business={fixture({ amenities: ['Bar'] })} publicTeamCount={3} />);
    const row = document.querySelector('[data-visiting-row="team"]')!;
    expect(row.querySelector('i')?.textContent).toBe('3 people at the club');
    expect(row.compareDocumentPosition(document.querySelector('.club-visiting-amenities')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(row);
    expect(document.querySelector('[data-team-tab="b1"]')).toBeTruthy();
    rerender(<ClubVisiting business={fixture()} publicTeamCount={1} />);
    expect(document.querySelector('[data-visiting-row="team"] i')?.textContent).toBe('1 person at the club');
  });
  it('a non-club profile keeps its tabs', async () => {
    team = [{ is_public: true }];
    page({ club_id: null });
    await waitFor(() => expect(screen.getAllByRole('tab').map((e) => e.textContent)).toEqual(['Posts', 'About', 'Team']));
    expect(document.querySelector('[data-club-feed]')).toBeNull();
  });
});
