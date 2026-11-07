import {beforeEach,describe,it,expect,vi} from 'vitest';
const h=vi.hoisted(()=>({rows:[] as unknown[],inserts:[] as unknown[],error:null as {code:string}|null}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>table==='post_media'?{select:()=>({eq:async()=>({data:h.rows,error:null})})}:{insert:async(row:unknown)=>{h.inserts.push(row);return {error:h.error};}}}}));
import {guideRow,publishHoleGuide} from '@/features/post-v2/lib/postHoleGuide';
const ctx={courseId:'course',holeNo:15,userId:'me'};
const media={id:'media-1',media_url:'https://media.test/photo.jpg',media_type:'image',processing_status:'ready',upload_status:'completed'};
beforeEach(()=>{h.rows=[media,{...media,id:'media-2',media_type:'video',stream_id:'stream'}];h.inserts=[];h.error=null;});
describe('PF1 pending source-linked hole guide',()=>{
 it('inserts one pending row per ready media item with both source ids',async()=>{await publishHoleGuide(ctx,'post');expect(h.inserts).toHaveLength(2);expect(h.inserts[0]).toMatchObject({course_id:'course',hole_no:15,user_id:'me',tagged_by:'me',status:'pending',source_post_id:'post',source_post_media_id:'media-1'});expect(h.inserts[1]).toMatchObject({source_post_media_id:'media-2',stream_id:'stream'});});
 it('processing media is deferred',()=>{expect(guideRow(ctx,'post',{...media,processing_status:'processing'})).toBeNull();});
 it('a unique violation is ignored',async()=>{h.error={code:'23505'};await expect(publishHoleGuide(ctx,'post')).resolves.toBeUndefined();expect(h.inserts).toHaveLength(2);});
 it('guide write failure does not fail the post',async()=>{h.error={code:'42501'};await expect(publishHoleGuide(ctx,'post')).resolves.toBeUndefined();});
});