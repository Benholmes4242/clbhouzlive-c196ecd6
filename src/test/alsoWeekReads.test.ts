import { describe,expect,it,vi,afterEach } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
import { readAlsoWeekData } from '@/features/tourhub/overview/sections/useAlsoWeekData';
afterEach(()=>vi.clearAllMocks());
function setup(){const c:any={};for(const n of ['select','in','eq','order','limit'])c[n]=vi.fn(()=>c);c.then=(resolve:any)=>Promise.resolve({data:[],error:null}).then(resolve);mocks.from.mockReturnValue(c);return c;}
describe('batched weekly reads',()=>{
  it('one leaderboard read includes every section event',async()=>{const c=setup();await readAlsoWeekData(['a','b','c'],[]);expect(mocks.from.mock.calls).toEqual([['sr_leaderboards']]);expect(c.in).toHaveBeenCalledWith('tournament_id',['a','b','c']);});
  it('one tee read only for starting events',async()=>{const c=setup();await readAlsoWeekData(['a','b'],['b']);expect(mocks.from.mock.calls).toEqual([['sr_leaderboards'],['sr_tee_times']]);expect(c.in).toHaveBeenCalledWith('tournament_id',['b']);expect(c.eq).toHaveBeenCalledWith('round_number',1);});
  it('empty section makes no read',async()=>{setup();await readAlsoWeekData([],[]);expect(mocks.from).not.toHaveBeenCalled();});
});