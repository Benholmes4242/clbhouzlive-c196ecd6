import { describe, expect, it } from 'vitest';
import { finishLabel, rankMovement, scoreLabel, seasonSummary, sortedEvents, type ProEvent, type WorldRank } from '@/features/pro-profile/proProfileRules';
const rank:WorldRank={rank:1436,prior_rank:1440,season_start_rank:1879,best_rank:1400,ranking_date:'2026-11-02',source:'owgr'};
const event=(overrides:Partial<ProEvent>={}):ProEvent=>({id:'a',user_id:'pro',source:'owgr',event_name:'Event',start_date:'2026-10-15',end_date:'2026-10-17',country:'Belgium',venue:null,tour_name:'Alps Tour',finish:'T31',to_par:null,total_strokes:219,scheduled_rounds:3,owgr_year:2026,owgr_week:42,owgr_points:.03,owgr_event_id:'11624',owgr_rank_before:1440,owgr_rank_after:1436,tee_time:null,tee_hole:null,created_at:'',updated_at:'',rounds:[],...overrides});
describe('Pro profile build one rules',()=>{
  it('season improvement is positive 443, not a score',()=>expect(rankMovement(rank)).toEqual({improved:true,difference:443,period:'this season'}));
  it('worsening rank has no score/red property',()=>expect(rankMovement({...rank,rank:1900})).toEqual({improved:false,difference:21,period:'this season'}));
  it('uses prior week only when season baseline absent',()=>expect(rankMovement({...rank,season_start_rank:null})).toEqual({improved:true,difference:4,period:'this week'}));
  it('unchanged rank omits movement',()=>expect(rankMovement({...rank,season_start_rank:1436})).toBeNull());
  it('absent comparisons omit movement',()=>expect(rankMovement({...rank,season_start_rank:null,prior_rank:null})).toBeNull());
  it('no rank omits movement',()=>expect(rankMovement(null)).toBeNull());
  it('MC WD DQ do not count as cuts; win and top ten do',()=>{
    const result=seasonSummary(['MC','WD','DQ','1','T9','T31'].map((finish,i)=>event({id:String(i),finish})),2026);
    expect(result).toMatchObject({events:6,cuts:3,top10s:2,best:'1'});
  });
  it('win best finish is 1st for every pro',()=>expect(finishLabel('1')).toBe('1st'));
  it('calendar year excludes older results',()=>expect(seasonSummary([event(),event({start_date:'2025-12-31'})],2026).events).toBe(1));
  it('undated events use owgr year',()=>expect(seasonSummary([event({start_date:null,owgr_year:2026})],2026).events).toBe(1));
  it('real Mason gross averages 219 plus140 plus148 over seven rounds',()=>{
    const events=[[71,75,73],[70,70],[74,74]].map((scores,i)=>event({id:String(i),rounds:scores.map((strokes,j)=>({event_id:String(i),round_no:j+1,source:'owgr',strokes,to_par:null,holes_played:18,posted_at:''}))}));
    expect(seasonSummary(events,2026).average).toBe('72.4');
  });
  it('source pro to-par is never included in strokes average',()=>expect(seasonSummary([event({source:'pro',rounds:[{event_id:'a',round_no:1,source:'pro',strokes:null,to_par:-2,holes_played:18,posted_at:''}]})],2026).average).toBeNull());
  it('empty season collapses best finish',()=>expect(seasonSummary([],2026).best).toBeNull());
  it('orders dated and undated results newest first',()=>expect(sortedEvents([event({id:'old',start_date:null,owgr_week:35}),event({id:'new',start_date:null,owgr_week:43}),event({id:'dated',start_date:'2026-11-01'})]).map(e=>e.id)).toEqual(['dated','new','old']));
  it.each([[-2,'−2'],[0,'E'],[3,'+3']])('signed score %s', (n,label)=>expect(scoreLabel(Number(n))).toBe(label));
});