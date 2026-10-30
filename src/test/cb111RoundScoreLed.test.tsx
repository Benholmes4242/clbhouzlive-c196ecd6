/** CB111 — round posts go score-led in FeedCard's mediaFirst layout and end
 *  like every other post. ExploreMagazine, FeaturedRoundCard, RecentRoundsCard
 *  and FeedCard's standard layout are unchanged. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';

const likedByProps = vi.hoisted(() => ({ last: null as Record<string, unknown> | null }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => <div data-actor-picker /> }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: (props: Record<string, unknown>) => { likedByProps.last = props; return <div data-liked-by />; } }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => <div data-comments /> }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const POST = {
  id: 'p1', userId: 'u9', actorType: 'personal', actorId: 'u9', displayName: 'Simon Savage', avatarUrl: '',
  createdAt: '2026-10-11T00:00:00Z', caption: '', isReview: false, mediaItems: [],
  courseId: 'c1', courseName: 'Sundridge Park Golf Club (West Course)', isFollowedByMe: true,
} as unknown as FeedPost;

/* The mock's own figures: gross 89 (+21 on par 68), net 81 (+13), handicap 8. */
const ROUND = {
  whsScoreId: 'score-1', totalHoles: 18, grossScore: 89, netScore: 81, courseHandicap: 8,
  coursePar: 68, deltaIndex: null, playDate: '2026-10-11', birdies: 1, eagles: 0,
  albatrosses: 0, holesInOne: 0, cleanCard: false, holeShape: null, whsCourseName: null,
} as unknown as PostRound;

const preview = { id: 'c1', content: 'Nice', recent: [{ id: 'c1', content: 'Nice' }] } as never;

function card(over: Partial<React.ComponentProps<typeof FeedCard>> = {}) {
  const handlers = { onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn(), onRoundTap: vi.fn() };
  const view = render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <FeedCard post={POST} liked={false} likeCount={2} commentCount={1}
      onLike={handlers.onLike} onComment={handlers.onComment} onShare={handlers.onShare}
      onOpenMedia={vi.fn()} onProfile={vi.fn()} onRoundTap={handlers.onRoundTap}
      layout="mediaFirst" currentUserId="viewer" commentPreviewEnabled commentPreview={preview}
      postRound={ROUND} {...over} />
  </MemoryRouter></QueryClientProvider>);
  return { ...view, handlers };
}

function order(container: HTMLElement, markers: string[]) {
  const present = markers.flatMap((selector) => {
    const el = container.querySelector(selector);
    return el ? [{ selector, el }] : [];
  });
  return present
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map(({ selector }) => selector);
}

afterEach(() => { cleanup(); likedByProps.last = null; });

describe('CB111 score-led round in the mediaFirst feed', () => {
  it('orders header, score block, course, chart, actions, celebrated line, comments, add-comment', () => {
    const { container } = card();
    expect(order(container, [
      '[data-round-author-row]',
      '[data-round-score-block]',
      '[data-feed-round-course]',
      '[data-round-photo-course]',
      '[data-actor-picker]',
      '[data-liked-by]',
      '[data-comments]',
      '[data-feed-section="add-comment"]',
    ])).toEqual([
      '[data-round-author-row]',
      '[data-round-score-block]',
      '[data-feed-round-course]',
      '[data-round-photo-course]',
      '[data-actor-picker]',
      '[data-liked-by]',
      '[data-comments]',
      '[data-feed-section="add-comment"]',
    ]);
  });

  it('prints the same gross, to-par, net and handicap figures, net big and gross before handicap on the right', () => {
    const { container } = card();
    expect(container.querySelector('[data-round-score-gross]')?.textContent).toBe('89+21');
    expect(container.querySelector('[data-round-score-net]')?.textContent).toBe('81+13');
    const hcp = container.querySelector('[data-round-score-handicap]') as HTMLElement;
    expect(hcp?.textContent).toBe('8');
    expect((hcp?.lastElementChild as HTMLElement)?.style.textTransform).toBe('uppercase');
    const block = container.querySelector('[data-round-score-block]') as HTMLElement;
    const [big, right] = [...block.children] as HTMLElement[];
    expect(big.contains(container.querySelector('[data-round-score-net]'))).toBe(true);
    expect((container.querySelector('[data-round-score-net]') as HTMLElement).style.fontSize).toBe('46px');
    expect([...right.children].map((c) => Object.keys((c as HTMLElement).dataset)[0])).toEqual(['roundScoreGross', 'roundScoreHandicap']);
    expect(container.querySelector('[data-feed-round-course]')?.textContent).toBe('Sundridge Park Golf Club (West Course)');
  });

  it('with no course handicap the big figure is gross and the right group has no gross cell', () => {
    const { container } = card({ postRound: { ...ROUND, courseHandicap: null } as PostRound });
    const block = container.querySelector('[data-round-score-block]') as HTMLElement;
    const [big, right] = [...block.children] as HTMLElement[];
    expect(container.querySelectorAll('[data-round-score-gross]')).toHaveLength(1);
    expect(big.querySelector('[data-round-score-gross]')?.textContent).toBe('89+21');
    expect(right.querySelector('[data-round-score-gross]')).toBeNull();
    expect(container.querySelector('[data-round-score-net]')).toBeNull();
  });

  it('renders no engagement row of the round card’s own — the shared footer is the only one', () => {
    const { container } = card();
    expect(container.querySelectorAll('[data-round-reactions]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-round-figures]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-feed-footer]')).toHaveLength(1);
  });

  it('keeps the like on the round’s reaction path and shows share', () => {
    const { container, handlers } = card();
    const footer = container.querySelector('[data-feed-footer]') as HTMLElement;
    const buttons = [...footer.querySelectorAll('button')];
    const tap = (el: Element) => { fireEvent.pointerDown(el, { pointerId: 1 }); fireEvent.pointerUp(el, { pointerId: 1 }); };
    tap(buttons[0]);
    expect(handlers.onLike).toHaveBeenCalledWith(POST, null);
    tap(buttons[2]);
    expect(handlers.onShare).toHaveBeenCalledWith(POST);
    expect(likedByProps.last).toMatchObject({ postId: 'score-1', source: 'round', kind: 'celebrate', isOwnRound: false });
    expect(likedByProps.last?.subject).toMatchObject({ kind: 'round', courseName: 'Sundridge Park Golf Club (West Course)', gross: 89, toPar: 21 });
  });

  it('opens the round on tap', () => {
    const { container, handlers } = card();
    fireEvent.click(container.querySelector('[data-round-score-led]') as HTMLElement);
    expect(handlers.onRoundTap).toHaveBeenCalledWith(POST, ROUND);
  });

  it('centres each figure over its label, with the net label under the value row in the same column', () => {
    const { container } = card();
    const netValue = container.querySelector('[data-round-score-net]') as HTMLElement;
    const netCell = netValue.parentElement as HTMLElement;
    expect(netCell.style.alignItems).toBe('center');
    expect(netCell.style.textAlign).toBe('center');
    expect(netValue.style.whiteSpace).toBe('nowrap');
    const netLabel = netCell.lastElementChild as HTMLElement;
    expect(netLabel).not.toBe(netValue);
    expect(netLabel.style.textTransform).toBe('uppercase');
    expect(netLabel.style.marginTop).toBe('6px');
    for (const key of ['gross', 'handicap']) {
      const cell = container.querySelector(`[data-round-score-${key}]`) as HTMLElement;
      expect(cell.style.textAlign).toBe('center');
      expect((cell.firstElementChild as HTMLElement).style.whiteSpace).toBe('nowrap');
      expect((cell.lastElementChild as HTMLElement).style.marginTop).toBe('5px');
    }
  });

  it('renders under-par to-par red and level or over-par muted, on gross and net', () => {
    const RED = 'rgb(226, 75, 63)';
    const MUTE = 'rgba(248, 250, 252, 0.62)';
    const under = card({ postRound: { ...ROUND, grossScore: 70, coursePar: 72, netScore: 68 } as PostRound });
    expect((under.container.querySelector('[data-round-score-gross-topar]') as HTMLElement).style.color).toBe(RED);
    expect(under.container.querySelector('[data-round-score-gross-topar]')?.textContent).toBe('−2');
    expect((under.container.querySelector('[data-round-score-net-topar]') as HTMLElement).style.color).toBe(RED);
    expect(under.container.querySelector('[data-round-score-net-topar]')?.textContent).toBe('−4');
    under.unmount();
    /* Thomas Holmes's real round: 85 +14, net 77 +6 on par 71 — both over, both muted. */
    const over = card({ postRound: { ...ROUND, grossScore: 85, coursePar: 71, netScore: 77 } as PostRound });
    expect(over.container.querySelector('[data-round-score-gross-topar]')?.textContent).toBe('+14');
    expect((over.container.querySelector('[data-round-score-gross-topar]') as HTMLElement).style.color).toBe(MUTE);
    expect(over.container.querySelector('[data-round-score-net-topar]')?.textContent).toBe('+6');
    expect((over.container.querySelector('[data-round-score-net-topar]') as HTMLElement).style.color).toBe(MUTE);
  });

  it('a round still in flight renders the card and fills the figures in place', () => {
    const { container } = card({ postRound: null, postRoundPending: true });
    expect(container.querySelector('[data-feed-round-card]')).not.toBeNull();
    expect(container.querySelector('[data-round-author-row]')).not.toBeNull();
    expect(container.querySelector('[data-round-score-gross]')).toBeNull();
    expect(container.querySelector('[data-round-score-net]')).toBeNull();
    expect(container.querySelector('[data-round-score-handicap]')).toBeNull();
    expect(container.querySelector('[data-feed-footer]')).not.toBeNull();
  });
});

describe('Signed-off score-led round awards', () => {
  it('uses FEED_CARD_SURFACE for every score-led medal ring', () => {
    const { container } = card({ roundMedals: { gold: 4, silver: 5, bronze: 3 } });
    const marks = container.querySelector('[data-round-score-awards] [data-award-cluster]')?.firstElementChild?.children;
    expect(marks).toHaveLength(3);
    for (const mark of Array.from(marks ?? [])) {
      expect((mark as HTMLElement).style.boxShadow).toBe('0 0 0 1.5px #16161A');
    }
    expect(source('src/features/explore-magazine/ExploreCard.tsx')).toContain('surfaceColor={FEED_CARD_SURFACE} figureSize={17}');
  });
  it('places all present tiers after handicap and prints the total at 17px', () => {
    const { container } = card({ roundMedals: { gold: 1, silver: 2, bronze: 1 } });
    const awards = container.querySelector('[data-round-score-awards]') as HTMLElement;
    expect(awards).not.toBeNull();
    expect([...awards.parentElement?.children ?? []].map(c => Object.keys((c as HTMLElement).dataset)[0])).toEqual(['roundScoreGross', 'roundScoreHandicap', 'roundScoreAwards']);
    const cluster = awards.querySelector('[data-award-cluster]') as HTMLElement;
    expect(cluster.dataset.awardCluster).toBe('gold silver bronze');
    expect(cluster.querySelectorAll('svg')).toHaveLength(3);
    expect(cluster.lastElementChild?.textContent).toBe('4');
    expect((cluster.lastElementChild as HTMLElement).style.fontSize).toBe('17px');
    expect(awards.parentElement?.style.gap).toBe('18px');
    expect((awards.lastElementChild as HTMLElement).style.textTransform).toBe('uppercase');
    expect((awards.lastElementChild as HTMLElement).style.marginTop).toBe('5px');
  });
  it('a single gold award renders only one canonical row-size mark', () => {
    const { container } = card({ roundMedals: { gold: 1, silver: 0, bronze: 0 } });
    const cluster = container.querySelector('[data-round-score-awards] [data-award-cluster]') as HTMLElement;
    expect(cluster.dataset.awardCluster).toBe('gold'); expect(cluster.lastElementChild?.textContent).toBe('1');
    expect(cluster.querySelectorAll('svg')).toHaveLength(1);
    const mark = cluster.firstElementChild?.firstElementChild as HTMLElement;
    expect(mark.style.width).toBe('15px'); expect(mark.style.height).toBe('18px');
  });
  it('omits absent tiers and preserves canonical overlap order', () => {
    const { container } = card({ roundMedals: { gold: 0, silver: 2, bronze: 1 } });
    const cluster = container.querySelector('[data-round-score-awards] [data-award-cluster]') as HTMLElement;
    expect(cluster.dataset.awardCluster).toBe('silver bronze'); expect(cluster.lastElementChild?.textContent).toBe('3');
    const marks = [...cluster.firstElementChild?.children ?? []] as HTMLElement[];
    expect(marks.map(mark => mark.style.marginLeft)).toEqual(['0px', '-4px']);
  });
  it.each([undefined, { gold: 0, silver: 0, bronze: 0 }])('no awards retains the two figures and 22px gap (%s)', medals => {
    const { container } = card({ roundMedals: medals });
    expect(container.querySelector('[data-round-score-awards]')).toBeNull();
    const right = container.querySelector('[data-round-score-handicap]')?.parentElement;
    expect(right?.children).toHaveLength(2); expect(right?.style.gap).toBe('22px');
  });
  it('awards never invent a missing handicap or duplicate gross', () => {
    const { container } = card({ postRound: { ...ROUND, courseHandicap: null } as PostRound, roundMedals: { gold: 1, silver: 0, bronze: 0 } });
    expect(container.querySelectorAll('[data-round-score-gross]')).toHaveLength(1);
    expect(container.querySelector('[data-round-score-handicap]')).toBeNull();
    expect(container.querySelector('[data-round-score-awards]')).not.toBeNull();
  });
  it('standard cards keep the existing cluster figure size and no score-led awards cell', () => {
    const { container } = card({ layout: 'standard', roundMedals: { gold: 1, silver: 0, bronze: 0 } });
    expect(container.querySelector('[data-round-score-awards]')).toBeNull();
    const cluster = container.querySelector('[data-award-cluster]') as HTMLElement;
    expect(cluster).not.toBeNull(); expect((cluster.lastElementChild as HTMLElement).style.fontSize).toBe('15px');
  });
});

describe('CB111 out-of-scope surfaces are unchanged', () => {
  const streamItem = {
    id: 'round:score-1', kind: 'round', ring: 'own', lane: 'news', score: 1, consequence: null,
    subject: { course_id: null, course_name: 'Test Course', region: null, sub_country: null, image_url: null, pending: false },
    who: { user_id: 'player', display_name: 'A player', photo_url: null, is_viewer: false },
    facts: { score_id: 'score-1', gross: 80, to_par: 8, net: 76, course_par: 72, course_handicap: 4, play_date: '2026-09-15' },
    payload: {}, seen: false,
  } as unknown as StreamItem;

  it('ExploreMagazine never passes feedLayout and its round tile keeps today’s figures row', () => {
    expect(source('src/features/explore-magazine/ExploreMagazine.tsx')).not.toContain('feedLayout');
    const { container } = render(<MemoryRouter><ExploreCard item={streamItem} size="std" onTap={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('[data-round-score-led]')).toBeNull();
    expect(container.querySelector('[data-round-figures]')).not.toBeNull();
  });

  it('FeedCard’s standard layout keeps today’s round card, figures row and no shared footer', () => {
    const { container } = card({ layout: 'standard' });
    expect(container.querySelector('[data-round-score-led]')).toBeNull();
    expect(container.querySelector('[data-round-figures]')).not.toBeNull();
    expect(container.querySelector('[data-round-reactions="controls"]')).not.toBeNull();
    expect(container.querySelector('[data-feed-footer]')).toBeNull();
  });

  it('only FeedCard’s mediaFirst round path passes feedLayout', () => {
    const feedCard = source('src/components/feed/FeedCard.tsx');
    expect(feedCard).toContain("feedLayout={scoreLed ? 'scoreLed' : undefined}");
    expect(feedCard).toContain("const scoreLed = layout === 'mediaFirst'");
    for (const path of [
      'src/features/explore-magazine/ExploreMagazine.tsx',
      'src/features/explore-magazine/FeaturedRoundCard.tsx',
      'src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx',
    ]) {
      expect(source(path)).not.toContain('feedLayout');
    }
  });
});
