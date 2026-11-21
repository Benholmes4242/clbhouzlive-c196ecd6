import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '@/locales/en/courses.json';
import common from '@/locales/en/common.json';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import type { ConsequenceSources } from '@/features/explore-magazine/consequences';

const reads = vi.hoisted(() => ({ subject: null as string | null, source: null as string | null }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'viewer', type: 'personal', name: 'Ben', avatarUrl: null }, availableActors: [{ id: 'viewer', type: 'personal', name: 'Ben', avatarUrl: null }], setActiveActor: vi.fn() }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => [], useTeamBusinessIds: () => [] }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/ReviewPostCard', () => ({ ReviewPostCard: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));
vi.mock('@/hooks/usePostLikers', async importOriginal => ({
  ...(await importOriginal<typeof import('@/hooks/usePostLikers')>()),
  usePostLikers: (subject: string, _enabled: boolean, source: string) => {
    reads.subject = subject; reads.source = source;
    return { isLoading: false, likers: [{ userId: 'viewer', actorId: 'viewer', displayName: 'Benjamin Holmes', avatarUrl: null, isViewer: true }, { userId: 'danny', actorId: 'danny', displayName: 'Danny Akers', avatarUrl: null, isViewer: false }] };
  },
}));
vi.mock('@/features/explore-magazine/useFeaturedRound', () => ({ useFeaturedRound: () => ({ data: featured }), useFeaturedRoundNet: () => ({ data: { netScore: 69, courseHandicap: 5 } }) }));
vi.mock('@/features/explore-magazine/useViewerScoreScope', () => ({ useViewerScoreScope: () => ({ scope: {} }) }));
vi.mock('@/features/explore-magazine/useBatchRoundMedals', () => ({ useBatchRoundMedals: () => ({ isSuccess: true, medals: new Map([['score', { gold: 0, silver: 0, bronze: 3 }]]) }) }));
vi.mock('@/features/explore-magazine/useBatchRoundCompetition', () => ({ useBatchRoundCompetition: () => ({ isSuccess: false }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => new Map() }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({ useScorecardOpener: () => ({ target: null, close: vi.fn(), openByScore: vi.fn() }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ unavailable: false, viewerId: 'viewer', stateFor: () => ({ count: 2, mine: true }), toggle: vi.fn() }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ engagementFor: () => ({ commentCount: 1 }) }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ isPending: false, mutate: vi.fn() }) }));

import { FeedCard } from '@/components/feed/FeedCard';
import { HomeRail } from '@/components/feed/HomeRail';
import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import { featuredRoundFrom } from '@/components/feed/featuredRoundTrigger';

const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { courses, common } }, initAsync: false });
afterEach(() => { cleanup(); reads.subject = null; reads.source = null; });
const post: FeedPost = { id: 'post', userId: 'author', actorType: 'personal', actorId: 'author', username: 'author', displayName: 'Thomas Holmes', avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', mediaItems: [], createdAt: '2026-11-20T00:00:00Z', likeCount: 2, commentCount: 1, shareCount: 0, review: null, isReview: false, isLikedByMe: true, isFollowedByMe: false, courseId: 'course', courseName: 'Woking Golf Club' };
const round: PostRound = { whsScoreId: 'score', totalHoles: 18, grossScore: 74, netScore: 69, courseHandicap: 5, coursePar: 70, deltaIndex: null, playDate: '2026-11-20', birdies: 4, eagles: 0, albatrosses: 0, holesInOne: 0, beatPar: false, cleanCard: false, slopeRating: null, longestBirdieRun: 1, holeShape: null };
const featured = featuredRoundFrom(post, round, { tier: 2, reason: 'course_record' }, null);
const sources: ConsequenceSources = { standing: new Map(), bests: new Map(), shortlist: new Set(), records: { holders: new Map([['course', { course_id: 'course', user_id: 'author', value: 74, runner_up_value: 76, attained_on: '2026-11-20' }]]), lostToViewer: new Set(), isFetched: true } };
const medals = { gold: 0, silver: 0, bronze: 3 };
function mount(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><I18nextProvider i18n={i18n}><MemoryRouter>{node}</MemoryRouter></I18nextProvider></QueryClientProvider>);
}
const card = (patch = {}) => <FeaturedRoundCard round={{ ...featured, ...patch }} pillLabel="Featured" viewerId="viewer" medals={medals} onOpen={vi.fn()} />;

describe('Featured round Option B', () => {
  it('(a) course record kicker and gold gross fourth cell replace AWARDS', () => {
    const v = mount(card());
    expect(v.container.querySelector('[data-featured-kicker]')?.textContent).toBe('Featured · Course record');
    const cell = v.container.querySelector('[data-round-score-feat]');
    if (!(cell instanceof HTMLElement)) throw new Error('Missing feat cell');
    expect(cell.textContent).toBe('74Record');
    // jsdom cannot resolve CSS-variable colours; verify the owned paint rule,
    // then verify the actual colour in the requested Chromium captures.
    expect(readFileSync('src/components/feed/ScorePostBody.tsx', 'utf8')).toContain("color: 'var(--featured-round-gold)'");
    expect(v.container.querySelector('[data-round-score-awards]')).toBeNull();
    expect(v.container.querySelector('[data-featured-feat-figure]')).toBeNull();
  });
  it('(b) birdie-run kicker keeps AWARDS', () => {
    const v = mount(card({ tier: 3, reason: 'birdie_run', birdie_run: 6 }));
    expect(v.container.querySelector('[data-featured-kicker]')?.textContent).toBe('Featured · 6 birdies in a row');
    expect(v.container.querySelector('[data-round-score-awards]')).not.toBeNull();
    expect(v.container.querySelector('[data-round-score-feat]')).toBeNull();
  });
  it('(c) Home rail keeps Round of the week and its own like/comment row', () => {
    const v = mount(<HomeRail kind="featuredRound" viewerId="viewer" pos={0} />);
    expect(v.container.querySelector('[data-featured-kicker]')?.textContent).toBe('Round of the week · Course record');
    expect(v.container.querySelector('[data-featured-engagement]')).not.toBeNull();
    expect(v.getByRole('button', { name: 'Comments, 1' })).toBeInTheDocument();
    expect(v.container.querySelector('[data-feed-footer]')).toBeNull();
  });
  it('(d) Home feed carries played-with, the round celebrated line and the shared footer', () => {
    const onRoundTap = vi.fn();
    const v = mount(<FeedCard post={post} postRound={round} consequenceSources={sources} featuredDecisions={new Map()} weekPickScoreId={null} currentUserId="viewer" roundMedals={medals} playedWith={[{ userId: 'ben', name: 'Benjamin' }, { userId: 'mike', name: 'mikem84' }, { userId: 'danny', name: 'Danny' }]} liked likeCount={2} commentCount={1} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onOpenMedia={vi.fn()} onProfile={vi.fn()} onRoundTap={onRoundTap} />);
    const byline = v.getByTestId('played-with-byline');
    expect(byline.textContent).toBe('with Benjamin, mikem84 and Danny');
    expect(v.getByTestId('played-with-name-faces')).toBeInTheDocument();
    expect(v.getByText('You and Danny celebrated this round')).toBeInTheDocument();
    expect(reads.subject).toBe('score'); expect(reads.source).toBe('round');
    expect(v.container.querySelector('[data-feed-footer]')).not.toBeNull();
    expect(v.container.querySelector('[data-featured-engagement]')).toBeNull();
    expect(v.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(v.container.querySelector('[data-feed-section="add-comment"]')).not.toBeNull();
    const opener = within(byline).getByRole('button'); fireEvent.click(opener);
    expect(v.getByTestId('played-with-sheet')).toBeInTheDocument();
    expect(onRoundTap).not.toHaveBeenCalled();
  });
  it('(e) no element in the featured card uses font-weight 800', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const rule = css.match(/\[data-featured-card\] \[data-featured-competition\] > span\s*\{[^}]+\}/)?.[0];
    if (!rule) throw new Error('Missing local featured competition weight rule');
    // jsdom prioritises inline declarations even over stylesheet !important.
    // Verify the scoped override here; Chromium checks every resolved weight.
    expect(rule).toContain('font-weight: 700 !important');
    const v = mount(<FeaturedRoundCard round={featured} pillLabel="Featured" viewerId="viewer" medals={medals} isCompetition onOpen={vi.fn()} />);
    const root = v.container.querySelector('[data-featured-card]');
    if (!root) throw new Error('Missing featured card');
    expect(root.querySelector('[data-featured-competition]')).not.toBeNull();
    const weights = [...root.querySelectorAll<HTMLElement>('*')].filter(el => !el.closest('[data-featured-competition]')).map(el => getComputedStyle(el).fontWeight);
    expect(weights).not.toContain('800');
    expect(root.querySelector('[data-featured-kicker]')).not.toBeNull();
  });
});