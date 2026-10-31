import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
const mocks=vi.hoisted(()=>({from:vi.fn(),guest:false,gate:vi.fn(),guard:vi.fn(),user:{id:'member'}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:mocks.user})}));
vi.mock('@/features/guest/useIsGuest',()=>({useIsGuest:()=>mocks.guest}));
vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>mocks.gate,assertNotGuestWrite:mocks.guard}));
import { readBoardHoles } from '@/features/tourhub/leaderboard/useBoardHoles';
import { useTourPlayerFollows, writeTourPlayerFollow } from '@/features/tourhub/leaderboard/useTourPlayerFollows';
afterEach(()=>{cleanup();vi.clearAllMocks();mocks.guest=false;});
function setup(result:{data?:unknown;error?:unknown}={data:[],error:null}) {const chain:any={};for(const name of ['select','eq','order','limit','delete','insert'])chain[name]=vi.fn(()=>chain);chain.then=(resolve:any)=>Promise.resolve(result).then(resolve);mocks.from.mockReturnValue(chain);return chain;}
const wrapper=({children}:{children:ReactNode})=><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>;
describe('whole-field read and member writes',()=>{
  it('one sr_scorecards read filters tournament and round, never player',async()=>{const chain=setup();await readBoardHoles('event',3);expect(mocks.from).toHaveBeenCalledTimes(1);expect(mocks.from).toHaveBeenCalledWith('sr_scorecards');expect(chain.eq.mock.calls).toEqual([['tournament_id','event'],['round_number',3]]);});
  it('follow inserts the member and player ids',async()=>{const chain=setup();await writeTourPlayerFollow('member','a',false);expect(chain.insert).toHaveBeenCalledWith({user_id:'member',player_id:'a'});expect(chain.delete).not.toHaveBeenCalled();});
  it('unfollow deletes only the member-owned player pair',async()=>{const chain=setup();await writeTourPlayerFollow('member','a',true);expect(chain.delete).toHaveBeenCalledTimes(1);expect(chain.eq.mock.calls).toEqual([['user_id','member'],['player_id','a']]);});
  it('guest follow opens action follow and does not read or write',async()=>{setup();mocks.guest=true;mocks.gate.mockReturnValue(true);const {result}=renderHook(()=>useTourPlayerFollows(),{wrapper});act(()=>result.current.toggle('a'));expect(mocks.gate).toHaveBeenCalledWith('follow');expect(mocks.from).not.toHaveBeenCalled();});
  it('member follow is optimistic and rolls back on refusal',async()=>{const chain=setup({data:[],error:null});const {result}=renderHook(()=>useTourPlayerFollows(),{wrapper});await waitFor(()=>expect(chain.select).toHaveBeenCalled());mocks.gate.mockReturnValue(false);setup({data:null,error:new Error('refused')});act(()=>result.current.toggle('a'));await waitFor(()=>expect(result.current.error).toBeTruthy());expect(result.current.ids.has('a')).toBe(false);});
});