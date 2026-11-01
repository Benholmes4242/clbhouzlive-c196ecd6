import {describe,it,expect} from 'vitest';
import {catalogueThousands,dedupeGroups,rankCourseSearch,nameParts,bestHour,hourBar,nextHourDate,countdown,presetDate,scheduleDayKey} from '@/features/post-v2/lib/postFlowRules';
const course=(id:string,name=id)=>({id,name});
describe('post course catalogue count',()=>{
 it('rounds 23296 down to 23000',()=>expect(catalogueThousands(23296)).toBe(23000));
 it('never rounds 23999 up',()=>expect(catalogueThousands(23999)).toBe(23000));
 it('unavailable count omits the figure',()=>expect(catalogueThousands(null)).toBeNull());
 it('invalid count omits the figure',()=>expect(catalogueThousands(NaN)).toBeNull());
});
describe('tag course rules',()=>{
 it('keeps club, played, popular order with first-group dedupe',()=>expect(dedupeGroups([[course('a')],[course('a'),course('b')],[course('b'),course('c')]]).map(g=>g.map(c=>c.id))).toEqual([['a'],['b'],['c']]));
 it('ranks exact then prefix then word prefix then contains',()=>expect(rankCourseSearch([course('d','Old Kingsland'),course('c','Gleneagles Kings'),course('b','Kingsbarns'),course('a','Kings')],'kings',new Map()).map(c=>c.id)).toEqual(['a','b','c','d']));
 it('played first within a rank, not ahead of an exact match',()=>expect(rankCourseSearch([course('b','Kings B'),course('a','Kings A'),course('exact','Kings')],'Kings',new Map([['b','2026-10-28']])).map(c=>c.id)).toEqual(['exact','b','a']));
 it('alphabetical within equal unplayed rank',()=>expect(rankCourseSearch([course('b','Kings B'),course('a','Kings A')],'Kings',new Map()).map(c=>c.id)).toEqual(['a','b']));
 it('caps displayed matches at twenty',()=>expect(rankCourseSearch(Array.from({length:50},(_,i)=>course(String(i),'Kings '+i)),'Kings',new Map())).toHaveLength(20));
 it('preserves played date',()=>expect(rankCourseSearch([course('a')],'a',new Map([['a','2026-10-28']]))[0].playedAt).toBe('2026-10-28'));
 it('marks matching name letters without losing other letters',()=>expect(nameParts("Gleneagles (King's)",'king')).toEqual([{text:'Gleneagles (',hit:false},{text:'King',hit:true},{text:"'s)",hit:false}]));
});
const row=(hour:number,count:number)=>({hour_of_day:hour,active_followers:count,total_active:30});
describe('best-hour scheduling',()=>{
 const now=new Date(2026,10,1,17,59);
 it('absent rows have no recommendation',()=>expect(bestHour([],now)).toBeNull());
 it('busiest hour wins',()=>expect(bestHour([row(18,5),row(19,10)],now)).toBe(19));
 it('tie chooses upcoming today over past',()=>expect(bestHour([row(9,10),row(19,10)],now)).toBe(19));
 it('tie chooses earliest upcoming today',()=>expect(bestHour([row(20,10),row(19,10)],now)).toBe(19));
 it('all past tie chooses earliest tomorrow',()=>expect(bestHour([row(9,10),row(8,10)],now)).toBe(8));
 it('peak height is 38',()=>expect(hourBar(10,10)).toBe(38));
 it('half peak height is 19',()=>expect(hourBar(5,10)).toBe(19));
 it('empty hour keeps 3px minimum',()=>expect(hourBar(0,10)).toBe(3));
 it('future best hour stays today',()=>expect(nextHourDate(19,now).getDate()).toBe(1));
 it('past best hour moves tomorrow',()=>expect(nextHourDate(9,now).getDate()).toBe(2));
 it('same hour after minute zero moves tomorrow',()=>expect(nextHourDate(17,now).getDate()).toBe(2));
 it('in one hour preserves minute precision',()=>expect(presetDate('hour',now).getMinutes()).toBe(59));
 it('evening preset is 18:00 today',()=>expect(presetDate('evening',now)).toEqual(new Date(2026,10,1,18,0)));
 it('tomorrow preset is 09:00',()=>expect(presetDate('tomorrow',now)).toEqual(new Date(2026,10,2,9,0)));
 it('countdown separates hours and minutes',()=>expect(countdown(new Date(2026,10,1,19,0),now)).toEqual({hours:1,minutes:1,past:false}));
 it('past date disables via past flag',()=>expect(countdown(new Date(2026,10,1,17,0),now).past).toBe(true));
 it('today tomorrow and later date forms',()=>{expect(scheduleDayKey(now,now)).toBe('today');expect(scheduleDayKey(new Date(2026,10,2),now)).toBe('tomorrow');expect(scheduleDayKey(new Date(2026,10,3),now)).toBeNull();});
});
