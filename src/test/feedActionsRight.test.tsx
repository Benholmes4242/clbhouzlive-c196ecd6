import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
vi.mock('@/components/likes/LikedByRow', () => ({
  LikedByRow: () => <div data-testid="liked-by-row" />,
}));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/ReviewPostCard', () => ({ ReviewPostCard: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';

const POST: FeedPost = {
  id: 'p1',
  userId: 'u1',
  actorType: 'personal',
  actorId: 'u1',
  username: 'ben',
  displayName: 'Ben',
  avatarUrl: '',
  isVerified: false,
  creatorRelation: 'none',
  caption: '',
  mediaItems: [],
  createdAt: '2026-10-20T00:00:00Z',
  likeCount: 3,
  commentCount: 2,
  shareCount: 0,
  review: null,
  isReview: false,
  isLikedByMe: false,
  isFollowedByMe: false,
};

const renderCard = (overrides: Partial<React.ComponentProps<typeof FeedCard>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FeedCard
        post={POST}
        liked={false}
        likeCount={POST.likeCount}
        commentCount={POST.commentCount}
        onLike={() => {}}
        onComment={() => {}}
        onShare={() => {}}
        onOpenMedia={() => {}}
        onProfile={() => {}}
        {...overrides}
      />
    </QueryClientProvider>,
  );

/** The action row is the flex parent of the share button (aria-label "Send"). */
const actionRow = () => {
  const share = screen.getByRole('button', { name: 'Send' });
  const row = share.parentElement;
  if (!row) throw new Error('share button has no parent row');
  return row;
};

describe('feed footer actions right (BRIEF_FEED_ACTIONS_RIGHT)', () => {
  beforeEach(() => {
    pickerState.renderNull = false;
  });

  it('orders the row actor picker, auto-margin spacer, then like, comment, share', () => {
    renderCard();
    const row = actionRow();
    const children = Array.from(row.children);

    expect(children[0]).toBe(screen.getByTestId('actor-picker'));

    const spacer = children[1] as HTMLElement;
    expect(spacer.tagName).toBe('DIV');
    expect(spacer.style.marginLeft).toBe('auto');

    // The three action buttons follow the spacer; share is the last one.
    const buttons = children.slice(2);
    expect(buttons).toHaveLength(3);
    for (const el of buttons) expect(el.tagName).toBe('BUTTON');
    expect(buttons[2]).toBe(screen.getByRole('button', { name: 'Send' }));
  });

  it('keeps the auto-margin spacer ahead of the like button when the picker renders nothing', () => {
    pickerState.renderNull = true;
    renderCard();
    expect(screen.queryByTestId('actor-picker')).toBeNull();

    const row = actionRow();
    const first = row.children[0] as HTMLElement;
    expect(first.tagName).toBe('DIV');
    expect(first.style.marginLeft).toBe('auto');
    // Like button is the first button after the spacer.
    expect((row.children[1] as HTMLElement).tagName).toBe('BUTTON');
  });

  it('still renders the Liked by row below the action row', () => {
    renderCard();
    const row = actionRow();
    const likedBy = screen.getByTestId('liked-by-row');
    expect(row.compareDocumentPosition(likedBy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
