/** PF1 presentation only. StageComposer owns manual choice and all persistence. */
import {Flag,Search,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useCoursePhoto} from '../../hooks/useCoursePhoto';
import type {StageCourse} from '../../hooks/useStageComposer';
import type {TeeHole} from '@/features/courses/hooks/useCourseTeeSets';
import type {HoleShape} from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import {POST_SHOT_TAGS,ordinal,roundDay,roundToPar,signedScore,toggleHole,toggleShot,daysBefore,type PostShotTag,type CourseSuggestion,type ComposerRound} from '../../lib/composerGolfRules';
import {shortCourseName} from '../../lib/golfPostRules';
import BottomSheet from '../BottomSheet';
import './composerGolf.css';
function CoursePhoto({course}:{course:StageCourse}) {const photo=useCoursePhoto(course);return <span className="composer-golf-photo">{photo?<img src={photo} alt=""/>:<Flag size={18}/>}</span>;}
export function ComposerCourseBlock({course,reason,suggestions,hole,tags,holes,onChange,onPick,onHole,onTags}:{course:StageCourse|null;reason:string|null;suggestions:CourseSuggestion[];hole:number|null;tags:PostShotTag[];holes:readonly TeeHole[];onChange:()=>void;onPick:(c:StageCourse)=>void;onHole:(h:number|null)=>void;onTags:(t:PostShotTag[])=>void}) {
 return <section className="composer-golf"><div className="composer-golf-head"><span className="composer-golf-kicker">On the course</span>{reason&&<span className="composer-golf-source">● {reason}</span>}</div>
 {!course&&<><Button variant="ghost" className="composer-golf-search" onClick={onChange}><Search size={16}/>Where was this?</Button>{suggestions.slice(0,3).map(c=><Button key={c.id} variant="ghost" className="composer-golf-suggestion" onClick={()=>onPick(c)}><CoursePhoto course={c}/><span>{c.name}<small>{c.reason}</small></span></Button>)}</>}
 {course&&<div className="composer-golf-box"><div className="composer-golf-course"><CoursePhoto course={course}/><div className="composer-golf-name">{course.name}<small>{[course.sub_country,course.country].filter(Boolean).join(', ')}</small></div><Button variant="ghost" className="composer-golf-action" onClick={onChange}>Change</Button></div></div>}</section>;
}

/* PF_SWITCH: a plain role="switch" button (not the shared Button, whose base
 * classes centre the knob). Track 46x28 / 3px padding, knob starts left and
 * translates 18px so it sits 3px inside the right edge when on. */
function Switch({label,on,onChange,disabled}:{label:string;on:boolean;onChange:()=>void;disabled?:boolean}) {return <button type="button" role="switch" aria-label={label} aria-checked={on} className="composer-golf-switch" disabled={disabled} onClick={disabled?undefined:onChange}><i/></button>;}
export function ComposerAttachRound({round,on,onToggle,onDifferent,shape,hole}:{round:ComposerRound;on:boolean;onToggle:()=>void;onDifferent:()=>void;shape:HoleShape|null;hole:number|null}) {return <section className="composer-golf"><div className="composer-golf-box" data-on={on}><div className="composer-golf-att"><div><b>Attach your round</b><p><strong>{round.gross_score}</strong>{roundToPar(round)!=null?` (${signedScore(roundToPar(round))})`:''} at {shortCourseName(round.course_name??'')} · {roundDay(round.play_date)}</p></div><Switch label="Attach your round" on={on} onChange={onToggle}/></div>{on&&shape&&<div className="composer-golf-round-strip">{Array.from({length:18},(_,i)=>{const h=shape.holes.find(h=>h.holeNo===i+1);const delta=h?.strokes!=null&&h.par!=null?h.strokes-h.par:null;return <div key={i} data-selected={hole===i+1} data-tone={delta==null?'missing':delta<0?'under':delta===0?'par':delta===1?'bogey':'worse'}><i/><span>{h?.strokes??''}</span></div>;})}</div>}<div className="composer-golf-part"><Button variant="ghost" className="composer-golf-action" onClick={onDifferent}>Different round ›</Button></div></div></section>;}
/* PF2_GUIDE: with any audience other than Everyone the switch shows off at 40%
 * and cannot be turned on; tapping anywhere on the row opens Who can see this.
 * The member's own choice is kept by the caller and restored on Everyone. */
export function ComposerHoleGuide({course,hole,on,audienceOk,onToggle,onRowTap,personal=true}:{course:StageCourse;hole:number;on:boolean;audienceOk:boolean;onToggle:()=>void;onRowTap:()=>void;personal?:boolean}) {
 if(!personal) return null;
 if(!audienceOk) return <section className="composer-golf"><div className="composer-golf-box"><div className="composer-golf-att composer-golf-att-tap" role="button" tabIndex={0} onClick={onRowTap} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRowTap();}}}><div><b>Add to the {ordinal(hole)}'s hole guide</b><p>Hole guides are public. Change <em>Who can see this</em> to Everyone.</p></div><Switch label="Add to hole guide" on={false} disabled onChange={()=>{}}/></div></div></section>;
 return <section className="composer-golf"><div className="composer-golf-box" data-on={on}><div className="composer-golf-att"><div><b>Add to the {ordinal(hole)}'s hole guide</b><p>Golfers planning a round see it on the {shortCourseName(course.name)} course page, credited to you.</p></div><Switch label="Add to hole guide" on={on} onChange={onToggle}/></div></div></section>;
}
/* Choose a round (signed-off post-flow-round-played-with mock, frame 4).
 * Groups THIS WEEK (play_date within the last 7 days) / EARLIER; empty groups
 * are omitted. The mock prints the course with its parenthetical variant, so
 * only "Golf Club" is trimmed here (shortCourseName would drop "(East)"). */
const sheetCourse=(n:string|null)=>(n??'').replace(/ Golf Club/i,'').trim();
const sheetTick=<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5 9-10"/></svg>;
export function ComposerRoundsSheet({open,onClose,rounds,onPick,selectedId=null,attachedId=null,now}:{open:boolean;onClose:()=>void;rounds:ComposerRound[];onPick:(r:ComposerRound)=>void;selectedId?:string|null;attachedId?:string|null;now?:Date}) {
 const list=rounds.slice(0,10); const cut=daysBefore(7,now??new Date());
 const groups=[{key:'week',label:'THIS WEEK',rows:list.filter(r=>r.play_date>=cut)},{key:'earlier',label:'EARLIER',rows:list.filter(r=>r.play_date<cut)}].filter(g=>g.rows.length);
 const ticked=attachedId??selectedId;
 return <BottomSheet open={open} onClose={onClose}><div className="composer-rounds" data-testid="rounds-sheet">
  <div className="composer-rounds-head"><div><h3>Choose a round</h3><p>Your last 10 rounds. The one you pick goes on the post.</p></div><button type="button" className="composer-rounds-close" aria-label="Close" onClick={onClose}><X size={14}/></button></div>
  {groups.map(g=><div key={g.key} data-group={g.key}><div className="composer-rounds-grp">{g.label}</div>{g.rows.map(r=>{const d=new Date(`${r.play_date}T12:00:00`);const tp=roundToPar(r);const on=r.whs_score_id===ticked;return <button type="button" key={r.whs_score_id} className="composer-rounds-row" data-selected={on||undefined} onClick={()=>{onPick(r);onClose();}}>
   <span className="composer-rounds-dt"><small>{d.toLocaleDateString('en-GB',{weekday:'short'})}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-GB',{month:'short'})}</small></span>
   <span className="composer-rounds-course"><b>{sheetCourse(r.course_name)}</b><small>{r.holes_played??18} holes{r.whs_score_id===attachedId?' · Attached':''}</small></span>
   <span className="composer-rounds-score"><b>{r.gross_score??''}</b>{tp!=null&&<small data-under={tp<0||undefined}>{signedScore(tp)}</small>}</span>
   <span className="composer-rounds-tick" data-on={on||undefined}>{on&&sheetTick}</span>
  </button>;})}</div>)}
 </div></BottomSheet>;
}
