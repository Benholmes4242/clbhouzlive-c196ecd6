import {describe,it,expect} from 'vitest';
import {recordOdds,blindOdds,percentText,winPercent,barPercent} from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickOdds';
describe('British winner odds',()=>{
 it.each([[5,8,'3/5'],[1,6,'5/1'],[3,10,'7/3'],[4,8,'Evens'],[0,2,'—'],[8,8,'—']] as const)('%i wins of %i gives %s',(wins,events,odds)=>expect(recordOdds(wins,events)).toBe(odds));
 it('blind2.7 gives36/1 and one week in37',()=>expect(blindOdds(2.7)).toEqual({n:37,odds:'36/1'}));
 it('blind0.4 displays below1%',()=>expect(percentText(.4,true)).toBe('<1%'));
 it('5 of8 rounds to63% but keeps exact62.5% bar',()=>{expect(percentText(winPercent(5,8))).toBe('63%');expect(barPercent(winPercent(5,8))).toBe(62.5);});
 it('zero wins retains1% sliver and0% figure',()=>{expect(winPercent(0,2)).toBe(0);expect(barPercent(0)).toBe(1);expect(percentText(0)).toBe('0%');});
 it('blind3% bar preserves server2.7% precision',()=>{expect(percentText(2.7,true)).toBe('3%');expect(barPercent(2.7)).toBe(2.7);});
 it('unknown blind percentage has no invented odds',()=>expect(blindOdds(null)).toBeNull());
});