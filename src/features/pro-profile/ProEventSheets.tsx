/** Owner writes always scope source-pro; OWGR rows are read-only. Shared
 * sheet lifecycle supplies history/scroll locking, never a nested modal.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { eventToPar, roundToPar, monthLabel, formatWorldRank, pointsCopy, parFootnote, finishLabel, scoreLabel, roundPayload, ROUND_MIN, ROUND_MAX, type ProEvent, type ProRound } from './proProfileRules';

export function ProRoundSheet({ event, roundNo, existing, close }: { event: ProEvent; roundNo: number; existing?: ProRound; close: () => void }) {
  const [score, setScore] = useState(existing?.to_par ?? 0), [holes, setHoles] = useState(existing?.holes_played ?? 18), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const cache = useQueryClient();
  const save = async () => {
    setBusy(true); setError('');
    try {
      const payload = roundPayload(event.id, roundNo, score, holes);
      const result = existing
        ? await supabase.from('pro_event_rounds').update(payload).eq('event_id', event.id).eq('round_no', roundNo).eq('source', 'pro')
        : await supabase.from('pro_event_rounds').insert(payload);
      if (result.error) throw result.error;
      await cache.invalidateQueries({ queryKey: ['pro-profile', 'events', event.user_id] }); close();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save round.'); }
    finally { setBusy(false); }
  };
  return <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-round-title"><div className="pro-profile pro-profile-sheet">
    <h2 id="pro-round-title">Round {roundNo} score</h2>
    <div className="pro-profile-form"><div className="pro-profile-stepper"><Button variant="outline" size="icon" aria-label="Decrease to-par" disabled={score <= ROUND_MIN || busy} onClick={() => setScore(v => v - 1)}><Minus /></Button><output className={score < 0 ? 'pro-profile-under' : ''}>{scoreLabel(score)}</output><Button variant="outline" size="icon" aria-label="Increase to-par" disabled={score >= ROUND_MAX || busy} onClick={() => setScore(v => v + 1)}><Plus /></Button></div>
    <label>Holes played<input type="number" min={1} max={18} value={holes} onChange={e => setHoles(Number(e.target.value))} /></label></div>
    {error && <p role="alert" className="pro-profile-error">{error}</p>}<Button className="pro-profile-command" disabled={busy || holes < 1 || holes > 18} onClick={save}>{busy ? 'Saving…' : 'Save round'}</Button>
  </div></BottomSheet>;
}

export function ProEventSheet({ userId, event, resultMode = false, close }: { userId: string; event?: ProEvent; resultMode?: boolean; close: () => void }) {
  const [fields, setFields] = useState({ event_name: event?.event_name ?? '', tour_name: event?.tour_name ?? '', venue: event?.venue ?? '', country: event?.country ?? '', start_date: event?.start_date?.slice(0, 10) ?? '', end_date: event?.end_date?.slice(0, 10) ?? '', tee_time: event?.tee_time ? new Date(new Date(event.tee_time).getTime() - new Date(event.tee_time).getTimezoneOffset() * 60000).toISOString().slice(0,16) : '', tee_hole: event?.tee_hole?.toString() ?? '', finish: event?.finish ?? '', to_par: event?.to_par ?? 0 });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const cache = useQueryClient();
  const save = async () => {
    setBusy(true); setError('');
    try {
      if (!fields.event_name.trim() || !fields.start_date || (fields.end_date && fields.end_date < fields.start_date)) throw new Error('Check the event name and dates.');
      const payload = { user_id: userId, source: 'pro', event_name: fields.event_name.trim(), tour_name: fields.tour_name || null, venue: fields.venue || null, country: fields.country || null, start_date: fields.start_date, end_date: fields.end_date || null, tee_time: fields.tee_time ? new Date(fields.tee_time).toISOString() : null, tee_hole: fields.tee_hole ? Number(fields.tee_hole) : null, ...(resultMode ? { finish: fields.finish.toUpperCase() || null, to_par: fields.to_par } : {}) };
      const response = event ? await supabase.from('pro_events').update(payload).eq('id', event.id).eq('user_id', userId).eq('source', 'pro') : await supabase.from('pro_events').insert(payload);
      if (response.error) throw response.error;
      await cache.invalidateQueries({ queryKey: ['pro-profile', 'events', userId] }); close();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save event.'); } finally { setBusy(false); }
  };
  const input = (key: Exclude<keyof typeof fields, 'to_par'>, label: string, type = 'text') => <label key={key}>{label}<input type={type} value={fields[key]} maxLength={type === 'text' ? 255 : undefined} min={key === 'tee_hole' ? 1 : undefined} max={key === 'tee_hole' ? 18 : undefined} onChange={e => setFields(v => ({ ...v, [key]: e.target.value }))} /></label>;
  return <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-event-title"><div className="pro-profile pro-profile-sheet"><h2 id="pro-event-title">{event ? 'Edit event' : resultMode ? 'Add a result' : 'Add event'}</h2><div className="pro-profile-form">
    {input('event_name','Event')}{input('tour_name','Tour')}{input('venue','Venue')}{input('country','Country')}{input('start_date','Start date','date')}{input('end_date','End date','date')}{input('tee_time','R1 tee time','datetime-local')}{input('tee_hole','Starting hole','number')}
    {resultMode && <>{input('finish','Finish')}<label>To par<input type="number" value={fields.to_par} onChange={e => setFields(v => ({ ...v, to_par: Number(e.target.value) }))} /></label></>}
  </div>{error && <p role="alert" className="pro-profile-error">{error}</p>}<Button className="pro-profile-command" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save event'}</Button></div></BottomSheet>;
}

export function ResultDetail({ event, close, first = '', canEditPar = false, addPar }: { event: ProEvent; close: () => void; first?: string; canEditPar?: boolean; addPar?: () => void }) {
  const owgr = event.source === 'owgr', score=eventToPar(event);
  const date = event.start_date ? new Date(`${event.start_date.slice(0,10)}T12:00:00Z`) : null;
  const end = event.end_date ? new Date(`${event.end_date.slice(0,10)}T12:00:00Z`) : null;
  const dateLabel = date ? `${date.getUTCDate()}${end && end.getUTCDate() !== date.getUTCDate() ? `–${end.getUTCDate()}` : ''} ${monthLabel(event.start_date).toUpperCase()} ${date.getUTCFullYear()}` : event.owgr_year?.toString();
  const before=event.owgr_rank_before,after=event.owgr_rank_after;
  const movement=before!=null&&after!=null&&before!==after?{improved:after<before,difference:Math.abs(after-before)}:null;
  return <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-result-title"><div className="pro-profile pro-profile-sheet">
    <div className="pro-profile-heading"><span className="pro-profile-kicker">{[event.tour_name,dateLabel,event.country].filter(Boolean).join(' · ').toUpperCase()}</span><Button variant="ghost" size="icon" aria-label="Close result" onClick={close}><X /></Button></div>
    <h2 id="pro-result-title">{event.event_name}</h2><div className="pro-profile-tiles"><div className="pro-profile-tile"><b className={finishLabel(event.finish)==='1st'?'pro-profile-gold':''}>{finishLabel(event.finish)}</b><span>FINISH</span></div><div className="pro-profile-tile"><b className={score!=null&&score<0?'pro-profile-under':''}>{score!=null?scoreLabel(score):owgr?event.total_strokes??'—':'—'}</b><span>{owgr?score!=null?`${event.total_strokes} STROKES`:'STROKES':'TO PAR'}</span></div>{owgr && <div className="pro-profile-tile"><b>{formatWorldRank(after)}</b><span>WORLD RANK</span>{movement&&<small className={`pro-result-rank-movement ${movement.improved?'pro-profile-up':'pro-profile-worse'}`}>{movement.improved?'▲':'▼'} {formatWorldRank(movement.difference)}</small>}</div>}</div>
    <div className="pro-profile-rounds">{[...event.rounds].sort((a,b)=>a.round_no-b.round_no).map(r=>{const toPar=roundToPar(event,r);return <div key={r.round_no} className="pro-profile-round"><span>R{r.round_no}</span><b className={toPar!=null&&toPar<0?'pro-profile-under':''}>{toPar!=null?scoreLabel(toPar):owgr?r.strokes??'—':'—'}</b>{owgr&&toPar!=null&&<small>{r.strokes}</small>}</div>;})}</div>
    {owgr && <><p className="pro-profile-footnote">{parFootnote(event,first)}</p>{canEditPar&&event.course_par==null&&<Button variant="outline" className="pro-add-par-command" onClick={addPar}>Add the course par</Button>}{pointsCopy(event.owgr_points)&&<p className="pro-profile-footnote">{pointsCopy(event.owgr_points)}</p>}</>}
  </div></BottomSheet>;
}
