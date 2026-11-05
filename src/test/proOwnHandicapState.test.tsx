import {renderHook,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({unknown:false,verified:false,linked:false,settled:true}));
vi.mock('@/lib/whs/useHandicapChipState',()=>({useHandicapChipState:()=>({linked:f.linked,connected:f.linked,settled:f.settled,connection:f.linked?{id:'kept'}:null,trend:null,anyError:false})}));
vi.mock('@/features/pro-verification/useMyProStatus',()=>({useMyProStatus:()=>({unknown:f.unknown,verifiedKnown:!f.unknown,verified:f.verified,kind:'tour_pro',tour:'Alps Tour',club:null})}));
import {useOwnHandicapState} from '@/lib/whs/useOwnHandicapState';
afterEach(cleanup);
describe('own handicap pro settlement',()=>{
  it('is unsettled while pro status is unknown',()=>{f.unknown=true;f.settled=true;expect(renderHook(()=>useOwnHandicapState('me')).result.current.settled).toBe(false);f.unknown=false;});
  it.each([false,true])('verified pro preserves connection state linked=%s',linked=>{f.verified=true;f.linked=linked;const {result}=renderHook(()=>useOwnHandicapState('me'));expect(result.current.pro).toBe(true);expect(result.current.linked).toBe(linked);expect(result.current.settled).toBe(true);});
});