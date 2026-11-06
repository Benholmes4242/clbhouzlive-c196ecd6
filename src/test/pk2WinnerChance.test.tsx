import React from 'react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,renderHook,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {createInstance} from 'i18next';
import {I18nextProvider,initReactI18next} from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
const h=vi.hoisted(()=>({rpc:vi.fn(),guest:false,user:{id:'me',is_anonymous:false} as {id:string;is_anonymous:boolean}|null,error:false,mine:{events:6,wins:1,random_win_pct:1.4} as {events:number;wins:number;random_win_pct:number|null}|null}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:h.rpc}}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:h.user})}));
vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>h.guest?{id:'guest'}:null}));
import {OurRecordSheet} from '@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet';
import {useMyPickOdds,type PickRecord} from '@/features/tourhub/hooks/usePickInsights';
const language=createInstance();
void language.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},initAsync:false,interpolation:{escapeValue:false}});
let client:QueryClient,record:PickRecord;
const wrapper=({children}:{children:React.ReactNode})=><MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={language}>{children}</I18nextProvider></QueryClientProvider></MemoryRouter>;
const mount=()=>render(<OurRecordSheet open onClose={()=>{}} tour="lpga" year={2026}/>,{wrapper});
beforeEach(()=>{
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});h.user={id:'me',is_anonymous:false};h.guest=false;h.error=false;h.mine={events:6,wins:1,random_win_pct:1.4};
 record={tours:['lpga','liv'],picks:24,event_count:8,won:5,top10:13,avg_percentile:74,best:{events:8,wins:5,top10:8,avg_percentile:90},random_win_pct:2.7,avg_field_size:72,first_event_date:null,events:[]};
 h.rpc.mockReset().mockImplementation(async(name:string,args:{p_tour:string})=>{
  if(name==='get_my_pick_odds')return{data:h.mine,error:h.error?{message:'denied'}:null};
  if(name==='get_our_pick_record')return{data:args.p_tour==='liv'?{...record,event_count:2,best:{...record.best,wins:0},random_win_pct:4}:record,error:null};
  return{data:[],error:null};
 });
});
afterEach(()=>{cleanup();client.clear();});
describe('PK2 winner chance',()=>{
 it('LPGA guest shows counts and blind winner odds without viewer rows',async()=>{h.user=null;mount();await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')).not.toBeNull());expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS5 of 8events');expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="random"]')?.textContent).toBe('3 AT RANDOM36/1');expect(document.querySelector('.pick-chance-sentence')?.textContent).toBe('Our picks find the winner 23× as often as blind picks.');expect(document.querySelector('[data-chance-row="you"]')).toBeNull();expect(h.rpc.mock.calls.some(c=>c[0]==='get_my_pick_odds')).toBe(false);});
 it('LIV switch changes every chance figure and drops the winner multiple',async()=>{mount();fireEvent.click(await screen.findByRole('button',{name:'LIV Golf'}));await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS0 of 2events'));expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="random"]')?.textContent).toBe('3 AT RANDOM24/1');expect(document.querySelector('[data-chance-group="winner"] .pick-chance-x')).toBeNull();expect(document.querySelector('.pick-chance-sentence')).toBeNull();expect(h.rpc).toHaveBeenCalledWith('get_my_pick_odds',{p_tour:'liv',p_year:2026});});
 it('member winner row uses one blind pick from member odds',async()=>{mount();await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="you"]')?.textContent).toBe('YOUR PICK1 of 612× a blind pick'));});
 it.each(['null','zero','error'] as const)('member%s hides viewer rows',async(mode)=>{if(mode==='null')h.mine=null;if(mode==='zero')h.mine={events:0,wins:0,random_win_pct:null};if(mode==='error')h.error=true;mount();await waitFor(()=>expect(client.getQueryState(['tourhub','my-pick-odds','lpga',2026,'me'])?.status).toBe(mode==='error'?'error':'success'));expect(document.querySelector('[data-chance-row="you"]')).toBeNull();});
 it('unknown blind data drops headline and random rows',async()=>{record.random_win_pct=null;mount();await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')).not.toBeNull());expect(document.querySelector('.pick-chance-sentence')).toBeNull();expect(document.querySelector('[data-chance-row="random"]')).toBeNull();});
 it('one event uses singular without inventing a multiple',async()=>{record.event_count=1;record.best={events:1,wins:0,top10:0,avg_percentile:null};record.random_win_pct=null;mount();await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS0 of 1event'));expect(document.querySelector('.pick-chance-sentence')).toBeNull();});
 it.each(['signed-out','anonymous','guest'] as const)('%s hook cannot read member odds',mode=>{if(mode==='signed-out')h.user=null;if(mode==='anonymous')h.user={id:'anon',is_anonymous:true};if(mode==='guest')h.guest=true;renderHook(()=>useMyPickOdds('lpga',2026),{wrapper});expect(h.rpc).not.toHaveBeenCalled();});
 it('member odds cache is keyed by identity and selected tour',async()=>{const hook=renderHook(()=>useMyPickOdds('lpga',2026),{wrapper});await waitFor(()=>expect(hook.result.current.data?.events).toBe(6));expect(client.getQueryData(['tourhub','my-pick-odds','lpga',2026,'me'])).toEqual(h.mine);h.user={id:'other',is_anonymous:false};h.mine={events:2,wins:0,random_win_pct:.4};hook.rerender();await waitFor(()=>expect(hook.result.current.data?.events).toBe(2));expect(client.getQueryData(['tourhub','my-pick-odds','lpga',2026,'other'])).toEqual(h.mine);expect(h.rpc.mock.calls.filter(c=>c[0]==='get_my_pick_odds')).toHaveLength(2);});
});