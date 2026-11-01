import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
const mocks=vi.hoisted(()=>({from:vi.fn(),follows:new Set<string>()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows',()=>({useTourPlayerFollows:()=>({ids:mocks.follows})}));
import { liveNewsRounds, readNewsBoards, useOverviewNewsData } from '@/features/tourhub/overview/sections/useOverviewNewsData';
import type { TournamentsCache, CachedTournament } from '@/hooks/useTournamentsCache';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
afterEach(()=>{vi.clearAllMocks();mocks.follows.clear();});
function setup(){const c:Record<string,ReturnType<typeof vi.fn>>={};for(const n of ['select','in','limit'])c[n]=vi.fn(()=>c);c.then=vi.fn((resolve)=>Promise.resolve({data:[],error:null}).then(resolve));mocks.from.mockReturnValue(c);return c;}
describe('Overview News batch ownership',()=>{
  it('one leaderboard read covers all live story tournaments and only story players',async()=>{const c=setup();await readNewsBoards(['t1','t2'],['a','b']);expect(mocks.from.mock.calls).toEqual([['sr_leaderboards']]);expect(c.in).toHaveBeenCalledWith('tournament_id',['t1','t2']);expect(c.in).toHaveBeenCalledWith('player_id',['a','b']);});
  it('no live tournaments makes no leaderboard read',async()=>{setup();await readNewsBoards([],['a']);expect(mocks.from).not.toHaveBeenCalled();});
  it('no story players makes no leaderboard read',async()=>{setup();await readNewsBoards(['t'],[]);expect(mocks.from).not.toHaveBeenCalled();});
  for(const [status,live] of [['inprogress',true],['in_progress',true],['suspended',true],['closed',false],['scheduled',false],['playoff',false]] as const)it(`hero state ${status} is shared`,()=>{const cache={live:[{id:'t',status,start_date:'2026-10-29',end_date:'2026-11-01',current_round:4} as CachedTournament]} as TournamentsCache;expect(liveNewsRounds(cache).get('t')).toBe(live?4:undefined);});
  it('observes the existing tournament cache without reading tournaments',async()=>{
    setup();const client=new QueryClient({defaultOptions:{queries:{retry:false}}});client.setQueryData(['tournaments-cache'],{live:[{id:'t',status:'inprogress',start_date:'2026-10-29',end_date:'2026-11-01',current_round:4}],all:[],completed:[],upcoming:[]});
    const stories=[{id:'story',tournament_id:'t',body_blocks:[{type:'player',player_id:'a'}]} as TourStory];
    const r=renderHook(()=>useOverviewNewsData(stories),{wrapper:({children})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});
    await waitFor(()=>expect(mocks.from).toHaveBeenCalledTimes(1));expect(mocks.from.mock.calls).toEqual([['sr_leaderboards']]);expect(r.result.current.get('story')?.liveRound).toBe(4);r.unmount();client.clear();
  });
});