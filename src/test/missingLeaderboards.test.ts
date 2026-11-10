import { describe, it, expect, vi } from 'vitest';
import { backfillMissingLeaderboards } from '../../supabase/functions/sportradar-sync/missingLeaderboards';
const setup = (events: any[], counts: number[] = []) => {
  const calls: any[]=[];
  const db={from:(table:string)=>{const call:any={table};calls.push(call);const q:any={select:(...v:any[])=>{call.select=v;return q;},eq:(...v:any[])=>{(call.eq??=[]).push(v);return q;},gte:(...v:any[])=>{call.gte=v;return q;},lte:()=>q,is:(...v:any[])=>{call.is=v;return q;},order:()=>q,limit:(n:number)=>{call.limit=n;return q;},then:(resolve:any)=>Promise.resolve(table==='sr_tournaments'?{data:events.slice(0,call.limit)}:{count:counts.shift()??0}).then(resolve)};return q;}};
  return {db,calls};
};
const event=(n:number)=>({id:`id${n}`,sr_id:`sr${n}`,name:`Event ${n}`,season:{tour_name:'PGAD',year:2025}});
describe('manual missing-leaderboard sweep',()=>{
  it('finds only closed missing events in 400 days and caps each run at 25',async()=>{
    const {db,calls}=setup(Array.from({length:30},(_,i)=>event(i)),Array(25).fill(1));const sync=vi.fn().mockResolvedValue({records:1});
    const result=await backfillMissingLeaderboards(db,sync,vi.fn().mockResolvedValue(undefined),new Date('2026-11-10T12:00:00Z'));
    expect(result).toEqual({checked:25,filled:25,still_missing:[]});
    expect(calls[0].eq).toContainEqual(['status','closed']);expect(calls[0].gte).toEqual(['start_date','2025-10-06']);expect(calls[0].is).toEqual(['sr_leaderboards',null]);expect(calls[0].limit).toBe(25);
  });
  it('uses season tour/year and sr_id sequentially with 1500ms between calls',async()=>{
    const {db}=setup([event(1),event(2)],[1,1]);const order:string[]=[];const sync=vi.fn(async()=>{order.push('sync');});const pause=vi.fn(async()=>{order.push('pause');});
    await backfillMissingLeaderboards(db,sync,pause);
    expect(sync.mock.calls).toEqual([['pgad',2025,'sr1'],['pgad',2025,'sr2']]);expect(order).toEqual(['sync','pause','sync']);expect(pause).toHaveBeenCalledExactlyOnceWith(1500);
  });
  it('counts filled only after persisted rows exist and reports unavailable or failed names',async()=>{
    const {db}=setup([event(1),event(2),event(3)],[1,0]);const sync=vi.fn().mockResolvedValueOnce({records:0}).mockResolvedValueOnce({records:99}).mockRejectedValueOnce(new Error('unavailable'));
    expect(await backfillMissingLeaderboards(db,sync,vi.fn().mockResolvedValue(undefined))).toEqual({checked:3,filled:1,still_missing:['Event 2','Event 3']});
  });
  it('does not fetch or pause when all gaps have already been filled',async()=>{
    const {db}=setup([]);const sync=vi.fn();const pause=vi.fn();expect(await backfillMissingLeaderboards(db,sync,pause)).toEqual({checked:0,filled:0,still_missing:[]});expect(sync).not.toHaveBeenCalled();expect(pause).not.toHaveBeenCalled();
  });
});