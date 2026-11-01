/** All-day ICS end dates are exclusive. No native fallback or client writes:
 * Median Calendar handoff must be observed on a real device before any fallback. */
import type { ComingUpRow } from '../data/useComingUp';
import { fullTourLabel } from '../../_shared/tourOrder';
import { supabase } from '@/integrations/supabase/client';

const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
export function buildComingUpCalendar(row: ComingUpRow, url: string, teeTime?: string | null, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone, now = new Date()) {
  const end = new Date(`${row.end_date.slice(0, 10)}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 1);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const tee = teeTime ? `Round 1 first tee time: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(teeTime))} (${timeZone})` : '';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//clbhouz//Tour Calendar//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${row.id}@clbhouz.co.uk`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${row.start_date.slice(0, 10).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, '')}`, `SUMMARY:${escape(`${row.name} · ${fullTourLabel(row.tour_slug)}`)}`, `LOCATION:${escape(row.venue ?? '')}`, `URL:${url}`, ...(tee ? [`DESCRIPTION:${escape(tee)}`] : []), 'END:VEVENT', 'END:VCALENDAR'];
  // Fold by UTF-8 octets, not JS character count (RFC5545).
  return lines.map(line => { let output = ''; let width = 0; for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (width + bytes > 75) { output += '\r\n '; width = 1; } output += char; width += bytes; } return output; }).join('\r\n') + '\r\n';
}
export async function openComingUpCalendar(row: ComingUpRow) {
  const { data } = await supabase.from('sr_tee_times').select('tee_time').eq('tournament_id', row.id).eq('round_number', 1).not('tee_time', 'is', null).order('tee_time', { ascending: true }).limit(1);
  const url = `https://clbhouz.co.uk/tourhub/tournament/${encodeURIComponent(row.id)}`;
  const blob = new Blob([buildComingUpCalendar(row, url, data?.[0]?.tee_time)], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = `${row.name.replace(/[^\w-]+/g, '-')}.ics`; document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}