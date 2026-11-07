/** PF1 adapter uses existing draft media storage/helpers. Remote images are reused
 * unless a crop must be baked; Stream clips are reused with trim metadata.
 * Delete metadata after handoff only, never delete media assets now owned by a post.
 */
import {supabase} from '@/integrations/supabase/client';
import {addDraftMedia} from '@/services/drafts/draftService';
import {uploadDraftMediaFile} from '@/services/drafts/draftMediaUpload';
import {generateStreamHlsUrl} from '@/config/cloudflareStream';
import type {StageMediaItem,StageState} from '../hooks/useStageComposer';
import type {PostVisibility} from './golfPostRules';
import type {PostShotTag} from './composerGolfRules';
import { restoreVideoDetails, roundBoundVideoDetails } from './videoDetails';
export async function saveComposerMedia(draftId:string,media:readonly StageMediaItem[]) {
  for(let i=0;i<media.length;i++) { const m=media[i]; const options={studioEdits:{frame:m.frame,crop:m.crop??null,trimStart:m.trimStart??null,trimEnd:m.trimEnd??null,posterTimestamp:m.posterTimestamp??null},filterId:m.filterId??undefined,width:m.naturalWidth,height:m.naturalHeight,durationSeconds:m.duration};
    if(m.remoteUrl) { const saved=await addDraftMedia(draftId,m.remoteUrl,m.type,i,{...options,streamId:m.streamId??undefined,posterUrl:m.posterUrl??undefined}); if(!saved) throw new Error('Could not save draft media'); }
    else if(m.file) {const result=await uploadDraftMediaFile(draftId,m.file,i,options); if(!result.success) throw new Error(result.error??'Could not save draft media'); }
    else throw new Error('Draft media is missing its source');
  }
}
export interface StoredDraftMedia {id:string;media_type:string;media_url:string;stream_id:string|null;poster_url:string|null;width:number|null;height:number|null;duration_seconds:number|null;filter_id:string|null;display_order:number|null;studio_edits:unknown}
export function restoreComposerMedia(rows:readonly StoredDraftMedia[]):StageMediaItem[] { return [...rows].sort((a,b)=>(a.display_order??0)-(b.display_order??0)).map(m=>{ const edits=(m.studio_edits??{}) as Partial<StageMediaItem>; const type=m.media_type==='video'?'video':'image'; return {id:m.id,type,previewUrl:type==='video' && m.stream_id?generateStreamHlsUrl(m.stream_id):m.media_url,remoteUrl:m.media_url,streamId:m.stream_id,posterUrl:m.poster_url,naturalWidth:m.width??undefined,naturalHeight:m.height??undefined,duration:m.duration_seconds??undefined,filterId:m.filter_id,frame:edits.frame??'original',crop:edits.crop??null,trimStart:edits.trimStart??null,trimEnd:edits.trimEnd??null,posterTimestamp:edits.posterTimestamp??null}; }); }
export interface ComposerDraftRecord {id:string;actor_type:string|null;actor_id:string;content:string|null;course_id:string|null;course_name:string|null;course_country:string|null;course_data:unknown;hole_no:number|null;shot_tags:string[];attached_score_id:string|null;visibility:string|null;video_data?:unknown}
export async function loadComposerDraft(id:string,userId:string):Promise<{row:ComposerDraftRecord;state:Partial<StageState>;visibility:PostVisibility}|null> {const {data,error}=await supabase.from('post_drafts').select('*').eq('id',id).eq('user_id',userId).maybeSingle(); if(error) throw error; if(!data) return null; const {data:media,error:mediaError}=await supabase.from('post_draft_media').select('*').eq('draft_id',id).order('display_order',{ascending:true}); if(mediaError) throw mediaError; const row=data as ComposerDraftRecord; const cd=row.course_data as {courses?:StageState['courses'];addToGuide?:boolean}|null; const courses=cd?.courses?.length?cd.courses:row.course_id&&row.course_name?[{id:row.course_id,name:row.course_name,country:row.course_country}]:[]; return {row,state:{caption:row.content??'',courses,course:courses[0]??null,media:restoreComposerMedia(media??[]),activeIndex:0,holeNo:courses.length?row.hole_no:null,postShotTags:row.shot_tags as PostShotTag[],attachedScoreId:row.attached_score_id,addToGuide:cd?.addToGuide??true,videoData:roundBoundVideoDetails(restoreVideoDetails(row.video_data), row.attached_score_id),scheduledAt:null},visibility:(row.visibility??'anyone') as PostVisibility}; }