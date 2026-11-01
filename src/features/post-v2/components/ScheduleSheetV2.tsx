/** Native minute-precision scheduling. The sheet chooses a date only; the
 * existing submit/publisher remains authoritative for actual scheduling. */
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { ActiveActor } from '@/types/actor';
import BottomSheet from './BottomSheet';
import { PostFlowHeader } from './PostFlowChrome';
import { usePostBestHour } from '../hooks/usePostBestHour';
import { bestHour, hourBar, nextHourDate, scheduleDayKey, datedSchedule, countdown, presetDate } from '../lib/postFlowRules';
import '@/styles/post-flow.css';
interface Props { open:boolean; onClose:()=>void; value:Date|null; onChange:(d:Date|null)=>void; onOpenScheduled?:()=>void; scheduledCount?:number; actor?:ActiveActor|null; onBestHour?:(hour:number|null)=>void }
export default function ScheduleSheetV2({open,onClose,value,onChange,onOpenScheduled,scheduledCount=0,actor,onBestHour}:Props){
  const {t}=useTranslation('composer'); const [now,setNow]=useState(()=>new Date()); const [chosen,setChosen]=useState(()=>value??presetDate('hour',new Date()));
  const [preset,setPreset]=useState<string|null>(null); const rows=usePostBestHour(open,actor);const peak=bestHour(rows,now);
  useEffect(()=>{if(!open)return;setNow(new Date());setChosen(value??presetDate('hour',new Date()));setPreset(null);const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[open,value]);
  useEffect(()=>{if(open)onBestHour?.(peak);},[open,peak,onBestHour]);
  const days=useMemo(()=>Array.from({length:14},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d;}),[open,now.getFullYear(),now.getMonth(),now.getDate()]);
  const remaining=countdown(chosen,now);const dayKey=scheduleDayKey(chosen,now);const dateLabel=dayKey?t(`postFlow.${dayKey}`):datedSchedule(chosen);
  const useDate=peak==null?null:nextHourDate(peak,now);const max=Math.max(0,...rows.map(r=>r.active_followers));
  const select=(d:Date)=>{setChosen(d);setPreset(null);};
  return <BottomSheet open={open} onClose={onClose} surfaceClassName="pf-sheet"><div className="pf">
    <PostFlowHeader title={t('postFlow.schedule')} onClose={onClose}/>
    {rows.length>0&&peak!=null&&useDate&&<div className="pf-best" data-testid="best-time"><div className="pf-best-head"><span>{t('postFlow.bestTime')}</span><span>{t('postFlow.last30Days')}</span></div>
      <div className="pf-best-copy">{t('postFlow.bestLead')} <b className="pf-num">{String(peak).padStart(2,'0')}:00</b>.</div>
      <div className="pf-hours">{Array.from({length:24},(_,h)=>{const count=rows.find(r=>r.hour_of_day===h)?.active_followers??0;return <i key={h} className="pf-hour" data-hour={h} data-peak={h===peak} data-past={h<=now.getHours()} style={{height:hourBar(count,max)}}/>;})}</div>
      <div className="pf-axis pf-num">{['00','06','12','18','23'].map(s=><span key={s}>{s}</span>)}</div>
      <Button variant="ghost" className="pf-pill pf-outline pf-use" onClick={()=>select(useDate)}>{t('postFlow.useHour',{day:t(`postFlow.${scheduleDayKey(useDate,now)??'tomorrow'}`),time:format(useDate,'HH:mm')})}</Button>
    </div>}
    <div className="pf-presets">{(['hour','evening','tomorrow'] as const).map(kind=><Button key={kind} variant="ghost" className="pf-pill pf-outline pf-preset" aria-pressed={preset===kind} onClick={()=>{setChosen(presetDate(kind,now));setPreset(kind);}}>{t(`postFlow.preset${kind}`)}</Button>)}</div>
    <div className="pf-label">{t('postFlow.date')}</div><div className="pf-days">{days.map((d,i)=><Button variant="ghost" key={d.toISOString()} className="pf-day" aria-label={format(d,'EEE d MMM')} aria-pressed={scheduleDayKey(d,chosen)==='today'} onClick={()=>{const next=new Date(d);next.setHours(chosen.getHours(),chosen.getMinutes(),0,0);select(next);}}><span className="pf-day-week">{i===0?t('postFlow.today').toUpperCase():format(d,'EEE').toUpperCase()}</span><span className="pf-day-num pf-num">{d.getDate()}</span></Button>)}</div>
    <div className="pf-label">{t('postFlow.time')}</div><label className="pf-time"><span className="pf-time-value pf-num">{format(chosen,'HH:mm')}</span><span className="pf-time-change">{t('postFlow.change')} ›</span><input type="time" step={60} aria-label={t('postFlow.time')} value={format(chosen,'HH:mm')} onChange={e=>{if(!e.target.value)return;const [h,m]=e.target.value.split(':').map(Number);const next=new Date(chosen);next.setHours(h,m,0,0);select(next);}}/></label>
    <div className="pf-summary" aria-live="polite">{remaining.past?t('postFlow.past'):<> {t('postFlow.goesLive')} <b>{dateLabel} {t('postFlow.at')} {format(chosen,'HH:mm')}</b> · <span className="pf-num">{t('postFlow.countdown',{hours:remaining.hours,minutes:remaining.minutes})}</span></>}</div>
    <Button variant="ghost" className="pf-pill pf-schedule-cta" disabled={remaining.past} onClick={()=>{onChange(chosen);onClose();}}>{t('postFlow.schedulePost')}</Button>
    {onOpenScheduled&&<Button variant="ghost" className="pf-view-scheduled" onClick={onOpenScheduled}><span>{t('postFlow.yourScheduled')}</span><b className="pf-num">{scheduledCount} ›</b></Button>}
  </div></BottomSheet>;
}
