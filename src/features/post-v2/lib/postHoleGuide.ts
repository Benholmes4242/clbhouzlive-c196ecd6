/** Source-linked PF1 guide writes are best-effort only, after successful finalize.
 * Ready rows only; source ids make repeated completion notifications idempotent.
 */
import { supabase } from '@/integrations/supabase/client';
export interface HoleGuideContext {courseId:string;holeNo:number;userId:string}
export interface GuideMedia {id:string;media_url:string;media_type:string;stream_id?:string|null;poster_url?:string|null;width?:number|null;height?:number|null;duration_seconds?:number|null;processing_status?:string|null;upload_status?:string|null}
export function guideRow(ctx:HoleGuideContext,postId:string,m:GuideMedia) { if(m.processing_status && m.processing_status!=='ready') return null; if(m.upload_status && m.upload_status!=='completed') return null; return {course_id:ctx.courseId,hole_no:ctx.holeNo,user_id:ctx.userId,media_url:m.media_url,media_type:m.media_type,stream_id:m.stream_id??null,poster_url:m.poster_url??null,width:m.width??null,height:m.height??null,duration_seconds:m.duration_seconds??null,status:'pending',source_post_id:postId,source_post_media_id:m.id,tagged_by:ctx.userId}; }
export async function publishHoleGuide(ctx:HoleGuideContext,postId:string) { try { const {data,error}=await supabase.from('post_media').select('id, media_url, media_type, stream_id, poster_url, width, height, duration_seconds, processing_status, upload_status').eq('post_id',postId); if(error) throw error; for(const media of data??[]) { const row=guideRow(ctx,postId,media); if(!row) continue; const {error:writeError}=await supabase.from('course_hole_media').insert(row as never); if(writeError && writeError.code!=='23505') console.warn('[PF1] hole guide write failed',writeError); } } catch(error) {console.warn('[PF1] hole guide write failed',error);} }

/** Register only after finalization. A row still processing is written on its
 * ready update; removing the channel after ten minutes bounds the subscription.
 * The normal controller awaits all uploads, so this is only the deferred lane.
 */
export async function watchDeferredHoleGuide(ctx:HoleGuideContext,postId:string) {
  try {
    const {data,error}=await supabase.from('post_media').select('id, processing_status, upload_status').eq('post_id',postId);
    if(error || !data?.some(m=>m.processing_status!=='ready'||m.upload_status!=='completed')) return;
    const pending=new Set(data.filter(m=>m.processing_status!=='ready'||m.upload_status!=='completed').map(m=>m.id));
    const channel=supabase.channel(`pf1-guide-${postId}-${crypto.randomUUID()}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'post_media',filter:`post_id=eq.${postId}`},async payload=>{
      const media=payload.new as GuideMedia;
      const row=guideRow(ctx,postId,media);if(!row||!pending.has(media.id))return;
      const {error:writeError}=await supabase.from('course_hole_media').insert(row as never);
      if(writeError&&writeError.code!=='23505'){console.warn('[PF1] deferred guide write failed',writeError);return;}
      pending.delete(media.id);if(!pending.size){clearTimeout(timer);void supabase.removeChannel(channel);}
    }).subscribe();
    const timer=setTimeout(()=>{void supabase.removeChannel(channel);},10*60_000);
  } catch(error){console.warn('[PF1] deferred guide unavailable',error);}
}