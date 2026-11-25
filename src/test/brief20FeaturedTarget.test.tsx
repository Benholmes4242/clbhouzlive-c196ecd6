import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ postLike:vi.fn(), share:vi.fn(), toggle:vi.fn(), rpc:vi.fn(), posts:[] as unknown[] }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor:() => ({ activeActor:{ id:'me', type:'personal' } }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes:() => ({ handleLike:f.postLike, getActiveLikeState:(p:{likeCount:number} | null) => ({ isLiked:false, count:p?.likeCount ?? 0 }) }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseShare', () => ({ useClubhouseShare:() => ({ handleShare:f.share }) }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion:() => false }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked:() => false }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo:() => () => {} }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls:() => ({ detach:() => {} }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents:{ track:() => {} } }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement:() => ({ engagementFor:() => ({ likeCount:41, commentCount:17, viewerLiked:false }), isSettled:true }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions:() => ({ viewerId:'me', unavailable:false, isSettled:true, stateFor:() => ({ mine:false }), toggle:f.toggle }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase:{ rpc:f.rpc, from:() => ({ select:() => ({ in:async () => ({ data:f.posts, error:null }) }) }) } }));
import { WatchFeaturedDeck } from '@/features/explore-magazine/watch/WatchFeaturedDeck';
import { engagementTargetFor } from '@/lib/engagement/engagementTarget';
import type { WatchFeaturedRow } from '@/features/explore-magazine/watch/useWatchFeatured';
const rows = ():WatchFeaturedRow[] => [0,1,2].map(i => ({ post_id:`p${i}`,reason:'featured',actor_type:'personal',actor_id:`u${i}`,display_name:`G${i}`,handle:`g${i}`,avatar_url:null,is_verified:false,caption:'c',media_url:null,hls_url:null,poster_url:null,stream_id:null,duration_seconds:12,width:900,height:1600,like_count:5,comment_count:3,created_at:'2026-11-04',course_id:null,course_name:null,rank:i+1,score:1,is_liked_by_me:false }) as unknown as WatchFeaturedRow);
const comments = vi.fn();
function mount() { const qc = new QueryClient({ defaultOptions:{ queries:{ retry:false } } }); return render(<QueryClientProvider client={qc}><WatchFeaturedDeck rows={rows()} userId="me" onDepart={() => {}} onOpenComments={comments} selectShorts={() => {}} /></QueryClientProvider>); }
const likeBtn = () => screen.getByRole('button', { name:'Like video' });
beforeEach(() => { vi.clearAllMocks(); f.rpc.mockResolvedValue({ data:false, error:null }); window.matchMedia = vi.fn(q => ({ matches:false, media:q, onchange:null, addListener:vi.fn(), removeListener:vi.fn(), addEventListener:vi.fn(), removeEventListener:vi.fn(), dispatchEvent:vi.fn() })) as never; });
afterEach(() => { cleanup(); });

describe('BRIEF 20 G: the featured card uses the one engagement target', () => {
  it('a review-sourced row likes through the review reaction path, never viewer_liked_post or the post like', async () => {
    f.posts = [{ id:'p0', source_review_id:'r9', whs_score_id:null }];
    mount();
    await waitFor(() => expect(likeBtn().hasAttribute('disabled')).toBe(false));
    fireEvent.click(likeBtn());
    expect(f.toggle).toHaveBeenCalledWith('review', 'r9', expect.any(Function));
    expect(f.postLike).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalledWith('viewer_liked_post', expect.anything());
  });
  it('its comment button opens the review target', async () => {
    f.posts = [{ id:'p0', source_review_id:'r9', whs_score_id:null }];
    mount();
    await waitFor(() => expect(likeBtn().hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name:'Open comments' }));
    const [id, source] = comments.mock.calls[0];
    expect(engagementTargetFor({ id, ...source })).toEqual({ type:'review', id:'r9' });
  });
  it('its counts are the review engagement counts, not the row counts', async () => {
    f.posts = [{ id:'p0', source_review_id:'r9', whs_score_id:null }];
    mount();
    await waitFor(() => expect(document.querySelector('[data-featured-like-count]')?.textContent).toBe('41'));
    expect(screen.getByRole('button', { name:'Open comments' }).textContent).toBe('17');
  });
  it('a non-review row is unchanged: post like path, row counts, bare post id', async () => {
    f.posts = [{ id:'p0', source_review_id:null, whs_score_id:null }];
    mount();
    await waitFor(() => expect(likeBtn().hasAttribute('disabled')).toBe(false));
    expect(document.querySelector('[data-featured-like-count]')?.textContent).toBe('5');
    fireEvent.click(likeBtn());
    expect(f.postLike).toHaveBeenCalledWith(expect.objectContaining({ id:'p0' }));
    expect(f.toggle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name:'Open comments' }));
    expect(comments).toHaveBeenCalledWith('p0');
  });
});
