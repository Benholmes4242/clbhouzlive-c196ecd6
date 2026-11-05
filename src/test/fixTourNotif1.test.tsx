import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({useSupabaseSession:()=>({user:null})}));
vi.mock('@/context/ActiveActorContext', () => ({useActiveActor:()=>({activeActor:null,isLoading:true})}));
vi.mock('@/hooks/useLogout', () => ({useLogout:()=>({logout:vi.fn()})}));
vi.mock('@/features/chrome-v2/leftOverride', () => ({useSetChromeSuppressed:()=>{}}));
vi.mock('@/features/chrome-v2/ChromeIsland', () => ({HcpCell:()=> <span>Index</span>,AvatarCell:()=>null}));
vi.mock('@/components/header/PostingAsMenu', () => ({PostingAsMenu:()=>null}));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({SearchOverlayV2:()=>null}));
vi.mock('@/features/tourhub/components/TourSideMenu', () => ({TourSideMenu:()=>null}));
vi.mock('@/features/activity-v2/hooks/useSharePrompt', () => ({useSharePromptFor:()=>null}));
vi.mock('@/features/pro-verification/ProLabel', () => ({ProMemberName:({children}:{children:React.ReactNode})=><>{children}</>}));
import { LedgerRow } from '@/features/activity-v2/components/LedgerRow';
import { NewsChromeBridge } from '@/features/tourhub/news/NewsChromeBridge';
import { ScrollRestoration, scrollPositions } from '@/components/ScrollRestoration';
const h=vi.hoisted(()=>({top:vi.fn(),restore:vi.fn()}));
vi.mock('@/lib/getScrollParent',()=>({getPageScrollTop:()=>123,getPrimaryScrollElement:()=>({scrollHeight:2000}),scrollPageTo:h.restore,scrollPageToTop:h.top}));
const row:ActivityFeedRowV2={notif_id:'digest',notif_type:'tour_preview',created_at:new Date().toISOString(),is_read:true,title:null,message:'Weekly tournaments',entity_id:null,entity_type:null,data:{tour_short_name:'DPWT'},actor_user_id:null,actor_username:null,actor_display_name:null,actor_avatar_url:null,actor_kind:'personal',actor_route_id:null,liker_avatar_urls:null,target_course_name:null,target_course_image:null,target_poster_url:null,target_review_rating:null};
const originalResizeObserver = window.ResizeObserver;
afterEach(()=>{cleanup();window.ResizeObserver=originalResizeObserver;vi.unstubAllGlobals();vi.restoreAllMocks();h.top.mockClear();h.restore.mockClear();scrollPositions.clear();});
describe('FIX_TOUR_NOTIF_1',()=>{
  it.each(['tour_preview','tour_roundup'])('%s opens overview',notif_type=>expect(getActivityLink({...row,notif_type})).toBe('/tourhub'));
  it('keeps the trophy after the route change and pushes without nav-origin state, with back to Activity',()=>{
    function Location(){const l=useLocation();const n=useNavigate();return <><output>{l.pathname}|{JSON.stringify(l.state)}</output><button onClick={()=>n(-1)}>Return</button></>;}
    render(<MemoryRouter initialEntries={['/notificationmessages']}><LedgerRow row={row} onMarkRead={vi.fn()} onLongPress={vi.fn()}/><Location/></MemoryRouter>);
    expect(screen.getByTestId('activity-tour-tile').querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('activity-tour-tile').textContent).toBe('');
    fireEvent.click(screen.getByRole('button',{name:/^Weekly tournaments/}));
    expect(screen.getByRole('status')).toHaveTextContent('/tourhub|null');
    fireEvent.click(screen.getByRole('button',{name:'Return'}));
    expect(screen.getByRole('status')).toHaveTextContent('/notificationmessages|null');
  });
  it('fresh overview arrival discards restored scroll, while POP retains restoration',async()=>{
    function Nav(){const n=useNavigate();return <><button onClick={()=>n('/tourhub')}>Tour</button><button onClick={()=>n(-1)}>Return</button></>;}
    render(<MemoryRouter initialEntries={['/notificationmessages']}><ScrollRestoration/><Nav/></MemoryRouter>);
    scrollPositions.set('/tourhub',777);
    fireEvent.click(screen.getByRole('button',{name:'Tour'}));
    expect(h.top).toHaveBeenCalledWith('instant');expect(scrollPositions.has('/tourhub')).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:'Return'}));
    await waitFor(()=>expect(h.restore).toHaveBeenCalledWith(123,'instant'));
  });
  it('titleInPage omits the duplicate label but names the header',()=>{
    const {container}=render(<MemoryRouter><NewsChromeBridge label="Tour News" mode="menu" backFallback="/tourhub" titleInPage/></MemoryRouter>);
    expect(screen.getByRole('banner',{name:'Tour News'})).toBeInTheDocument();
    expect(container.querySelector('[data-news-bar-title]')).toBeNull();
  });
  it('keeps the title in flow and hides rather than clips when measured room is too small',async()=>{
    let resize:()=>void=()=>{};
    window.ResizeObserver=class {constructor(cb:()=>void){resize=cb;}observe(){}disconnect(){}} as unknown as typeof window.ResizeObserver;
    const {container}=render(<MemoryRouter><NewsChromeBridge label="Amateur News" mode="menu" backFallback="/amateur"/></MemoryRouter>);
    const slot=container.querySelector<HTMLElement>('[data-news-title-slot]');const text=container.querySelector<HTMLElement>('[data-news-bar-title]');
    if(!slot || !text) throw new Error('Missing title slot');
    expect(slot.style.position).not.toBe('absolute');expect(slot.style.flex).toBe('1 1 auto');
    let width=180;Object.defineProperty(slot,'clientWidth',{get:()=>width});Object.defineProperty(text,'scrollWidth',{get:()=>130});
    act(()=>resize());await waitFor(()=>expect(text).toBeVisible());
    width=100;act(()=>resize());await waitFor(()=>expect(text).not.toBeVisible());
    expect(text.style.textOverflow).not.toBe('ellipsis');expect(text.textContent).toBe('Amateur News');
    width=180;act(()=>resize());await waitFor(()=>expect(text).toBeVisible());
  });
});