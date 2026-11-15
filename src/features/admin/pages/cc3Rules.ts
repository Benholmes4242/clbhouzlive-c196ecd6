import type { CommandCentreV2 } from '../hooks/useCommandCentreV2';

/** CC3 comparisons, durations, coverage grouping and leak selection have one
 * owner so every dashboard panel uses the same denominator and thresholds. */
export function ccDelta(current: number, previous: number): { text: string; tone: 'mu' | 'up' | 'dn' } {
  const change = current - previous;
  if (previous < 20) return { text: change === 0 ? 'level' : `${change > 0 ? '+' : '−'}${Math.abs(change)}`, tone: 'mu' };
  const percent = Math.round(change / previous * 100);
  return { text: percent === 0 ? 'level' : `${percent > 0 ? '↗' : '↘'} ${Math.abs(percent)}%`, tone: percent === 0 ? 'mu' : percent > 0 ? 'up' : 'dn' };
}
export function ccHours(hours: number | null): string {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
  return `${Math.floor(hours / 24)}d`;
}
export function ccConnectChange(c: { n: number; prev_n: number; median_hours: number | null; prev_median_hours: number | null }) {
  if (c.n < 3 || c.prev_n < 3 || c.median_hours == null || c.prev_median_hours == null || c.median_hours === c.prev_median_hours) return null;
  const faster = c.median_hours < c.prev_median_hours;
  return { text: `${faster ? '↘' : '↗'} ${ccHours(Math.abs(c.median_hours - c.prev_median_hours))}`, tone: faster ? 'up' : 'dn' };
}
export function ccShare(value: number, total: number): number { return total > 0 ? Math.round(value / total * 100) : 0; }
export function ccBodyChip(body: string, live: boolean) {
  return live ? 'LIVE' : ['Scottish Golf', 'Golf Ireland', 'Wales Golf'].includes(body) ? 'IN TALKS' : ['USGA', 'FFGolf'].includes(body) ? 'IN PLAY' : '';
}
export function ccCoverage(data: CommandCentreV2['coverage']) {
  const live = data.filter(x => x.live && x.body !== 'Not known');
  const chipped = data.filter(x => !x.live && x.body !== 'Not known' && ccBodyChip(x.body, false)).sort((a, b) => b.members - a.members);
  const rest = data.filter(x => !x.live && x.body !== 'Not known' && !ccBodyChip(x.body, false));
  const merged = rest.length ? [{ body: rest.map(x => x.body).join(' · '), members: rest.reduce((n, x) => n + x.members, 0), connected: rest.reduce((n, x) => n + x.connected, 0), waitlisted: rest.reduce((n, x) => n + x.waitlisted, 0), live: false }] : [];
  return [...live, ...chipped, ...merged, ...data.filter(x => x.body === 'Not known')];
}
export function ccLeak(data: CommandCentreV2['loop']) {
  const steps: [string, number][] = [['Joined', data.joined], ['Connected', data.connected], ['Round in', data.round_in], ['Opened', data.opened], ['Posted', data.posted], ['Invited', data.invited]];
  const drops = steps.slice(1).map((step, i) => steps[i][1] - step[1]);
  const index = drops.indexOf(Math.max(...drops)) + 1;
  return { steps, index, drop: drops[index - 1] };
}
