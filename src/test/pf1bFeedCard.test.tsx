// PF1B — the feed card's hole chip (first slide only) and attached-round row,
// and the unchanged card when a post has no golf context.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostGolfContext } from '@/hooks/feed/usePostGolfContext';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

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
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
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

const IMG = { id: 'm1', type: 'image' as const, imageUrl: 'https://x/1.jpg', thumbnailUrl: 'https://x/1.jpg' };
const IMG2 = { id: 'm2', type: 'image' as const, imageUrl: 'https://x/2.jpg', thumbnailUrl: 'https://x/2.jpg' };

const POST: FeedPost = {
  id: 'p1',
  userId: 'u2',
  actorType: 'personal',
  actorId: 'u2',
  username: 'ben',
  displayName: 'Ben',
  avatarUrl: '',
  isVerified: false,
  creatorRelation: 'none',
  caption: 'The 15th, here at Machrihanish',
  mediaItems: [IMG],
  createdAt: '2026-11-06T00:00:00Z',
  likeCount: 3,
  commentCount: 0,
  shareCount: 0,
  review: null,
  isReview: false,
  isLikedByMe: false,
  isFollowedByMe: false,
};

const CONTEXT: PostGolfContext = {
  postId: 'p1',
  courseId: 'c1',
  holeNo: 15,
  shotTags: ['view'],
  roundScoreId: 'sc1',
  roundGross: 73,
  roundPar: 71,
  roundPlayDate: '2026-11-06',
  roundHoles: 18,
};

const SHAPE: HoleShape = {
  coursePar: 71,
  series: [0],
  beads: [],
  played: 18,
  birdies: 1,
  holes: Array.from({ length: 18 }, (_, i) => ({
    holeNo: i + 1,
    par: i === 14 ? 3 : 4,
    strokes: i === 14 ? 2 : 4,
    sheetStrokes: i === 14 ? 2 : 4,
  })),
};

const renderCard = (overrides: Partial<React.ComponentProps<typeof FeedCard>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FeedCard
        post={POST}
        liked={false}
        likeCount={POST.likeCount}
        commentCount={0}
        onLike={() => {}}
        onComment={() => {}}
        onShare={() => {}}
        onOpenMedia={() => {}}
        onProfile={() => {}}
        {...overrides}
      />
    </QueryClientProvider>,
  );

describe('PF1B feed card golf context', () => {
  it('shows the hole chip on the first media slide with par and yards', () => {
    renderCard({ golfContext: CONTEXT, golfHole: { hole_no: 15, par: 3, si: 7, yards: 166 } });
    const chip = screen.getByTestId('post-hole-chip');
    expect(chip.textContent).toBe('15TH· PAR 3 · 166 YDS');
  });

  it('shows "{NTH}" alone when the course carries no hole data', () => {
    renderCard({ golfContext: CONTEXT, golfHole: null });
    expect(screen.getByTestId('post-hole-chip').textContent).toBe('15TH');
  });

  it('hides the chip on a later carousel slide', () => {
    renderCard({
      post: { ...POST, mediaItems: [IMG, IMG2] },
      initialMediaIndex: 1,
      golfContext: CONTEXT,
      golfHole: { hole_no: 15, par: 3, si: 7, yards: 166 },
    });
    expect(screen.queryByTestId('post-hole-chip')).toBeNull();
  });

  it('shows the chip on a multi-media post while on the first slide', () => {
    renderCard({
      post: { ...POST, mediaItems: [IMG, IMG2] },
      initialMediaIndex: 0,
      golfContext: CONTEXT,
      golfHole: null,
    });
    expect(screen.getByTestId('post-hole-chip').textContent).toBe('15TH');
  });

  it('renders no chip when the post has no hole', () => {
    renderCard({ golfContext: { ...CONTEXT, holeNo: null } });
    expect(screen.queryByTestId('post-hole-chip')).toBeNull();
  });

  it('renders the round row between media and actions, opening the scorecard only', () => {
    const onGolfRoundTap = vi.fn();
    const onOpenMedia = vi.fn();
    renderCard({ layout: 'mediaFirst', golfContext: CONTEXT, golfRoundShape: SHAPE, onGolfRoundTap, onOpenMedia });
    const row = screen.getByTestId('post-round-row');
    expect(row.textContent).toContain('73');
    expect(row.textContent).toContain('+2');
    expect(screen.getByTestId('post-round-strip').children).toHaveLength(18);
    // Between the media section and the footer.
    const media = row.parentElement?.querySelector('[data-feed-section="media"]');
    const footer = row.parentElement?.querySelector('[data-feed-section="footer"]');
    expect(media && row.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(footer && row.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(row);
    expect(onGolfRoundTap).toHaveBeenCalledWith(POST, 'sc1');
    expect(onOpenMedia).not.toHaveBeenCalled();
  });

  it('never renders the shot tags on the card', () => {
    renderCard({ golfContext: CONTEXT, golfRoundShape: SHAPE, onGolfRoundTap: () => {} });
    expect(screen.queryByText('The view')).toBeNull();
    expect(screen.queryByText('view')).toBeNull();
  });

  it('renders a post with no context exactly as before', () => {
    const { container } = renderCard();
    expect(screen.queryByTestId('post-hole-chip')).toBeNull();
    expect(screen.queryByTestId('post-round-row')).toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });
});
