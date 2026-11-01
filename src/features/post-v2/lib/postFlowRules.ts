/** Post-flow display rules only. Local device dates; no publishing decisions.
 * Search rank and hourly ties have one owner, independent of sheet lifecycle. */
import { format } from 'date-fns';
import type { StageCourse } from '../hooks/useStageComposer';

export interface CourseTagRow extends StageCourse { playedAt?: string | null; isHomeClub?: boolean }
export interface BestHourRow { hour_of_day: number; active_followers: number; total_active: number }
export function catalogueThousands(count: number | null): number | null {
  return count != null && Number.isFinite(count) && count >= 1000 ? Math.floor(count / 1000) * 1000 : null;
}
export function dedupeGroups(groups: readonly CourseTagRow[][]): CourseTagRow[][] {
  const seen = new Set<string>();
  return groups.map(g => g.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }));
}
export function rankCourseSearch(rows: readonly CourseTagRow[], query: string, played: ReadonlyMap<string, string>): CourseTagRow[] {
  const q = query.trim().toLocaleLowerCase();
  const rank = (name: string) => {
    const n = name.toLocaleLowerCase();
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.split(/[^\p{L}\p{N}’']+/u).some(w => w.startsWith(q))) return 2;
    return 3;
  };
  return [...rows].sort((a,b) => rank(a.name) - rank(b.name) || Number(played.has(b.id)) - Number(played.has(a.id)) || a.name.localeCompare(b.name))
    .slice(0,20).map(c => ({ ...c, playedAt: played.get(c.id) ?? null }));
}
export function nameParts(name: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [{ text: name, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  let pos = 0;
  while (pos < name.length) {
    const at = name.toLocaleLowerCase().indexOf(q, pos);
    if (at < 0) { parts.push({text:name.slice(pos),hit:false}); break; }
    if (at > pos) parts.push({text:name.slice(pos,at),hit:false});
    parts.push({text:name.slice(at,at+q.length),hit:true}); pos = at+q.length;
  }
  return parts;
}
export function bestHour(rows: readonly BestHourRow[], now: Date): number | null {
  if (!rows.length) return null;
  const max = Math.max(...rows.map(r => r.active_followers));
  if (max <= 0) return null;
  const tied = rows.filter(r => r.active_followers === max).map(r => r.hour_of_day).sort((a,b)=>a-b);
  return tied.find(h => h > now.getHours() || (h === now.getHours() && now.getMinutes() === 0 && now.getSeconds() === 0)) ?? tied[0] ?? null;
}
export function hourBar(count: number, peak: number): number { return Math.max(3, peak > 0 ? count / peak * 38 : 3); }
export function nextHourDate(hour: number, now: Date): Date {
  const d = new Date(now); d.setHours(hour,0,0,0); if (d.getTime() <= now.getTime()) d.setDate(d.getDate()+1); return d;
}
export function scheduleDayKey(target: Date, now: Date): 'today' | 'tomorrow' | null {
  const day = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (day(target) === day(now)) return 'today';
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate()+1);
  return day(target) === day(tomorrow) ? 'tomorrow' : null;
}
export function datedSchedule(target: Date): string { return format(target, 'EEE d MMM'); }
export function countdown(target: Date, now: Date): { hours: number; minutes: number; past: boolean } {
  const ms = target.getTime()-now.getTime(); const min = Math.max(0, Math.ceil(ms/60000));
  return { hours:Math.floor(min/60), minutes:min%60, past:ms <= 0 };
}
export function presetDate(kind: 'hour' | 'evening' | 'tomorrow', now: Date): Date {
  const d = new Date(now);
  if (kind === 'hour') { d.setTime(d.getTime()+3600000); d.setSeconds(0,0); }
  else if (kind === 'evening') d.setHours(18,0,0,0);
  else { d.setDate(d.getDate()+1); d.setHours(9,0,0,0); }
  return d;
}