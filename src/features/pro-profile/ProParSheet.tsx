/** Par edits use only the authorized RPC; gross scores remain immutable here.
 * Event-query invalidation refreshes rows, the count card and the open detail.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { eventYear, monthLabel, sortedEvents, type ProEvent } from './proProfileRules';
export async function saveCoursePar(eventId: string, par: number) {
  if (!Number.isInteger(par) || par < 60 || par > 75) throw new Error('Course par must be between 60 and 75.');
  const { error } = await supabase.rpc('set_pro_event_par', { p_event_id: eventId, p_par: par });
  if (error) throw error;
}
function ParRow({ event }: { event: ProEvent }) {
  const [par, setPar] = useState(event.course_par ?? 72), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const cache = useQueryClient();
  const save = async () => {
    setBusy(true); setError('');
    try { await saveCoursePar(event.id, par); await cache.invalidateQueries({ queryKey: ['pro-profile','events',event.user_id] }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save course par.'); }
    finally { setBusy(false); }
  };
  return <div className="pro-par-row"><b>{event.event_name}</b><small>{[monthLabel(event.start_date),event.country].filter(Boolean).join(' · ')}</small><div className="pro-par-controls"><Button variant="outline" size="icon" aria-label={`Decrease par for ${event.event_name}`} disabled={busy || par <= 60} onClick={() => setPar(v => v - 1)}><Minus /></Button><output aria-label={`Par for ${event.event_name}`}>{par}</output><Button variant="outline" size="icon" aria-label={`Increase par for ${event.event_name}`} disabled={busy || par >= 75} onClick={() => setPar(v => v + 1)}><Plus /></Button><Button className="pro-profile-command" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button></div>{error && <p role="alert" className="pro-profile-error">{error}</p>}</div>;
}
export function ProParSheet({ events, close }: { events: ProEvent[]; close: () => void }) {
  const rows = sortedEvents(events), years = [...new Set(rows.map(eventYear))];
  return <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-par-title"><div className="pro-profile pro-profile-sheet"><h2 id="pro-par-title">Add the course par</h2>{years.map(year => <section key={year ?? 'undated'}><h3>{year ?? 'Undated'}</h3>{rows.filter(e => eventYear(e) === year).map(event => <ParRow key={event.id} event={event} />)}</section>)}</div></BottomSheet>;
}