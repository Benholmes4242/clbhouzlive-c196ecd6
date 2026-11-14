import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import lewy from './fixtures/lewy-amateur-rank-history.json';
import { amateurCareerEntries, amateurCareerTotals, isoWeekThursday } from '@/features/amateur-ranking/rankingTabRules';
const h = vi.hoisted(() => ({ moments: [] as any[], historyError: false, momentsError: false, writes: [] as any[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let op = 'select'; let payload: unknown; const filters: unknown[] = [];
  const b: any = {};
  for (const method of ['select','eq','order']) b[method] = (...args: unknown[]) => { filters.push([method,...args]); return b; };
  for (const method of ['insert','update','delete']) b[method] = (value: unknown) => { op=method; payload=value; return b; };
  b.maybeSingle = () => Promise.resolve({data:{rank:318,best_rank:312,wins:3,top10s:15,counting_events:36,points_average:590.49},error:null});
  b.then = async (resolve: any, reject: any) => {
    if(op !== 'select') { h.writes.push({table,op,payload,filters}); return Promise.resolve({error:null}).then(resolve,reject); }
    const failed = table === 'amateur_rank_history' ? h.historyError : table === 'amateur_career_moments' ? h.momentsError : false;
    const data = table === 'amateur_rank_history' ? lewy : table === 'amateur_career_moments' ? h.moments : [];
    return Promise.resolve({data:failed?null:data,error:failed?new Error('denied'):null}).then(resolve,reject);
  }; return b;
} } }));
import { ProfileRankingTab } from '@/features/amateur-ranking/ProfileRankingTab';
const moment = {id:'m1',user_id:'lewy',year:2025,text:'Club champion',is_win:true,created_at:'2025-12-01T00:00:00Z'};
const clients: QueryClient[] = [];
function mount(owner=false) {
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}}); clients.push(client);
  const view=render(<QueryClientProvider client={client}><ProfileRankingTab userId="lewy" isOwner={owner}/></QueryClientProvider>);
  return {...view,client};
}
beforeEach(()=>{h.moments=[];h.historyError=false;h.momentsError=false;h.writes=[];});
afterEach(()=>{cleanup();clients.splice(0).forEach(c=>c.clear());});
it('whole WAGR career has 5 wins, 21 top tens and 46 distinct events',()=>{expect(lewy).toHaveLength(124);expect(amateurCareerTotals(lewy)).toEqual({wins:5,top10s:21,events:46});});
it('duplicate events count once and only whole-number finishes 1 to 10 count',()=>{
  const row=lewy[0];expect(amateurCareerTotals([row,row,{...row,id:900,event_id:900,finish:'T2'},{...row,id:901,event_id:901,finish:'1.5'},{...row,id:902,event_id:null,finish:'1'}])).toEqual({wins:1,top10s:1,events:3});
});
it('Lewy ten derived entries match the exact signed-off order',()=>{
  expect(amateurCareerEntries(lewy,[]).map(e=>[e.year,e.text])).toEqual([
    [2026,'Career-high world amateur ranking, #312'],[2026,"2nd, Swedish International Men's Amateur Championship"],
    [2025,'Won West of England Open Amateur Match Play'],[2025,'Won Walton Heath Trophy (Michael Lunt Salver)'],[2025,'2nd, Irish Men’s Amateur Open Championship'],
    [2024,'Won 32nd Junior European Open with Sky Sports'],[2024,'3rd, FJT - England Championship (South III)'],[2024,'Won West Of England Under 18 Open Amateur Strokeplay'],
    [2024,'Won Midland Youths Open Amateur Championship (Kymin)'],[2024,'First world amateur ranking event, Midland Youths Open Amateur Championship (Kymin)']]);
});
it('career high includes eventless rows and takes earliest tied week',()=>{
  const rows=[...lewy,{...lewy[119],id:999,week:202642}];const high=amateurCareerEntries(rows,[]).find(e=>e.kind===0);
  expect(high?.id).toBe('0-120');expect(high?.order).toBe(isoWeekThursday(202641).toISOString());
});
it('all five wins are gold while three podium entries are not',()=>{const entries=amateurCareerEntries(lewy,[]);expect(entries.filter(e=>e.is_win)).toHaveLength(5);expect(entries.filter(e=>e.kind===1&&!e.is_win)).toHaveLength(3);});
it('podiums retain only the five most recent ranked events',()=>{
  const rows=Array.from({length:7},(_,i)=>({...lewy[0],id:i+1,event_id:i+1,week:202601+i,finish:i%2?'2':'3'}));
  expect(amateurCareerEntries(rows,[]).filter(e=>e.kind===1).map(e=>e.id)).toEqual(['1-7','1-6','1-5','1-4','1-3']);
});
it('first event uses ISO Thursday year and member moments sort after derived entries',()=>{
  const entries=amateurCareerEntries([{...lewy[0],week:202001}],[{...moment,year:2020}]);
  expect(entries.map(e=>e.kind)).toEqual([0,1,2,3]);expect(entries.every(e=>e.year===2020)).toBe(true);expect(entries[2]).toMatchObject({derived:false,is_win:true,text:'Club champion'});
});
it('career tiles render 312th, 5, 21 and 46 rather than rolling summary',async()=>{
  const {container}=mount();await waitFor(()=>expect([...container.querySelectorAll('.amr-tile b')].map(e=>e.textContent)).toEqual(['312th','5','21','46']));
});
it('failed history produces three unknown career tiles and preserves member moments',async()=>{
  h.historyError=true;h.moments=[moment];const {container}=mount();await screen.findByText('Club champion');
  expect([...container.querySelectorAll('.amr-tile b')].map(e=>e.textContent)).toEqual(['312th','–','–','–']);expect(container.querySelectorAll('[data-career-entry]')).toHaveLength(1);
});
it('failed moments leaves derived entries only',async()=>{h.momentsError=true;const {container}=mount();await waitFor(()=>expect(container.querySelectorAll('[data-career-entry]')).toHaveLength(10));expect(screen.getAllByText('From WAGR')).toHaveLength(10);});
it('visitor has no editing doors and source lines only on derived entries',async()=>{h.moments=[moment];const {container}=mount();await screen.findByText('Club champion');expect(container.querySelectorAll('[data-career-entry]')).toHaveLength(11);expect(screen.getAllByText('From WAGR')).toHaveLength(10);expect(screen.queryByRole('button',{name:'Edit'})).toBeNull();expect(screen.queryByRole('button',{name:'Add'})).toBeNull();});
it('owner without moments has Add but no Edit',async()=>{mount(true);await screen.findByRole('button',{name:'Add'});expect(screen.queryByRole('button',{name:'Edit'})).toBeNull();});
it('owner with moments has both editing doors',async()=>{h.moments=[moment];mount(true);expect(await screen.findByRole('button',{name:'Edit'})).toBeTruthy();expect(screen.getByRole('button',{name:'Add'})).toBeTruthy();});
it('amateur add writes its own table and invalidates its own query',async()=>{
  const {client}=mount(true);const invalidated=vi.spyOn(client,'invalidateQueries');fireEvent.click(await screen.findByRole('button',{name:'Add'}));
  fireEvent.change(screen.getByLabelText('WHAT HAPPENED'),{target:{value:'County first team debut'}});fireEvent.change(screen.getByLabelText('YEAR'),{target:{value:'2026'}});fireEvent.click(screen.getByRole('switch'));fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(h.writes).toHaveLength(1));expect(h.writes[0]).toMatchObject({table:'amateur_career_moments',op:'insert',payload:{user_id:'lewy',year:2026,text:'County first team debut',is_win:true}});await waitFor(()=>expect(invalidated).toHaveBeenCalledWith({queryKey:['amateur-career','lewy']}));
});
it('amateur edit writes its own table and invalidates its own query',async()=>{
  h.moments=[moment];const {client}=mount(true);const invalidated=vi.spyOn(client,'invalidateQueries');fireEvent.click(await screen.findByRole('button',{name:'Edit'}));fireEvent.click(screen.getByRole('button',{name:/2025 · Club champion/}));fireEvent.change(screen.getByLabelText('WHAT HAPPENED'),{target:{value:'County champion'}});fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(h.writes).toHaveLength(1));expect(h.writes[0]).toMatchObject({table:'amateur_career_moments',op:'update',payload:{text:'County champion'},filters:expect.arrayContaining([['eq','id','m1'],['eq','user_id','lewy']])});await waitFor(()=>expect(invalidated).toHaveBeenCalledWith({queryKey:['amateur-career','lewy']}));
});
it('amateur remove deletes its own row and invalidates its own query',async()=>{
  h.moments=[moment];const {client}=mount(true);const invalidated=vi.spyOn(client,'invalidateQueries');fireEvent.click(await screen.findByRole('button',{name:'Edit'}));fireEvent.click(screen.getByRole('button',{name:/2025 · Club champion/}));fireEvent.click(screen.getByRole('button',{name:'Remove'}));
  await waitFor(()=>expect(h.writes).toHaveLength(1));expect(h.writes[0]).toMatchObject({table:'amateur_career_moments',op:'delete',filters:expect.arrayContaining([['eq','id','m1'],['eq','user_id','lewy']])});await waitFor(()=>expect(invalidated).toHaveBeenCalledWith({queryKey:['amateur-career','lewy']}));
});