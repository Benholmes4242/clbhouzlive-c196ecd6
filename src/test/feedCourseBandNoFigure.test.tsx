// FEED: the course band under a normal post states where it was and links to
// the course — nothing else. No rounds-tracked figure, no chevron, no stats
// sheet, even when the batched course context has rounds and a viewer best.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

const navigateMock = vi.fn();

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
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
// A marker, so the test can prove the sheet never mounts.
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => <div data-testid="course-stats-sheet" /> }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';
import { analyticsEvents } from '@/utils/analyticsEvents';

const IMG = { id: 'm1', type: 'image' as const, imageUrl: 'https://x/1.jpg', thumbnailUrl: 'https://x/1.jpg', width: 1080, height: 1350 };

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
  courseId: 'c1',
  courseName: 'Sunningdale',
  courseRegion: 'Berkshire',
  courseCountry: 'England',
};

const COURSE_CONTEXT: PostCourseContext = {
  course_id: 'c1',
  rounds_tracked: 977,
  your_rounds: 2,
  your_best: 68,
  community_rating: 9.3,
} as PostCourseContext;

const renderCard = () =>
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
        courseContext={COURSE_CONTEXT}
      />
    </QueryClientProvider>,
  );

describe('feed course band: no figure, no stats sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders no figure and no stats-sheet chevron even with rounds and a best in context', () => {
    const { container } = renderCard();
    const band = screen.getByRole('link', { name: /Sunningdale/ }).closest('div')!.parentElement!.parentElement!;
    expect(band.textContent).toContain('Berkshire, England');
    expect(band.textContent).not.toContain('977');
    expect(band.textContent).not.toContain('68');
    // The band is not a tap target: no button, only the course-name link.
    expect(band.querySelector('button')).toBeNull();
    expect(container.querySelector('[data-testid="course-stats-sheet"]')).toBeNull();
  });

  it('tapping the band opens nothing; the course name still navigates with surface post', () => {
    const { container } = renderCard();
    const nameLink = screen.getByRole('link', { name: /Sunningdale/ });
    const band = nameLink.closest('div')!.parentElement!.parentElement!;
    fireEvent.click(band);
    expect(container.querySelector('[data-testid="course-stats-sheet"]')).toBeNull();
    expect(analyticsEvents.track).not.toHaveBeenCalledWith('course_band_tapped', expect.anything());

    fireEvent.click(nameLink);
    expect(navigateMock).toHaveBeenCalledWith('/courses/c1');
    expect(analyticsEvents.track).toHaveBeenCalledWith('course_name_tapped', { course_id: null, surface: 'post' });
  });
});
