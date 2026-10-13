import type { MemberSessionSummary } from '../hooks/useMembersRadar';

/** Presentation only: server seconds are never replaced by timestamp deltas. */
export function radarDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const s = Math.max(0, Math.round(seconds));
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return `${s}s`;
}

export function londonTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
}

export function londonDate(iso: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { ...options, timeZone: 'Europe/London' });
}

export function peakText(peak: { dow: number; hour: number } | null | undefined): string {
  if (!peak) return '—';
  return `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][peak.dow - 1] ?? '—'} ${String(peak.hour).padStart(2, '0')}:00`;
}

function londonDay(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'));
}

/** Eight Monday-based London weeks, oldest first; count sessions, not events. */
export function weeklySessionCounts(sessions: MemberSessionSummary[], now = new Date().toISOString()): number[] {
  const day = londonDay(now);
  const monday = day - ((new Date(day).getUTCDay() + 6) % 7) * 86400000;
  const first = monday - 7 * 7 * 86400000;
  const result = Array<number>(8).fill(0);
  const seen = new Set<string>();
  for (const session of sessions) {
    if (seen.has(session.session_id)) continue;
    seen.add(session.session_id);
    const bucket = Math.floor((londonDay(session.started_at) - first) / (7 * 86400000));
    if (bucket >= 0 && bucket < 8) result[bucket] += 1;
  }
  return result;
}

export function radarQueryUser(userId: string | null, full: boolean, opened = true): string | null {
  return full && opened ? userId : null;
}