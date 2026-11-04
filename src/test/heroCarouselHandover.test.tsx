import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {renderHook,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import type {CachedTournament,TournamentsCache} from '@/hooks/useTournamentsCache';
const fixture=vi.hoisted(()=>({cache:{live:[],completed:[],upcoming:[],all:[]} as TournamentsCache}));
vi.mock('@/hooks/useTournamentsCache',()=>({useTournamentsCache:()=>({data:fixture.cache,isLoading:false})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{const q:Record<string,unknown>={};for(const key of ['select','in','gt','not','eq','or'])q[key]=()=>q;q.then=(resolve:(v:unknown)=>unknown)=>Promise.resolve(resolve({data:[],error:null}));return q;}}}));
import {useHeroCarouselData} from '@/features/tourhub/hooks/useHeroCarouselData';
import {daysUntilStartDate,UPCOMING_HANDOVER_DAYS} from '@/features/tourhub/components/overview-v3/HybridHero.utils';
let client:QueryClient;
const row=(id:string,tour:string,start:string,end:string,status='closed'):CachedTournament=>({id,name:id,status,start_date:start,end_date:end,event_type:'stroke',purse:null,winning_share:null,currency:null,venue_id:null,venue_name:null,venue_course_name:null,venue_city:null,venue_state:null,venue_country:null,venue_par:null,venue_yardage:null,winner_id:null,defending_champion:null,champion_narrative:null,season_id:null,current_round:null,current_round_status:null,season:{id:tour,tour_id:tour,tour_name:tour,year:2026}});
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});fixture.cache={live:[],completed:[],upcoming:[],all:[]};});
afterEach(()=>{cleanup();client.clear();vi.useRealTimers();});
async function slide(today:string,end='2026-11-01',start:string|null='2026-11-05'){
 vi.setSystemTime(new Date(today+'T23:59:00Z'));
 fixture.cache.completed=[row('result','pga','2026-10-29',end)];
 fixture.cache.upcoming=start===null?[]:[row('next','pga',start,'2026-11-08','scheduled')];
 const {result}=renderHook(()=>useHeroCarouselData(),{wrapper:({children}:{children:React.ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});
 await waitFor(()=>expect(result.current.isSuccess).toBe(true));return result.current.data??[];
}
describe('Hero carousel upcoming handover',()=>{
 it.each([['2026-11-02','completed'],['2026-11-03','upcoming'],['2026-11-04','upcoming']])('Sunday result on %s is %s',async(today,type)=>{expect((await slide(today))[0]?.type).toBe(type);});
 it.each([['2026-11-02','completed'],['2026-11-03','upcoming']])('Monday weather finish on %s is %s',async(today,type)=>{expect((await slide(today,'2026-11-02'))[0]?.type).toBe(type);});
 it.each([['2026-11-04','completed'],['2026-11-05','upcoming']])('off week on %s is %s',async(today,type)=>{expect((await slide(today,'2026-11-01','2026-11-11'))[0]?.type).toBe(type);});
 it('no upcoming retains results through day14',async()=>{expect((await slide('2026-11-15','2026-11-01',null))[0]?.type).toBe('completed');});
 it('no upcoming omits tour on day15',async()=>{expect(await slide('2026-11-16','2026-11-01',null)).toEqual([]);});
 it('missing upcoming start preserves the three-day result window',async()=>{expect((await slide('2026-11-04','2026-11-01',''))[0]?.type).toBe('completed');});
 it('real PGA and LPGA November4 slides are upcoming',async()=>{
  vi.setSystemTime(new Date('2026-11-04T04:28:00Z'));
  fixture.cache.completed=[row('Mexico','pga','2026-10-29','2026-11-01'),row('Maybank','lpga','2026-10-29','2026-11-01')];
  fixture.cache.upcoming=[row('World Wide Technology Championship','pga','2026-11-05','2026-11-08','scheduled'),row('TOTO Japan Classic','lpga','2026-11-05','2026-11-08','scheduled')];
  const {result}=renderHook(()=>useHeroCarouselData(),{wrapper:({children}:{children:React.ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});
  await waitFor(()=>expect(result.current.isSuccess).toBe(true));expect(result.current.data?.map(s=>[s.tournament.tourSlug,s.type])).toEqual([['pga','upcoming'],['lpga','upcoming']]);
 });
 it('live event retains priority',async()=>{fixture.cache.live=[row('live','pga','2026-11-01','2026-11-05','inprogress')];expect((await slide('2026-11-04'))[0]?.type).toBe('live');});
 it.each([['2026-11-03',2],['2026-11-04',1],['2026-11-05',0]])('Thursday start is %s plus %s UTC days', (today,days)=>{vi.setSystemTime(new Date(today+'T23:59:59Z'));expect(daysUntilStartDate('2026-11-05')).toBe(days);expect(UPCOMING_HANDOVER_DAYS).toBe(2);});
});