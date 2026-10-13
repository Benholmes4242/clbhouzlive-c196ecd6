import type { MemberSessionSummary } from '../hooks/useMembersRadar';

export function radarDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${String(Math.floor(seconds % 60)).padStart(2, '0')}s`;
  return `${seconds}s`;
}
export function londonDate(iso: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!iso || !Number.isFinite(new Date(iso).getTime())) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { ...options, timeZone: 'Europe/London' });
}
export function londonTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
}
function londonDay(iso: string): number {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso));
  const n = (type: string) => Number(p.find(x => x.type === type)?.value);
  return Date.UTC(n('year'), n('month') - 1, n('day'));
}
export function eightWeekStart(now = new Date().toISOString()): number {
  const day = londonDay(now);
  return day - ((new Date(day).getUTCDay() + 6) % 7 + 49) * 86400000;
}
export function weeklySessionCounts(sessions: MemberSessionSummary[], now = new Date().toISOString()): number[] {
  const first = eightWeekStart(now), counts = Array<number>(8).fill(0), seen = new Set<string>();
  for (const s of sessions) {
    if (seen.has(s.session_id)) continue;
    seen.add(s.session_id);
    const i = Math.floor((londonDay(s.started_at) - first) / 604800000);
    if (i >= 0 && i < 8) counts[i] += 1;
  }
  return counts;
}
export function radarQueryUser(userId: string | null, full: boolean, opened = true) {
  return full && opened ? userId : null;
}