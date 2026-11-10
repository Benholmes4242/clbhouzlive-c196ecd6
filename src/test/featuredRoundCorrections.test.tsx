import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import type { ConsequenceSources } from '@/features/explore-magazine/consequences';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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



vi.mock('@/features/explore-magazine/useFeaturedRound', () => ({
  useFeaturedRound: () => ({ data: featured }),
  useFeaturedRoundNet: () => ({ data: null }),
}));
vi.mock('@/features/explore-magazine/useViewerScoreScope', () => ({ useViewerScoreScope: () => ({ scope: {} }) }));
vi.mock('@/features/explore-magazine/useBatchRoundMedals', () => ({ useBatchRoundMedals: () => ({ isSuccess: false }) }));
vi.mock('@/features/explore-magazine/useBatchRoundCompetition', () => ({ useBatchRoundCompetition: () => ({ isSuccess: false }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => new Map() }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({ useScorecardOpener: () => ({ target: null, close: vi.fn(), openByScore: vi.fn() }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ unavailable: true }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ engagementFor: () => ({ commentCount: 0 }) }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ isPending: false, mutate: vi.fn() }) }));

import { FeedCard } from '@/components/feed/FeedCard';
import { HomeRail } from '@/components/feed/HomeRail';
import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import { featuredRoundFrom } from '@/components/feed/featuredRoundTrigger';

const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { courses } }, initAsync: false });
afterEach(cleanup);

const post: FeedPost = {
  id: 'post', userId: 'author', actorType: 'personal', actorId: 'author',
  username: 'author', displayName: 'Danny Akers', avatarUrl: '', isVerified: false,
  creatorRelation: 'none', caption: '', mediaItems: [], createdAt: '2026-11-04T00:00:00Z',
  likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false,
  isLikedByMe: false, isFollowedByMe: false, courseId: 'course', courseName: 'Woburn Golf Club',
};
const round: PostRound = {
  whsScoreId: 'score', totalHoles: 18, grossScore: 68, netScore: null, courseHandicap: null,
  coursePar: 72, deltaIndex: null, playDate: '2026-11-04', birdies: 4, eagles: 0,
  albatrosses: 0, holesInOne: 0, beatPar: true, cleanCard: false, slopeRating: null,
  longestBirdieRun: 1, holeShape: null,
};
const featured = featuredRoundFrom(post, round, { tier: 2, reason: 'course_record' }, null);
const sources: ConsequenceSources = {
  standing: new Map(), bests: new Map(), shortlist: new Set(),
  records: { holders: new Map([['course', {
    course_id: 'course', user_id: 'author', value: 68, runner_up_value: 70, attained_on: '2026-11-04',
  }]]), lostToViewer: new Set(), isFetched: true },
};
function mount(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <I18nextProvider i18n={i18n}><MemoryRouter>{node}</MemoryRouter></I18nextProvider>
  </QueryClientProvider>);
}

describe('gold featured round corrections', () => {
  it('course_record feed hero labels itself Featured, never Round of the week', () => {
    const decisions = new Map();
    const card = mount(<FeedCard post={post} postRound={round} consequenceSources={sources}
      featuredDecisions={decisions} weekPickScoreId={null} currentUserId="viewer"
      liked={false} likeCount={0} commentCount={0} onLike={vi.fn()} onComment={vi.fn()}
      onShare={vi.fn()} onOpenMedia={vi.fn()} onProfile={vi.fn()} />);
    expect(decisions.get('post')).toEqual({ tier: 2, reason: 'course_record' });
    const hero = card.container.querySelector('[data-featured-champ]');
    expect(hero).not.toBeNull();
    if (!(hero instanceof HTMLElement)) throw new Error('Missing featured header');
    expect(within(hero).getByText('Featured')).toBeInTheDocument();
    expect(within(hero).queryByText('Round of the week')).toBeNull();
  });

  it('HomeRail week pick still labels itself Round of the week', () => {
    const card = mount(<HomeRail kind="featuredRound" viewerId="viewer" pos={0} />);
    const hero = card.container.querySelector('[data-featured-champ]');
    expect(hero).not.toBeNull();
    if (!(hero instanceof HTMLElement)) throw new Error('Missing week-pick header');
    expect(within(hero).getByText('Round of the week')).toBeInTheDocument();
    expect(within(hero).queryByText('Featured')).toBeNull();
  });

  it('date text uses A.MUTE, never the A.SOFT hairline colour', () => {
    const card = mount(<FeaturedRoundCard round={featured} onOpen={vi.fn()} />);
    const date = card.container.querySelector('[data-featured-date-line] > span:first-child');
    expect(date).not.toBeNull();
    const normalized = document.createElement('span');
    normalized.style.color = A.MUTE;
    expect(date).toHaveStyle({ color: normalized.style.color });
    normalized.style.color = A.SOFT;
    expect(date).not.toHaveStyle({ color: normalized.style.color });
  });
});
