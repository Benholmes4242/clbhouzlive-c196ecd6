import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../src/locales/en/tourhub.json';
const h=vi.hoisted(()=>({rpc:vi.fn(),user:{id:'me',is_anonymous:false} as {id:string;is_anonymous:boolean}|null,gate:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:h.rpc}}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:h.user})}));
vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>null}));
vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>h.gate}));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes',()=>({usePickTeeTimes:()=>({data:new Map([['a','2026-11-05T18:38:00Z']]),isError:false})}));
import { PicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
const language=createInstance();
void language.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},initAsync:false,interpolation:{escapeValue:false}});
let client:QueryClient;
const field=[{player_id:'a',full_name:'Ben Griffin',country:'United States',world_rank:28,photo_url:null,headshot_override:null},{player_id:'b',full_name:'Marco Penge',country:'England',world_rank:53,photo_url:null,headshot_override:null}];
const wrap=({children}:{children:React.ReactNode})=><QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;
beforeEach(()=>{
 client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});h.user={id:'me',is_anonymous:false};h.gate.mockReset().mockReturnValue(true);
 h.rpc.mockReset().mockImplementation(async(name:string,args:{p_player_id?:string})=>{
  if(name==='get_pick_field')return{data:field,error:null};
  if(name==='get_our_pick_record')return{data:{picks:30,event_count:10,won:3,top10:13},error:null};
  return{data:[],error:null};
 });
});
afterEach(()=>{cleanup();client.clear();});
describe('pick sheet v2 rules',()=>{

 it('record continuation reads ten events not thirty picks',async()=>{render(<PicksBlock picks={[]} tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={[]} startedPlayers={new Set()} onOpenRecord={vi.fn()} onOpenPick={vi.fn()} boardByPlayer={new Map()} teeByPlayer={null} championPlayerId={null} championPlayerIds={[]} intro={null}/>,{wrapper:wrap});await waitFor(()=>expect(document.querySelector('[data-our-record-door] [data-pick-record-events]')?.textContent).toBe('from 10 events'));});
});