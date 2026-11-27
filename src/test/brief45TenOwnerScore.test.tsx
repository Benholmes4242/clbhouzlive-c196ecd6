/** Brief 45: Top 10 cards show the owner's labelled score then Golfers, with no corner pill. Harness copied from brief38FeedTenRail. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { TenBlockData, TenPostBlock } from '@/components/topTen/topTenModel';
const h = vi.hoisted(() => ({ block: null as TenBlockData | null, signedIn: true, rpc: vi.fn(), posts: null as Map<string, TenPostBlock> | null }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => <div data-actor-picker /> }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => <div data-liked-by /> }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => <div data-comments /> }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

vi.mock('@/features/pro-verification/ProLabel', () => ({ ProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: (p: { isOpen: boolean; targetId: string; targetSecondaryId: string; initialCommentId?: string }) => p.isOpen ? <div role="dialog" data-owner={p.targetId} data-course={p.targetSecondaryId} data-comment={p.initialCommentId} /> : null }));
vi.mock('@/components/topTen/useTenBlocks', async original => ({ ...await original<typeof import('@/components/topTen/useTenBlocks')>(), useTenBlock: () => ({ data: h.block, isLoading: false, isError: false }), useTenPostBlocks: () => ({ map: h.posts ?? new Map(), settled: true, fetching: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.signedIn ? { id: 'viewer' } : null, loading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ getActiveLikeState: () => ({ isLiked: false, count: 0 }), handleLike: vi.fn() }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseShare', () => ({ useClubhouseShare: () => ({ handleShare: vi.fn() }) }));
import { FeedCard } from '@/components/feed/FeedCard';
import { TenPostPermalink } from '@/components/topTen/TenPostPermalink';
import { TenRailSkeleton } from '@/components/topTen/TenRail';
import { chartCardSize } from '@/components/courses/browse/clbhouzTenRules';

const makeBlock = (own = false, viewer: number | null = 8.4): TenBlockData => ({
  owner: { user_id:'owner', display_name:'Thomas Muchmore', first_name:'Thomas', username:'thomas', avatar_url:null, is_pro:true, pronoun:'his' },
  count:10, is_owner:own, played_count:own ? null : 4, shared_line:null, on_chart_count:4,
  courses:Array.from({ length:10 }, (_, i) => ({ position:i + 1, course_id:`c${i + 1}`, name:`Course ${i + 1}`, region:'Kent', sub_country:'England', country:'GB', thumbnail_image:null, is_pinned:false, member_score:9.1, golfers_score:8.8, golfers_count:20, viewer_score:viewer, chart_rank:i + 3, in_tens:3, comment_count:0 })),
});
const POST = { id:'ten-post', userId:'owner', actorId:'owner', actorType:'personal', username:'thomas', displayName:'Thomas Muchmore', avatarUrl:'', createdAt:'2026-11-25T21:00:00Z', caption:'', postType:'top_ten', isReview:false, mediaItems:[], likeCount:1, commentCount:0, isLikedByMe:false } as FeedPost;
const row = (block: TenBlockData, extra: Partial<TenPostBlock> = {}): TenPostBlock => ({ post_id:POST.id, owner_id:'owner', kind:'published', headline:'Completed his top 10', block, ...extra });
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const card = (data?: TenPostBlock, pending = false, viewer: string | null = 'viewer') => mount(<FeedCard post={POST} tenPostBlock={data} tenPostPending={pending} liked={false} likeCount={1} commentCount={0} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onProfile={vi.fn()} onOpenMedia={vi.fn()} currentUserId={viewer ?? undefined} layout="mediaFirst" />);
const stories = (c: HTMLElement) => [...c.querySelectorAll('.clb-ten-card')].map(x => x.querySelector('.clb-ten-story')?.textContent ?? null);
const figures = (c: HTMLElement) => [...c.querySelectorAll('.clb-ten-card')[0].querySelectorAll('.clb-ten-stat')].map(x => [x.querySelector('small')!.textContent, x.querySelector('b')!.textContent]);
const sheets: HTMLStyleElement[] = [];
let scrollTo: ReturnType<typeof vi.fn>;
beforeEach(() => {
  h.signedIn = true; h.posts = null; scrollTo = vi.fn(); Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
  for (const file of ['src/styles/top-ten.css', 'src/styles/clbhouz-ten.css']) { const s = document.createElement('style'); s.textContent = readFileSync(file, 'utf8'); document.head.appendChild(s); sheets.push(s); }
});
afterEach(() => { cleanup(); sheets.splice(0).forEach(s => s.remove()); });

import { TenRail } from '@/components/topTen/TenRail';
import { TenRailCard } from '@/components/topTen/TenRailCard';
import { TopTenShareCard } from '@/components/profile/hero/topTenShare/TopTenShareCard';

const withScore = (b: TenBlockData, i: number, member: number | null, golfers: number | null) => { b.courses[i] = { ...b.courses[i], member_score: member, golfers_score: golfers }; return b; };
describe('Brief 45 owner score on Top 10 cards', () => {
  it('1. visitor feed card: Thomas 9.6 then Golfers 8.9, no .ten-score-pill', () => {
    const { container } = card(row(withScore(makeBlock(false), 0, 9.6, 8.9)));
    expect(figures(container)).toEqual([['Thomas','9.6'],['Golfers','8.9']]);
    expect(container.querySelector('.clb-ten-card .ten-score-pill')).toBeNull();
  });
  it('2. own card: You then Golfers, no pill, no Tens figure', () => {
    const { container } = mount(<TenRail block={makeBlock(true)} signedIn hintText="Swipe" />);
    expect(figures(container).map(f => f[0])).toEqual(['You','Golfers']);
    expect(container.querySelector('.ten-score-pill')).toBeNull();
    expect([...container.querySelectorAll('.clb-ten-stat small')].some(e => e.textContent === 'Tens')).toBe(false);
  });
  it('3. signed out: owner name and Golfers', () => {
    const { container } = mount(<TenRail block={makeBlock(false)} signedIn={false} hintText="Swipe" />);
    expect(figures(container).map(f => f[0])).toEqual(['Thomas','Golfers']);
  });
  it('4. null member_score: the owner figure is a dash in the missing style', () => {
    const { container } = card(row(withScore(makeBlock(false), 0, null, 8.9)));
    const b = container.querySelector('.clb-ten-card .clb-ten-stat b') as HTMLElement;
    expect(b).toHaveTextContent('–');
    expect(b).toHaveAttribute('data-missing', 'true');
  });
  it('5. story slot keeps "#n on the clbhouz ten" and "Just joined"', () => {
    const { container } = card(row(makeBlock(), { kind:'new_course', courseId:'c6', pronoun:'his' }));
    const s = stories(container);
    expect(s[0]).toBe('#3 on the clbhouz ten');
    expect(s[5]).toBe('Just joined');
  });
  it('6. the Courses chart card corner and the share card pills still render', () => {
    const chart = mount(<TenRailCard rank={1} courseId="c1" name="Course 1" imageUrl={null} place="Fife" figures={[]} ariaLabel="#1" onClick={() => {}} corner={<span className="clb-ten-movement" data-movement="up">▲3</span>} />);
    expect(chart.container.querySelector('.clb-ten-movement')).toHaveTextContent('▲3');
    expect(readFileSync('src/components/courses/browse/ClbhouzTenSection.tsx', 'utf8')).toContain('corner={movementLabel(row)');
    chart.unmount();
    const share = render(<TopTenShareCard format="story" courses={[{ position:1, name:'A', region:'Kent', sub_country:'England', country:'GB', thumbnail_image:null, rating:9.4 }]} identity={{ displayName:'Thomas', avatarUrl:null, handicapIndex:null, rounds:1, rated:1 }} showHandicap={false} showHeroPhoto photos={[null]} />);
    expect(share.container.querySelector('[data-share-pill]')).toHaveTextContent('9.4');
  });
});
