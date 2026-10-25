import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';

/* Controllable actor-picker stand-in: renders a marker, or nothing for a
   member with no business profile (the spacer must still right-align the
   action group). */
const pickerState = vi.hoisted(() => ({ renderNull: false }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/context/ActiveActorContext', () => ({
  useActiveActor: () => ({
    activeActor: { id: 'u1', type: 'personal', name: 'Ben', avatarUrl: null },
    availableActors: [{ id: 'u1', type: 'personal', name: 'Ben', avatarUrl: null }],
    setActiveActor: vi.fn(),
  }),
}));
vi.mock('@/store/clubhouseStore', () => ({
  useClubhouseStore: (sel: (s: unknown) => unknown) =>
    sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }),
}));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => [], useTeamBusinessIds: () => [] }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } }));
vi.mock('@/components/feed/FeedActorPicker', () => ({
  FeedActorPicker: () => (pickerState.renderNull ? null : <div data-testid="actor-picker" />),
}));
vi.mock('@/hooks/usePostLikers', () => ({
  usePostLikers: () => ({ likers: [], isLoading: true }),
  likerFirstNames: () => [],
}));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';
import { LikedByRow } from '@/components/likes/LikedByRow';

afterEach(cleanup);

const BASE: FeedPost = {
  id: 'p1', userId: 'u1', actorType: 'personal', actorId: 'u1', username: 'ben', displayName: 'Ben',
  avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', mediaItems: [],
  createdAt: '2026-10-20T00:00:00Z', likeCount: 0, commentCount: 0, shareCount: 0,
  review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false,
};
const REVIEW: FeedPost = { ...BASE, id: 'r1', isReview: true, review: { rating: 8, courseId: 'c1', courseName: 'Course' } as FeedPost['review'] };

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const card = (post: FeedPost, likeCount: number) => (
  <QueryClientProvider client={client()}>
    <FeedCard post={post} liked={likeCount > 0} likeCount={likeCount} commentCount={0}
      onLike={() => {}} onComment={() => {}} onShare={() => {}} onOpenMedia={() => {}} onProfile={() => {}} />
  </QueryClientProvider>
);

/** The liked-by slot: reserved box at zero, populated button otherwise. */
const slot = (root: HTMLElement) => {
  const share = root.querySelector('button[aria-label="Send"]')!;
  const row = share.parentElement!;
  const el = row.nextElementSibling as HTMLElement | null;
  return { row, el };
};
/** Everything that decides the footer's height in jsdom (no layout engine). */
const geometry = (root: HTMLElement) => {
  const { row, el } = slot(root);
  return { rowPadding: row.style.padding, slotPresent: !!el, slotPadding: el?.style.padding, slotMargin: el?.style.margin, slotMinHeight: el?.style.minHeight, slotDisplay: el?.style.display };
};

describe('CB56 LikedByRow reserve', () => {
  it('reserve at count 0 renders a box with the populated row style and minHeight', () => {
    const style = { padding: '0 20px 12px', marginTop: 3 };
    const empty = render(<LikedByRow postId="p1" count={0} reserve style={style} />);
    const box = empty.container.firstElementChild as HTMLElement;
    const full = render(<LikedByRow postId="p1" count={1} reserve style={style} />);
    const btn = full.container.querySelector('button') as HTMLElement;
    for (const k of ['display', 'alignItems', 'minHeight', 'padding', 'marginTop', 'boxSizing', 'width', 'gap'] as const) {
      expect(box.style[k]).toBe(btn.style[k]);
    }
    expect((box.firstElementChild as HTMLElement).style.fontSize).toBe((btn.lastElementChild as HTMLElement).style.fontSize);
  });

  it('without reserve, count 0 still renders nothing', () => {
    expect(render(<LikedByRow postId="p1" count={0} />).container.firstChild).toBeNull();
    expect(render(<LikedByRow postId={null} count={3} />).container.firstChild).toBeNull();
  });

  it('the reserved box is aria-hidden and not tappable', () => {
    const parent = vi.fn();
    const v = render(<div onClick={parent}><LikedByRow postId="p1" count={0} reserve /></div>);
    const box = v.container.querySelector('[data-liked-by-reserve]') as HTMLElement;
    expect(box.getAttribute('aria-hidden')).toBe('true');
    expect(box.style.pointerEvents).toBe('none');
    expect(v.container.querySelector('button')).toBeNull();
    expect(box.querySelector('button, a, [role="button"], [tabindex]')).toBeNull();
  });

  it.each([['standard', BASE], ['review', REVIEW]] as const)('the %s card footer keeps its geometry from 0 to 1 like', (_n, post) => {
    const v = render(card(post, 0));
    const before = geometry(v.container);
    expect(before.slotPresent).toBe(true);
    v.rerender(card(post, 1));
    expect(geometry(v.container)).toEqual(before);
    v.rerender(card(post, 0));
    expect(geometry(v.container)).toEqual(before);
  });
});
