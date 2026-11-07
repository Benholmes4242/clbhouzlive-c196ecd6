/** PF1 owns post-level golf choices; legacy per-media tags/feed rules stay separate.
 * Attached scores never identify a post as a round post. Calendar dates are local.
 */
import type { StageCourse } from '../hooks/useStageComposer';
export const POST_SHOT_TAGS = [
  ['view', 'The view'], ['tee_shot', 'Tee shot'], ['approach', 'Approach'],
  ['around_green', 'Around the green'], ['putt', 'Putt'], ['swing', 'Swing'],
  ['trick_shot', 'Trick shot'], ['gear', 'Gear'], ['hole_in_one', 'Hole-in-one'],
] as const;
export type PostShotTag = typeof POST_SHOT_TAGS[number][0];
export interface ComposerRound { whs_score_id: string; course_id: string | null; course_name: string | null; play_date: string; gross_score: number | null; course_par: number | null }
export type CourseSuggestion = StageCourse & { reason?: string };
export const calendarDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function daysBefore(n: number, now = new Date()) { const date = new Date(now); date.setDate(date.getDate()-n); return calendarDay(date); }
export function ordinal(n: number) { return `${n}${n%100>=11 && n%100<=13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n%10] ?? 'th')}`; }
export function roundDay(day: string, now = new Date()) { if (day===calendarDay(now)) return 'today'; if(day===daysBefore(1,now)) return 'yesterday'; return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', day>=daysBefore(7,now) ? {weekday:'long'} : {day:'numeric',month:'short'}); }
export function roundSuggestionDay(day:string,now=new Date()) {const a=new Date(`${calendarDay(now)}T12:00:00`),b=new Date(`${day}T12:00:00`);const days=Math.round((a.getTime()-b.getTime())/86400000);return days>=2 ? `${days} days ago` : roundDay(day,now);}
export function recentRound(rows: readonly ComposerRound[], now = new Date()) { return [...rows].filter(r=>r.course_id && r.play_date>=daysBefore(1,now) && r.play_date<=calendarDay(now)).sort((a,b)=>b.play_date.localeCompare(a.play_date))[0] ?? null; }
export const canAttachRound = (personal: boolean, rows: readonly ComposerRound[], now = new Date()) => personal && rows.some(r=>r.play_date>=daysBefore(7,now) && r.play_date<=calendarDay(now));
export function chooseCourseSource(input: {manual:boolean; claimed?:StageCourse|null; round?:{course:StageCourse;day:string}|null; nearby?:StageCourse|null}, now = new Date()) {
  if(input.manual) return null;
  if(input.claimed) return {course:input.claimed, reason:"Your club's course"};
  if(input.round && input.round.day>=daysBefore(1,now) && input.round.day<=calendarDay(now)) return {course:input.round.course,reason:`From your round ${roundDay(input.round.day,now)}`};
  return input.nearby ? {course:input.nearby,reason:'Near where this was taken'} : null;
}
export function distanceKm(a:{latitude:number;longitude:number}, b:{latitude:number;longitude:number}) { const rad=(n:number)=>n*Math.PI/180; const lat=rad(b.latitude-a.latitude),lng=rad(b.longitude-a.longitude); const h=Math.sin(lat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(lng/2)**2; return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)); }
export function nearestCourse<T extends StageCourse & {latitude:number|null;longitude:number|null}>(rows:readonly T[],gps:{latitude:number;longitude:number}) { return rows.flatMap(c=>c.latitude==null||c.longitude==null?[]:[{course:c,distance:distanceKm(gps,{latitude:c.latitude,longitude:c.longitude})}]).filter(c=>c.distance<=2).sort((a,b)=>a.distance-b.distance)[0]?.course ?? null; }
export const toggleHole = (current:number|null,hole:number) => current===hole ? null : hole>=1 && hole<=18 ? hole : current;
export const toggleShot = (current:readonly PostShotTag[],tag:PostShotTag) => current.includes(tag) ? current.filter(t=>t!==tag) : [...current,tag];
export function golfPostPatch(input:{course?:StageCourse|null;courses?:StageCourse[];holeNo?:number|null;postShotTags?:PostShotTag[];attachedScoreId?:string|null;addToGuide?:boolean}) { const out:Record<string,unknown>={}; const ids=input.courses?.length?input.courses.map(c=>c.id):input.course?[input.course.id]:[]; if(ids.length) out.tagged_course_ids=ids; if(input.course && input.holeNo) out.hole_no=input.holeNo; if(input.postShotTags?.length) out.shot_tags=input.postShotTags; if(input.attachedScoreId) out.attached_score_id=input.attachedScoreId; /* PF1B: the guide toggle is a posts column now — the database itself adds the media to course_hole_media, including after the app closes. The client never writes course_hole_media. */ if(input.course && input.holeNo && input.addToGuide) out.add_to_hole_guide=true; return out; }
export const guideVisible = (hole:number|null,mediaCount:number) => hole!=null && mediaCount>0;
export function composerDestinations(hole:number|null,guide:boolean,scheduledAt:Date|null) { const bits=[scheduledAt ? `Scheduled for ${scheduledAt.toLocaleString()}` : 'Shares to your Clubhouse feed']; if(hole && guide) bits.push(`the ${ordinal(hole)}'s hole guide`); return bits.join(' · '); }
export const roundToPar = (r:ComposerRound) => r.gross_score!=null && r.course_par!=null ? r.gross_score-r.course_par : null;
export const signedScore = (n:number|null) => n==null ? '' : n===0 ? 'E' : n>0 ? `+${n}` : String(n);
export const editorTitleKey = (media:readonly {type:string}[]) => media.length>0 && media.every(m=>m.type==='image') ? 'stage.mediaSheet.title' : 'stage.edit';