import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),query:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
vi.mock('@tanstack/react-query',()=>({useQuery:mocks.query}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:null})}));
import { loadComingUpOwnRounds } from '@/features/tourhub/overview/data/useComingUpOwnRounds';
import { useComingUp } from '@/features/tourhub/overview/data/useComingUp';
import { useBatchCourseImages } from '@/features/tourhub/hooks/useBatchCourseImages';
beforeEach(()=>vi.clearAllMocks());
describe('Coming up batched reads',()=>{
 it('one own-rounds read scopes identity and deduplicates all course ids',async()=>{const chain:any={select:vi.fn(()=>chain),eq:vi.fn(()=>chain),in:vi.fn().mockResolvedValue({data:[{course_id:'c',gross_score:84,holes_played:18}],error:null})};mocks.from.mockReturnValue(chain);expect((await loadComingUpOwnRounds('member',false,['c','b','c'])).get('c')).toEqual({best:84,rounds:1});expect(mocks.from).toHaveBeenCalledExactlyOnceWith('gam_round_stats');expect(chain.select).toHaveBeenCalledWith('course_id, gross_score, holes_played');expect(chain.eq).toHaveBeenCalledWith('user_id','member');expect(chain.in).toHaveBeenCalledWith('course_id',['b','c']);});
 it('guests never read own rounds',async()=>{await loadComingUpOwnRounds('guest',true,['c']);expect(mocks.from).not.toHaveBeenCalled();});
 it('missing identity never reads rounds',async()=>{await loadComingUpOwnRounds(null,false,['c']);expect(mocks.from).not.toHaveBeenCalled();});
 it('empty course ids never read rounds',async()=>{await loadComingUpOwnRounds('member',false,[]);expect(mocks.from).not.toHaveBeenCalled();});
 it('read failure throws rather than inventing figures',async()=>{const chain:any={select:()=>chain,eq:()=>chain,in:()=>Promise.resolve({data:null,error:new Error('denied')})};mocks.from.mockReturnValue(chain);await expect(loadComingUpOwnRounds('member',false,['c'])).rejects.toThrow('denied');});
 it('catalogue adds required facts in the single tournaments read',async()=>{const chain:any={select:vi.fn(()=>chain),in:()=>chain,gte:()=>chain,order:()=>chain,limit:()=>Promise.resolve({data:[],error:null})};mocks.from.mockReturnValue(chain);useComingUp('pga',6);await mocks.query.mock.calls[0][0].queryFn();expect(mocks.from).toHaveBeenCalledExactlyOnceWith('sr_tournaments');for(const field of ['winning_share','venue_par','venue_yardage','event_type','golf_course_id','currency']) expect(chain.select.mock.calls[0][0]).toContain(field);});
 it('supplied photo links avoid another tournaments read',async()=>{const chain:any={select:()=>chain,in:()=>Promise.resolve({data:[{id:'c',thumbnail_image:'/course.jpg'}],error:null})};mocks.from.mockReturnValue(chain);useBatchCourseImages([{id:'event',golf_course_id:'c',venue_name:'Club'}]);const photos=await mocks.query.mock.calls[0][0].queryFn();expect(photos.get('event')).toBe('/course.jpg');expect(mocks.from).toHaveBeenCalledExactlyOnceWith('golf_courses');});
});