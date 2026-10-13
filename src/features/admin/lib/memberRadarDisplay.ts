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
/** Last session header day: "today" / "yesterday" in Europe/London, else "Mon 12 Oct". */
export function londonSessionDay(iso: string, now = new Date().toISOString()): string {
  const diff = (londonDay(now) - londonDay(iso)) / 86400000;
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(new Date(iso));
  const v = (type: string) => p.find(x => x.type === type)?.value ?? '';
  return `${v('weekday')} ${v('day')} ${v('month')}`;
}
export function radarQueryUser(userId: string | null, full: boolean, opened = true) {
  return full && opened ? userId : null;
}