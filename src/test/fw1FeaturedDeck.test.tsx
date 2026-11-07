import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ rows:[] as unknown[], fetched:true, error:false, reduced:false, small:false, liked:false, like:vi.fn(), share:vi.fn(), open:vi.fn(), register:vi.fn(() => () => {}), attach:vi.fn(() => ({ detach:vi.fn() })), track:vi.fn(), rpc:vi.fn() }));
vi.mock('@/features/explore-magazine/watch/useWatchFeatured', () => ({ useWatchFeatured:() => ({ data:f.rows,isFetched:f.fetched,isError:f.error }) }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead:() => <div data-testid="legacy-lead" /> }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor:() => ({ activeActor:{ id:'me',type:'personal' } }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes:() => ({ handleLike:f.like,getActiveLikeState:(p:{likeCount:number} | null) => ({ isLiked:f.liked,count:p?.likeCount ?? 0 }) }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseShare', () => ({ useClubhouseShare:() => ({ handleShare:f.share }) }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion:() => f.reduced }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked:() => false }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo:f.register }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls:f.attach }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin:f.open }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents:{ track:f.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase:{ rpc:f.rpc } }));
import { WatchFeaturedDeck, WatchFeaturedSlot } from '@/features/explore-magazine/watch/WatchFeaturedDeck';
import { featuredSwipe, FEATURED_ADVANCE_MS, FEATURED_EXIT_MS } from '@/features/explore-magazine/watch/featuredRules';
import type { WatchFeaturedRow } from '@/features/explore-magazine/watch/useWatchFeatured';
import * as autoplayGate from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
const rows = (count=8):WatchFeaturedRow[] => Array.from({length:count},(_,i) => ({ post_id:`p${i}`,reason:'featured',actor_type:'personal',actor_id:`u${i}`,display_name:`Golfer ${i}`,handle:`golfer${i}`,avatar_url:null,is_verified:false,caption:`Video ${i}`,media_url:null,hls_url:`https://example.com/${i}.m3u8`,poster_url:`https://example.com/${i}.jpg`,stream_id:null,duration_seconds:12,width:900,height:1600,like_count:i+10,comment_count:i+2,created_at:'2026-11-04',course_id:null,course_name:null,rank:i+1,score:100-i,is_liked_by_me:false }));
const comments=vi.fn(), shorts=vi.fn();
const clients:QueryClient[]=[];
function mount(slot=false) { const client=new QueryClient({defaultOptions:{queries:{retry:false}}}); clients.push(client); return render(<QueryClientProvider client={client}>{slot ? <WatchFeaturedSlot userId="me" onDepart={() => {}} onOpenComments={comments} selectShorts={shorts} /> : <WatchFeaturedDeck rows={rows()} userId="me" onDepart={() => {}} onOpenComments={comments} selectShorts={shorts} />}</QueryClientProvider>); }
function top():HTMLElement { const el=document.querySelector<HTMLElement>('[data-top="true"], [data-featured-end]'); if(!el) throw new Error('No top card'); return el; }
function swipe(dx:number) { fireEvent.pointerDown(top(),{clientX:150,clientY:150,pointerId:1}); fireEvent.pointerMove(top(),{clientX:150+dx,clientY:150,pointerId:1}); fireEvent.pointerUp(top(),{pointerId:1}); }
function tick(ms:number) { act(() => vi.advanceTimersByTime(ms)); }
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); f.rows=rows(); f.fetched=true; f.error=false; f.reduced=false; f.small=false; f.liked=false; f.rpc.mockResolvedValue({data:false,error:null}); window.matchMedia=vi.fn(query => ({matches:query==='(max-width: 340px)' && f.small,media:query,onchange:null,addListener:vi.fn(),removeListener:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn(),dispatchEvent:vi.fn()})); vi.stubGlobal('PointerEvent',MouseEvent); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('FW1 mount',() => {
  it.each([3,8])('renders the deck for %i rows',count => {f.rows=rows(count); mount(true); expect(document.querySelector('[data-watch-featured]')).not.toBeNull(); expect(screen.queryByTestId('legacy-lead')).toBeNull();});
  it.each([0,1,2])('preserves the lead for %i rows',count => {f.rows=rows(count); mount(true); expect(screen.getByTestId('legacy-lead')).toBeTruthy(); expect(f.track).toHaveBeenCalledWith('watch_featured_fallback',{reason:'too_few'});});
  it('preserves the lead on read error',() => {f.error=true; mount(true); expect(screen.getByTestId('legacy-lead')).toBeTruthy(); expect(f.track).toHaveBeenCalledWith('watch_featured_fallback',{reason:'error'});});
  it('holds the existing skeleton during loading',() => {f.fetched=false; mount(true); expect(document.querySelector('[data-watch-lead="skeleton"]')).not.toBeNull(); expect(screen.queryByTestId('legacy-lead')).toBeNull();});
  it('pending then settled to the deck replaces the skeleton in place and removes nothing else',() => {
    f.fetched=false; const client=new QueryClient(); clients.push(client);
    const tree=() => <QueryClientProvider client={client}><div data-testid="feed"><div data-testid="before" /><WatchFeaturedSlot userId="me" onDepart={() => {}} onOpenComments={comments} selectShorts={shorts} /><div data-testid="after" /></div></QueryClientProvider>;
    const view=render(tree()); const feed=screen.getByTestId('feed');
    expect(feed.children).toHaveLength(3); expect(feed.children[1].getAttribute('data-watch-lead')).toBe('skeleton');
    f.fetched=true; view.rerender(tree());
    expect(feed.children).toHaveLength(3); expect(feed.children[0]).toBe(screen.getByTestId('before')); expect(feed.children[2]).toBe(screen.getByTestId('after'));
    expect(feed.children[1].hasAttribute('data-watch-featured')).toBe(true); expect(document.querySelector('[data-watch-lead="skeleton"]')).toBeNull(); expect(screen.queryByTestId('legacy-lead')).toBeNull();
  });
  it('pending then settled to the fallback lead replaces the skeleton in place and removes nothing else',() => {
    f.fetched=false; const saved=f.rows; const client=new QueryClient(); clients.push(client);
    const tree=() => <QueryClientProvider client={client}><div data-testid="feed"><div data-testid="before" /><WatchFeaturedSlot userId="me" onDepart={() => {}} onOpenComments={comments} selectShorts={shorts} /><div data-testid="after" /></div></QueryClientProvider>;
    const view=render(tree()); const feed=screen.getByTestId('feed');
    expect(feed.children[1].getAttribute('data-watch-lead')).toBe('skeleton');
    f.fetched=true; f.rows=[]; view.rerender(tree()); f.rows=saved;
    expect(feed.children).toHaveLength(3); expect(feed.children[0]).toBe(screen.getByTestId('before')); expect(feed.children[2]).toBe(screen.getByTestId('after'));
    expect(feed.children[1]).toBe(screen.getByTestId('legacy-lead')); expect(document.querySelector('[data-watch-lead="skeleton"]')).toBeNull();
  });
});
describe('FW1 gestures and actions',() => {
  it('promotes the tilted next card to a straight top and retains photo-only rear cards',() => {mount();const next=document.querySelector('[data-featured-card="p1"]');expect(next?.getAttribute('data-depth')).toBe('1');swipe(120);tick(260);expect(top()).toBe(next);expect(top().style.transform).toBe('translateX(0px) rotate(0deg)');const rear=document.querySelector('[data-depth="1"]');expect(rear?.getAttribute('data-featured-card')).toBe('p2');expect(rear?.querySelector('.featured-badge, .featured-duration, .featured-foot, video')).toBeNull();});
  it.each([-120,120])('advances either direction (%i) at 260ms during 320ms exit without liking',dx => {mount(); swipe(dx); tick(259); expect(top().getAttribute('data-featured-card')).toBe('p0'); tick(1); expect(top().getAttribute('data-featured-card')).toBe('p1'); expect(f.like).not.toHaveBeenCalled(); expect(FEATURED_ADVANCE_MS).toBe(260); expect(FEATURED_EXIT_MS).toBe(320);});
  it('keeps a drag at the 90px threshold on the same card',() => {mount(); swipe(90); tick(400); expect(top().getAttribute('data-featured-card')).toBe('p0'); expect(featuredSwipe(90,false)).toBe('stay');});
  it('completes, hides actions, goes back on right swipe, and restarts',() => {mount(); for(let i=0;i<8;i++){swipe(-120);tick(260);} expect(document.querySelector('[data-featured-end]')).not.toBeNull(); expect(screen.queryByRole('button',{name:'Like video'})).toBeNull(); expect(screen.queryByRole('button',{name:'Open comments'})).toBeNull(); expect(screen.queryByRole('button',{name:'Share video'})).toBeNull(); expect(f.track).toHaveBeenCalledWith('watch_featured_completed'); swipe(100);tick(260); expect(top().getAttribute('data-featured-card')).toBe('p7');swipe(120);tick(260);fireEvent.click(screen.getByRole('button',{name:'Start again'}));expect(top().getAttribute('data-featured-card')).toBe('p0');});
  it('renders no hint line on the cards or the end card',() => {mount(); expect(document.querySelector('[data-top="true"]')).not.toBeNull(); expect(document.querySelector('.featured-hint')).toBeNull(); for(let i=0;i<8;i++){swipe(-120);tick(260);} expect(document.querySelector('[data-featured-end]')).not.toBeNull(); expect(document.querySelector('.featured-hint')).toBeNull(); expect(document.querySelector('[data-watch-featured]')!.querySelectorAll('section > p')).toHaveLength(0);});
  it('end-card Shorts action selects Shorts in place',() => {mount();for(let i=0;i<8;i++){swipe(120);tick(260);}fireEvent.click(screen.getByRole('button',{name:'All shorts'}));expect(shorts).toHaveBeenCalledOnce();});
  it('likes the current post through handleLike',() => {mount();swipe(120);tick(260);fireEvent.click(screen.getByRole('button',{name:'Like video'}));expect(f.like).toHaveBeenCalledWith(expect.objectContaining({id:'p1',isLikedByMe:false}));expect(f.track).toHaveBeenCalledWith('watch_featured_liked',{via:'button'});});
  it('double-tap likes once and cancels fullscreen opening',() => {mount();swipe(0);tick(100);swipe(0);tick(400);expect(f.like).toHaveBeenCalledOnce();expect(f.open).not.toHaveBeenCalled();});
  it('double-tap never removes an existing like',() => {f.liked=true;mount();swipe(0);tick(100);swipe(0);tick(400);expect(f.like).not.toHaveBeenCalled();expect(f.open).not.toHaveBeenCalled();});
  it('single tap opens the full deck at the current index only after 320ms',() => {mount();swipe(120);tick(260);swipe(0);tick(319);expect(f.open).not.toHaveBeenCalled();tick(1);expect(f.open).toHaveBeenCalledWith(expect.objectContaining({index:1,posts:expect.any(Array)}));expect(f.open.mock.calls[0][0].posts).toHaveLength(8);});
  it('comments and share use the current post',() => {mount();swipe(120);tick(260);fireEvent.click(screen.getByRole('button',{name:'Open comments'}));fireEvent.click(screen.getByRole('button',{name:'Share video'}));expect(comments).toHaveBeenCalledWith('p1');expect(f.share).toHaveBeenCalledWith(expect.objectContaining({id:'p1'}));});
  it('registers only the top playback card and replaces it on advance',() => {mount();expect(f.register).toHaveBeenCalledOnce();expect(document.querySelectorAll('video')).toHaveLength(1);swipe(120);tick(260);expect(f.register).toHaveBeenCalledTimes(2);expect(document.querySelectorAll('video')).toHaveLength(1);});
  it('reduced motion crossfades for 150ms without rotation',() => {f.reduced=true;mount();swipe(120);expect(top().style.transform).toBe('none');expect(top().style.transition).toBe('opacity 150ms linear');tick(149);expect(top().getAttribute('data-featured-card')).toBe('p0');tick(1);expect(top().getAttribute('data-featured-card')).toBe('p1');});
  it('hides dots when the 340px media query matches',() => {f.small=true;mount();expect(document.querySelector('.featured-dots')).toBeNull();});
  it('strips stored mention markup from captions like the Watch rows',() => {const marked=rows();marked[0]={...marked[0],caption:'Great round with @[mikem84](u:123e4567-e89b-42d3-a456-426614174000) today'};f.rows=marked;mount(true);const caption=document.querySelector('.featured-caption');expect(caption?.textContent).toBe('Great round with @mikem84 today');expect(caption?.textContent).not.toContain('@[mikem84]');expect(top().getAttribute('aria-label')).toBe('Great round with @mikem84 today');});
});
describe('FM1 sound group', () => {
  it('puts sound before the single duration in the top-right group only', () => {
    mount();
    const group = top().querySelector('.featured-topright');
    expect(group?.children).toHaveLength(2);
    expect(group?.children[0].classList.contains('featured-mute')).toBe(true);
    expect(group?.children[1].classList.contains('featured-duration')).toBe(true);
    expect(top().querySelectorAll('.featured-duration')).toHaveLength(1);
    expect(document.querySelector('.featured-mute:not(.featured-topright > .featured-mute)')).toBeNull();
  });
  it('toggles sound and icons without opening, liking or advancing', () => {
    mount();
    const button = screen.getByRole('button', { name:'Unmute' });
    const video = top().querySelector('video');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('.lucide-volume-x')).not.toBeNull();
    fireEvent.pointerDown(button, { clientX:150, clientY:150, pointerId:1 });
    fireEvent.pointerUp(button, { pointerId:1 });
    fireEvent.click(button);
    expect(video?.muted).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('.lucide-volume2')).not.toBeNull();
    fireEvent.click(button);
    tick(500);
    expect(video?.muted).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(f.open).not.toHaveBeenCalled();
    expect(f.like).not.toHaveBeenCalled();
    expect(top().getAttribute('data-featured-card')).toBe('p0');
  });
  it('stops pointerdown, touchstart and click before deck ancestors see them', () => {
    mount();
    const seen = vi.fn();
    for (const event of ['pointerdown','touchstart','click']) document.addEventListener(event, seen);
    const button = screen.getByRole('button', { name:'Unmute' });
    fireEvent.pointerDown(button);
    fireEvent.touchStart(button);
    fireEvent.click(button);
    expect(seen).not.toHaveBeenCalled();
    for (const event of ['pointerdown','touchstart','click']) document.removeEventListener(event, seen);
  });
  it.each(['reduced motion','autoplay blocked'])('shows only duration for %s', reason => {
    f.reduced = reason === 'reduced motion';
    const gate = vi.spyOn(autoplayGate, 'autoplayBlocked').mockReturnValue(true);
    try {
      mount();
      expect(top().querySelector('video')).toBeNull();
      expect(top().querySelector('.featured-mute')).toBeNull();
      expect(top().querySelector('.featured-topright > .featured-duration')).not.toBeNull();
    } finally { gate.mockRestore(); }
  });
  it('shows duration without sound when the card has no video source', () => {
    f.rows = rows().map(row => ({ ...row, hls_url:null }));
    mount(true);
    expect(top().querySelector('video')).toBeNull();
    expect(top().querySelector('.featured-topright')?.children).toHaveLength(1);
    expect(top().querySelector('.featured-topright > .featured-duration')).not.toBeNull();
    expect(top().querySelector('.featured-mute')).toBeNull();
  });
  it('keeps duration alone after a video fails', () => {
    mount();
    const video = top().querySelector('video');
    if (!video) throw new Error('Expected mounted video');
    video.setAttribute('src','https://example.com/failed.mp4');
    fireEvent.error(video);
    expect(top().querySelector('video')).toBeNull();
    expect(top().querySelector('.featured-mute')).toBeNull();
    expect(top().querySelector('.featured-topright > .featured-duration')).not.toBeNull();
  });
  it('starts the next card muted after sound was enabled', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name:'Unmute' }));
    swipe(120); tick(260);
    expect(screen.getByRole('button', { name:'Unmute' }).getAttribute('aria-pressed')).toBe('false');
    expect(top().querySelector('video')?.muted).toBe(true);
  });
  it('reserves no right padding on the meta line', () => {
    const featuredCss = readFileSync('src/features/explore-magazine/watch/featured.css', 'utf8');
    const rule = featuredCss.match(/\.featured-meta\s*\{([^}]+)\}/)?.[1];
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/padding(?:-right)?\s*:/);
  });
});