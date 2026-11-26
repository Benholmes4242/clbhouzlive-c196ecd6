/** Brief 31: real shared block/profile/card behavior with server-shaped payloads. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { TenBlockData, TenPostBlock } from '@/components/topTen/topTenModel';
const h = vi.hoisted(() => ({ block: null as TenBlockData | null, signedIn: true, rpc: vi.fn() }));
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
vi.mock('@/components/topTen/useTenBlocks', async original => ({ ...await original<typeof import('@/components/topTen/useTenBlocks')>(), useTenBlock: () => ({ data: h.block, isLoading: false, isError: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.signedIn ? { id: 'viewer' } : null, loading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
import { TenPills } from '@/components/topTen/TenBand';
import { TenRail } from '@/components/topTen/TenRail';
import { ProfileTopTenRail } from '@/components/profile/hero/ProfileTopTenRail';
import { FeedCard } from '@/components/feed/FeedCard';
import { omitUnreadableTens } from '@/components/topTen/topTenModel';
import { useTenPostBlocks } from '@/components/topTen/useTenBlocks';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';

const makeBlock = (own = false, positions = [1,2,3,4,5,6,7,8,9,10]): TenBlockData => ({
  owner: { user_id:'owner', display_name:'Thomas Muchmore', first_name:'Thomas', username:'thomas', avatar_url:null, is_pro:true, pronoun:'his' },
  count:positions.length, is_owner:own, played_count:own ? null : 4, shared_line:own ? null : 'Both have Royal County Down top three', on_chart_count:4,
  courses:positions.map(position => ({ position, course_id:`c${position}`, name:`Course ${position}`, region:'Merseyside', sub_country:'England', country:'United Kingdom', thumbnail_image:null, is_pinned:true, member_score:position === 6 ? 9.1 : null, golfers_score:8.8, golfers_count:20, viewer_score:null, chart_rank:8, in_tens:3, comment_count:3 })),
});
const POST = { id:'ten-post', userId:'owner', actorId:'owner', actorType:'personal', username:'thomas', displayName:'Thomas Muchmore', avatarUrl:'', createdAt:'2026-11-25T21:00:00Z', caption:'NEVER SHOW THIS FALLBACK', postType:'top_ten', isReview:false, mediaItems:[], likeCount:14, commentCount:5, isLikedByMe:false } as FeedPost;
const row = (block: TenBlockData): TenPostBlock => ({ post_id:POST.id, owner_id:'owner', kind:'published', headline:'Published his top ten', block });
const client = () => new QueryClient({ defaultOptions: { queries: { retry:false, gcTime:0 } } });
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={client()}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const card = (data?: TenPostBlock, pending = false) => mount(<FeedCard post={POST} tenPostBlock={data} tenPostPending={pending} liked={false} likeCount={14} commentCount={5} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onProfile={vi.fn()} onOpenMedia={vi.fn()} currentUserId="viewer" layout="mediaFirst" />);
let sheet: HTMLStyleElement;
beforeEach(() => { h.block=makeBlock();h.signedIn=true;h.rpc.mockReset();sheet=document.createElement('style');sheet.textContent=readFileSync('src/styles/top-ten.css','utf8');document.head.appendChild(sheet); });
afterEach(() => { cleanup(); sheet.remove(); });
describe('Brief 31 member ten', () => {
  it('null member scores leave corners empty, while 9.1 appears plainly', () => {
    const {container}=mount(<TenRail block={makeBlock()} signedIn hintText="Swipe" />);
    expect(container.querySelector('[data-ten-rail-rank="1"] [data-ten-corner-score]')).toBeNull();
    expect(container.querySelector('[data-ten-rail-rank="6"] [data-ten-corner-score]')).toHaveTextContent('9.1');
  });
  it('tapping course 6 opens the band after the ticks, toggles closed, and course 2 replaces it with other cards dimmed', async () => {
    const {container}=mount(<TenRail block={makeBlock()} signedIn hintText="Swipe" />);
    fireEvent.click(screen.getByRole('button',{name:'#6 Course 6, 9.1'}));
    const band=container.querySelector('[data-ten-rail-band]');
    expect(band?.previousElementSibling).toHaveClass('clb-ten-ticks');
    expect(container.querySelector('[data-ten-rail-rank="1"]')).toHaveAttribute('data-dimmed','true');
    expect(container.querySelector('[data-ten-rail-rank="6"]')).toHaveAttribute('data-dimmed','false');
    fireEvent.click(screen.getByRole('button',{name:'#6 Course 6, 9.1'}));
    await waitFor(()=>expect(container.querySelector('[data-ten-rail-band]')).toBeNull());
    fireEvent.click(screen.getByRole('button',{name:'#6 Course 6, 9.1'}));
    fireEvent.click(screen.getByRole('button',{name:'#2 Course 2'}));
    await waitFor(()=>expect(container.querySelectorAll('[data-ten-rail-band]')).toHaveLength(1));
    expect(container.querySelector('[data-ten-rail-band] .ten-band-name')).toHaveTextContent('Course 2');
  });
  it('server null and a visitor count of two both omit the profile section', () => {
    h.block=null;const first=mount(<ProfileTopTenRail userId="owner" isOwnProfile={false} />);expect(first.container.querySelector('section')).toBeNull();first.unmount();
    h.block=makeBlock(false,[1,2]);expect(mount(<ProfileTopTenRail userId="owner" isOwnProfile={false} />).container.querySelector('section')).toBeNull();
  });
  it('missing feed rows render nothing and visible/pending cards never show post content', () => {
    const missing=card();expect(missing.container.querySelector('article')).toBeNull();missing.unmount();
    const visible=card(row(makeBlock()));expect(visible.container.textContent).not.toContain(POST.caption);expect(visible.container.querySelector('[data-ten-rail]')).not.toBeNull();visible.unmount();
    const pending=card(undefined,true);expect(pending.container.textContent).not.toContain(POST.caption);expect(pending.container.querySelector('[data-ten-rail-skeleton]')).not.toBeNull();
  });
  it('owner and signed-out bands have two score columns; signed-in visitors have three', () => {
    for(const [own,signedIn,n] of [[true,true,2],[false,false,2],[false,true,3]] as const){
      const view=mount(<TenRail block={makeBlock(own)} signedIn={signedIn} hintText="Swipe" />);fireEvent.click(screen.getByRole('button',{name:'#6 Course 6, 9.1'}));
      expect(view.container.querySelectorAll('.ten-score-column')).toHaveLength(n);
      expect([...view.container.querySelectorAll('.ten-label')].map(e=>e.textContent)).toEqual(n===2?['You','Golfers']:['Thomas','Golfers','You']);view.unmount();
    }
  });
  it('top_ten_update routes to the target profile courses tab', () => {
    expect(getActivityLink({ notif_type:'top_ten_update', data:{target_user_id:'owner',post_id:POST.id}, actor_user_id:'actor' } as never)).toBe('/profile/owner?tab=courses');
  });
  it('unreadable tens are removed before indices and pending tens keep their slots', () => {
    const posts=[{id:'before'},POST,{id:'after'}];
    expect(omitUnreadableTens(posts,new Map(),true).map((p,i)=>[p.id,i])).toEqual([['before',0],['after',1]]);
    expect(omitUnreadableTens(posts,new Map(),false)).toBe(posts);
  });
  it('course deep links open the band and course comments retain owner/course/comment identity', () => {
    const {container}=mount(<TenRail block={makeBlock()} signedIn hintText="Swipe" openBandOnCourseId="c6" initialCommentId="comment6" />);
    expect(container.querySelector('[data-ten-rail-band] .ten-band-name')).toHaveTextContent('Course 6');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-owner','owner');expect(screen.getByRole('dialog')).toHaveAttribute('data-course','c6');expect(screen.getByRole('dialog')).toHaveAttribute('data-comment','comment6');
  });
  it('Brief 34: own pills no longer carry the "of yours" pill or a share button', () => {
    const block=makeBlock(true);block.on_chart_count=1;const share=vi.fn();const view=mount(<TenPills block={block} ownProfile onShare={share} />);
    expect(view.container.textContent).not.toContain('of yours');expect(screen.queryByRole('button',{name:'Share your ten'})).toBeNull();expect(share).not.toHaveBeenCalled();
  });
  it('post block reads batch sorted unique ids and change identity even when list sizes agree', async () => {
    h.rpc.mockResolvedValue({data:[],error:null});const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={client()}>{children}</QueryClientProvider>;
    const {result,rerender}=renderHook(({ids})=>useTenPostBlocks(ids),{wrapper,initialProps:{ids:['b','a','b']}});
    await waitFor(()=>expect(result.current.settled).toBe(true));expect(h.rpc).toHaveBeenCalledWith('get_top_ten_post_blocks',{p_post_ids:['a','b']});
    rerender({ids:['a','c']});await waitFor(()=>expect(h.rpc).toHaveBeenCalledWith('get_top_ten_post_blocks',{p_post_ids:['a','c']}));
  });
});
