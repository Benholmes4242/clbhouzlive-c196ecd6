import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PersonSuggestion, BusinessSuggestion } from '@/features/find-people/findPeopleRules';
import type { KindPerson } from '@/features/find-people/railRules';
const h = vi.hoisted(() => ({ user: {id:'viewer'} as {id:string; is_anonymous?:boolean} | null, rpc:vi.fn(), media:[] as unknown[], covers:[] as unknown[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase:{ rpc:h.rpc, from:() => ({insert:() => Promise.resolve({error:null})}) } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession:() => ({user:h.user}) }));
vi.mock('@/context/ActiveActorContext', () => ({useActiveActor:() => ({activeActor:null})}));
vi.mock('@/hooks/useToggleFollow', () => ({useToggleFollow:() => ({mutateAsync:vi.fn()})}));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({usePeopleSuggestions:() => ({data:people}), useBusinessSuggestions:() => ({data:[business]})}));
vi.mock('@/features/find-people/usePeopleToFollowByKind', () => ({usePeopleToFollowByKind:(kind:string) => ({data:kind === 'pro' ? pros : []})}));
vi.mock('@/utils/analyticsEvents', () => ({analyticsEvents:{track:vi.fn()}}));
import { WhoToFollowRail, KindRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import { useFollowTileMedia } from '@/features/find-people/useFollowTileMedia';
import { invalidateProMembers } from '@/features/pro-verification/proMembersCache';
const people:PersonSuggestion[] = ['person','other','third'].map(id => ({user_id:id, display_name:id, username:id, profile_photo_url:null, reason_type:'popular', reason_club_name:null, reason_course_name:null, reason_date:null, mutual_count:null, recent_rounds:null, rounds_total:12, handicap_index:4, is_verified:false}));
const business:BusinessSuggestion = {business_id:'business', name:'business', slug:'business', logo_url:null, category:'Golf Club', city:null, is_verified:false, followers:12, reason_type:'your_club', distance_miles:null};
const pros:KindPerson[] = ['pro','pro2','pro3'].map(id => ({user_id:id,display_name:id,username:id,profile_photo_url:null,pro_kind:'tour_pro',pro_tour:'PGA Tour',pro_club:null,videos:null,mutual_count:null,followers:12}));
const mediaRow = (id:string, kind='person', type='image') => ({id,kind,media_type:type,image_url:`https://media.clbhouz.co.uk/${id}.jpg`,aspect_ratio:1,posted_at:new Date().toISOString()});
const coverRow = (id:string, kind='person') => ({id,kind,cover_url:`https://media.clbhouz.co.uk/${id}-cover.jpg`});
function wrapper({children}:{children:React.ReactNode}) {
  const [client] = React.useState(() => new QueryClient({defaultOptions:{queries:{retry:false}}}));
  return <QueryClientProvider client={client}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
}
function tile(id:string) { const el=screen.getByText(id).closest('[data-follow-tile-source]'); if (!el) throw Error('tile missing'); return el; }
beforeEach(() => {
  resetWhoToFollowRailSessionForTests(); invalidateProMembers(); h.user={id:'viewer'}; h.media=[]; h.covers=[];
  h.rpc.mockReset().mockImplementation((name:string) => Promise.resolve({error:null,data:name === 'get_follow_tile_media' ? h.media : name === 'get_suggestion_covers' ? h.covers : name === 'get_pro_members' ? pros.map(p=>({user_id:p.user_id,pro_kind:'tour_pro'})) : []}));
});
afterEach(cleanup);
describe('Option B source priority', () => {
  for (const [id,kind] of [['person','person'],['business','business'],['pro','person']]) {
    it(`media beats cover for ${id}`, async () => {
      h.media=[mediaRow(id,kind)]; h.covers=[coverRow(id,kind)];
      render(id==='pro' ? <KindRail kind="pro"/> : <WhoToFollowRail slot={1}/>,{wrapper});
      await waitFor(()=>expect(tile(id).getAttribute('data-follow-tile-source')).toBe('media'));
      expect(tile(id).querySelector('.follow-tile-image')?.getAttribute('src')).toBe(`https://media.clbhouz.co.uk/${id}.jpg`);
    });
    it(`cover beats nothing for ${id}`, async () => {
      h.covers=[coverRow(id,kind)]; render(id==='pro' ? <KindRail kind="pro"/> : <WhoToFollowRail slot={1}/>,{wrapper});
      await waitFor(()=>expect(tile(id).getAttribute('data-follow-tile-source')).toBe('cover'));
      expect(tile(id).querySelector('[data-testid="rail-when"]')).toBeNull();
      expect(tile(id).querySelector('[data-testid="rail-figures"]')).not.toBeNull();
    });
    it(`no media or cover shows no-image avatar for ${id}`, async () => {
      render(id==='pro' ? <KindRail kind="pro"/> : <WhoToFollowRail slot={1}/>,{wrapper});
      await waitFor(()=>expect(tile(id).getAttribute('data-follow-tile-source')).toBe('none'));
      expect(tile(id).querySelector('[data-follow-tile-avatar="large"] [data-avatar-fallback]')).not.toBeNull();
      expect(tile(id).querySelector('[data-follow-tile-avatar="small"], [data-photo-band-fade], .follow-tile-image')).toBeNull();
    });
  }
  it('image errors fall from media to cover to nothing', async () => {
    h.media=[mediaRow('person')]; h.covers=[coverRow('person')]; render(<WhoToFollowRail slot={1}/>,{wrapper});
    await waitFor(()=>expect(tile('person').getAttribute('data-follow-tile-source')).toBe('media'));
    let img=tile('person').querySelector('.follow-tile-image'); if (!img) throw Error('media missing'); fireEvent.error(img);
    expect(tile('person').getAttribute('data-follow-tile-source')).toBe('cover');
    expect(tile('person').querySelector('[data-testid="rail-when"]')).toBeNull();
    img=tile('person').querySelector('.follow-tile-image'); if (!img) throw Error('cover missing'); fireEvent.error(img);
    expect(tile('person').getAttribute('data-follow-tile-source')).toBe('none');
  });
  it('video is a poster with a play glyph and never a video element', async () => {
    h.media=[mediaRow('pro','person','video')]; render(<KindRail kind="pro"/>,{wrapper});
    await waitFor(()=>expect(tile('pro').querySelector('[data-follow-tile-play]')).not.toBeNull());
    expect(tile('pro').querySelector('video')).toBeNull();
    expect(tile('pro').querySelector('[data-testid="rail-when"]')?.textContent).toBe('Posted just now');
    expect(tile('pro').querySelector('[data-testid="rail-figures"]')).toBeNull();
    await waitFor(()=>expect(tile('pro').querySelector('.pro-label')).not.toBeNull());
  });
  for (const slow of ['get_follow_tile_media','get_suggestion_covers']) {
    it(`waits for both reads when ${slow} is pending`, async () => {
      let resolve:((value:{data:unknown[];error:null})=>void)|undefined;
      h.rpc.mockImplementation((name:string) => name===slow ? new Promise(r=>{resolve=r;}) : Promise.resolve({data:name==='get_follow_tile_media' ? [mediaRow('person')] : name==='get_suggestion_covers' ? [coverRow('person')] : [],error:null}));
      render(<WhoToFollowRail slot={1}/>,{wrapper});
      await waitFor(()=>expect(h.rpc.mock.calls.some(c=>c[0]===slow)).toBe(true));
      expect(tile('person').getAttribute('data-follow-tile-source')).toBe('pending');
      expect(tile('person').querySelector('.follow-tile-image, [data-photo-band-fade]')).toBeNull();
      if (!resolve) throw Error('resolver missing'); resolve({data:slow==='get_follow_tile_media' ? [mediaRow('person')] : [coverRow('person')],error:null});
      await waitFor(()=>expect(tile('person').getAttribute('data-follow-tile-source')).toBe('media'));
    });
  }
  it('media read error settles and permits cover fallback', async () => {
    h.rpc.mockImplementation((name:string)=>Promise.resolve(name==='get_follow_tile_media' ? {error:Error('denied'),data:null} : {error:null,data:name==='get_suggestion_covers' ? [coverRow('person')] : []}));
    render(<WhoToFollowRail slot={1}/>,{wrapper});
    await waitFor(()=>expect(tile('person').getAttribute('data-follow-tile-source')).toBe('cover'));
  });
  it('Follow and dismiss carry no Button variant or size classes', async () => {
    render(<WhoToFollowRail slot={1}/>,{wrapper});
    await waitFor(()=>expect(tile('person').getAttribute('data-follow-tile-source')).toBe('none'));
    const follow=tile('person').querySelector('.follow-tile-follow'); if (!follow) throw Error('follow missing');
    const dismiss=tile('person').querySelector('.follow-tile-dismiss'); if (!dismiss) throw Error('dismiss missing');
    for (const button of [follow,dismiss]) {
      for (const cls of ['h-11','h-10','rounded-[10px]','bg-transparent']) expect(button.className).not.toContain(cls);
    }
    expect(follow.className).toContain('follow-tile-follow');
    expect(dismiss.className).toContain('follow-tile-dismiss');
  });
  it('makes one media call per mounted rail surface', async () => {
    render(<><WhoToFollowRail slot={1}/><KindRail kind="pro"/></>,{wrapper});
    await waitFor(()=>expect(h.rpc.mock.calls.filter(c=>c[0]==='get_follow_tile_media')).toHaveLength(2));
    expect(h.rpc).toHaveBeenCalledWith('get_follow_tile_media',{p_user_ids:['person','other','third'],p_business_ids:['business']});
    expect(h.rpc).toHaveBeenCalledWith('get_follow_tile_media',{p_user_ids:['pro','pro2','pro3'],p_business_ids:[]});
  });
});
describe('media hook request contract', () => {
  it('caps ids at 100 per kind in display order', async () => {
    const p=Array.from({length:105},(_,i)=>`p${i}`), b=Array.from({length:102},(_,i)=>`b${i}`);
    const {result}=renderHook(()=>useFollowTileMedia(p,b),{wrapper});
    await waitFor(()=>expect(result.current.settled).toBe(true));
    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith('get_follow_tile_media',{p_user_ids:p.slice(0,100),p_business_ids:b.slice(0,100)});
  });
  it('sorted keys reuse the same cache when ids reorder', async () => {
    const {result,rerender}=renderHook(({ids})=>useFollowTileMedia(ids,[]),{initialProps:{ids:['b','a']},wrapper});
    await waitFor(()=>expect(result.current.settled).toBe(true)); rerender({ids:['a','b']});
    expect(h.rpc).toHaveBeenCalledTimes(1);
  });
  for (const state of ['signed-out','anonymous','no-ids']) {
    it(`does not call media for ${state}`, async () => {
      if(state==='signed-out') h.user=null; if(state==='anonymous') h.user={id:'guest',is_anonymous:true};
      const {result}=renderHook(()=>useFollowTileMedia(state==='no-ids' ? [] : ['a'],[]),{wrapper});
      expect(result.current.settled).toBe(true); expect(h.rpc).not.toHaveBeenCalled();
    });
  }
});