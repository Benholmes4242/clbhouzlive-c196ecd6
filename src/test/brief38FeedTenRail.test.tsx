/** Brief 38: the Clubhouse ten post draws the shared countdown rail (FeedCard, permalink, skeleton). */
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

describe('Brief 38 ten post rail', () => {
  it('1. a published post renders ten ranked cards, ten ticks and the 2 to 10 hint, no photo block or share', () => {
    const { container } = card(row(makeBlock()));
    expect([...container.querySelectorAll('[data-ten-rail-rank]')].map(c => c.getAttribute('data-ten-rail-rank'))).toEqual(['1','2','3','4','5','6','7','8','9','10']);
    expect(container.querySelectorAll('.clb-ten-tick')).toHaveLength(10);
    expect(screen.getByText('Swipe for 2 to 10')).toBeInTheDocument();
    expect(container.querySelector('[data-ten-block]')).toBeNull();
    expect(container.textContent).not.toContain('Share your ten');
  });
  it('2. new_course at position 6 opens on card 6 with Just joined and the pronoun hint, band closed', () => {
    const { container } = card(row(makeBlock(), { kind:'new_course', courseId:'c6', pronoun:'his' }));
    const { width } = chartCardSize(document.documentElement.clientWidth);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 5 * (width + 10), behavior: 'auto' });
    const ticks = container.querySelectorAll('.clb-ten-tick');
    expect(ticks[5]).toHaveAttribute('aria-current', 'true');
    expect([...ticks].filter(t => t.getAttribute('aria-current') === 'true')).toHaveLength(1);
    const s = stories(container);
    expect(s[5]).toBe('Just joined');
    expect(s.filter((_, i) => i !== 5)).toEqual([3,4,5,6,7,9,10,11,12].map(n => `#${n} on the clbhouz ten`));
    expect(screen.getByText('Swipe for the rest of his ten')).toBeInTheDocument();
    expect(container.querySelector('[data-ten-rail-band]')).toBeNull();
  });
  it('3. a new_course whose course left the ten, or without a course, opens at #1', () => {
    for (const extra of [{ kind:'new_course' as const, courseId:'gone', pronoun:'his' as const }, { kind:'new_course' as const }]) {
      scrollTo.mockClear();
      const view = card(row(makeBlock(), extra));
      expect(screen.getByText('Swipe for 2 to 10')).toBeInTheDocument();
      expect(view.container.textContent).not.toContain('Just joined');
      expect(view.container.querySelectorAll('.clb-ten-tick')[0]).toHaveAttribute('aria-current', 'true');
      expect(scrollTo).not.toHaveBeenCalled();
      view.unmount();
    }
  });
  it('4. figures follow the block: visitor Golfers/You (dash when null), owner and signed out Golfers/Tens', () => {
    let v = card(row(makeBlock(false, 8.4))); expect(figures(v.container)).toEqual([['Golfers','8.8'],['You','8.4']]); v.unmount();
    v = card(row(makeBlock(false, null))); expect(figures(v.container)).toEqual([['Golfers','8.8'],['You','–']]); v.unmount();
    v = card(row(makeBlock(true))); expect(figures(v.container)).toEqual([['Golfers','8.8'],['Tens','3']]); v.unmount();
    v = card(row(makeBlock(false)), false, null); expect(figures(v.container)).toEqual([['Golfers','8.8'],['Tens','3']]); v.unmount();
  });
  it('5. tapping card 3 selects it, dims the rest and opens a three-column band after the ticks; tapping again closes', async () => {
    const { container } = card(row(makeBlock()));
    const third = () => container.querySelector('[data-ten-rail-rank="3"]') as HTMLElement;
    fireEvent.click(third());
    expect(third()).toHaveAttribute('data-selected', 'true');
    expect(container.querySelectorAll('.clb-ten-card[data-dimmed="true"]')).toHaveLength(9);
    const band = container.querySelector('[data-ten-rail-band]');
    expect(band?.previousElementSibling).toHaveClass('clb-ten-ticks');
    expect(band?.querySelector('.ten-scores')).toHaveAttribute('data-columns', '3');
    fireEvent.click(third());
    await waitFor(() => expect(container.querySelector('[data-ten-rail-band]')).toBeNull());
  });
  it('6. the permalink renders the same rail', () => {
    h.posts = new Map([[POST.id, row(makeBlock())]]);
    const { container } = mount(<TenPostPermalink post={POST} />);
    expect(container.querySelector('[data-ten-rail]')).not.toBeNull();
    expect(container.querySelectorAll('.clb-ten-card')).toHaveLength(10);
    expect(screen.getByText('Swipe for 2 to 10')).toBeInTheDocument();
  });
  it('7. the feed skeleton is two cards and ten ticks at the measured size, no text', () => {
    const { container } = mount(<TenRailSkeleton />);
    const shell = container.querySelector('[data-ten-rail-skeleton]') as HTMLElement;
    const { width, height } = chartCardSize(document.documentElement.clientWidth);
    expect(shell.style.getPropertyValue('--ten-card-w')).toBe(`${width}px`);
    expect(shell.style.getPropertyValue('--ten-card-h')).toBe(`${height}px`);
    expect(container.querySelectorAll('[data-ten-skeleton-card]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-ten-skeleton-tick]')).toHaveLength(10);
    expect(shell.textContent).toBe('');
    const rules = sheets.flatMap(s => [...(s.sheet?.cssRules ?? [])] as CSSStyleRule[]);
    const rule = rules.find(r => r.selectorText === '.ten-rail-skeleton-card')!;
    expect(rule.style.getPropertyValue('border-radius')).toBe('20px');
    expect(rule.style.getPropertyValue('width')).toBe('var(--ten-card-w)');
  });
});
