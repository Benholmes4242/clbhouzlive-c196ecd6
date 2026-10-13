/**
 * BRIEF_MEMBERS_RADAR 2.2 — the ONE admin last-seen / age formatter.
 * "now" under 2 min, then "9 min", "5 h", "25 d", "3 mo", "1 y".
 * Sentence case: render it in a style with no text-transform. Never uppercase.
 * `suffix` appends " ago" (except to "now") for prose such as "Granted 5 d ago".
 */
export function formatAgo(
  iso: string | null | undefined,
  opts: { suffix?: boolean; empty?: string; now?: number } = {},
): string {
  const empty = opts.empty ?? '—';
  if (!iso) return empty;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return empty;
  const secs = Math.max(0, ((opts.now ?? Date.now()) - t) / 1000);
  if (secs < 120) return 'now';
  const min = Math.floor(secs / 60);
  let out: string;
  if (min < 60) out = `${min} min`;
  else if (min < 60 * 24) out = `${Math.floor(min / 60)} h`;
  else {
    const d = Math.floor(min / (60 * 24));
    if (d < 30) out = `${d} d`;
    else if (d < 365) out = `${Math.floor(d / 30)} mo`;
    else out = `${Math.floor(d / 365)} y`;
  }
  return opts.suffix ? `${out} ago` : out;
}
