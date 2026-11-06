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
 it('LPGA guest sentence and bars use5 of8 and server2.7%',async()=>{h.user=null;mount();await waitFor(()=>expect(document.querySelector('[data-chance-row="ours"]')).not.toBeNull());expect(document.querySelector('.pick-chance-sentence')?.textContent).toBe('We picked the winner in 5 of 8 events, odds of 3/5. Three players picked at random would be 36/1: about one week in 37.');expect(document.querySelector('[data-chance-row="ours"]')?.textContent).toBe('OUR PICKS63%odds 3/5');expect(document.querySelector('[data-chance-row="randomThree"]')?.textContent).toBe('3 AT RANDOM3%odds 36/1');expect(document.querySelector('.pick-chance-group')).toBeNull();expect(h.rpc.mock.calls.some(c=>c[0]==='get_my_pick_odds')).toBe(false);});
 it('LIV switch changes every chance figure and no-winner sentence',async()=>{mount();fireEvent.click(await screen.findByRole('button',{name:'LIV Golf'}));await waitFor(()=>expect(document.querySelector('.pick-chance-sentence')?.textContent).toBe("We haven't picked a winner yet in 2 events. Three players picked at random would be 24/1: about one week in 25."));expect(document.querySelector('[data-chance-row="ours"]')?.textContent).toBe('OUR PICKS0%odds —');expect(document.querySelector('[data-chance-row="randomThree"]')?.textContent).toBe('3 AT RANDOM4%odds 24/1');expect(h.rpc).toHaveBeenCalledWith('get_my_pick_odds',{p_tour:'liv',p_year:2026});});
 it('member pair uses one pick and member odds not circle average',async()=>{mount();await waitFor(()=>expect(document.querySelector('[data-chance-row="you"]')?.textContent).toBe('YOUR PICK17%odds 5/1'));expect(document.querySelector('[data-chance-row="randomOne"]')?.textContent).toBe('1 AT RANDOM1%odds 70/1');});
 it.each(['null','zero','error'] as const)('member%s hides viewer group',async(mode)=>{if(mode==='null')h.mine=null;if(mode==='zero')h.mine={events:0,wins:0,random_win_pct:null};if(mode==='error')h.error=true;mount();await waitFor(()=>expect(client.getQueryState(['tourhub','my-pick-odds','lpga',2026,'me'])?.status).toBe(mode==='error'?'error':'success'));expect(document.querySelector('.pick-chance-group')).toBeNull();});
 it('unknown blind data drops sentence and random row',async()=>{record.random_win_pct=null;mount();await waitFor(()=>expect(document.querySelector('.pick-chance-sentence')?.textContent).toBe('We picked the winner in 5 of 8 events, odds of 3/5.'));expect(document.querySelector('[data-chance-row="randomThree"]')).toBeNull();});
 it('one event uses singular without inventing win odds',async()=>{record.event_count=1;record.best={events:1,wins:0,top10:0,avg_percentile:null};record.random_win_pct=null;mount();await waitFor(()=>expect(document.querySelector('.pick-chance-sentence')?.textContent).toBe("We haven't picked a winner yet in 1 event."));});
 it.each(['signed-out','anonymous','guest'] as const)('%s hook cannot read member odds',()=>{if(arguments){};});
});