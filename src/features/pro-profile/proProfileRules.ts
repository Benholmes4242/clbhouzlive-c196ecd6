/** Profile-only calendar-year and score-source rules. OWGR storage stays gross;
 * OWGR display is strokes-only; pro-added and covered-tour scores stay to-par.
 */
import type { Database } from '@/integrations/supabase/types';
import type { PlayerResult } from '@/features/tourhub/player-v2/data/usePlayerData';
export type ProRound = Database['public']['Tables']['pro_event_rounds']['Row'];
export type ProEvent = Pick<Database['public']['Tables']['pro_events']['Row'], 'id' | 'user_id' | 'source' | 'event_name' | 'tour_name' | 'start_date' | 'end_date' | 'country' | 'venue' | 'finish' | 'to_par' | 'total_strokes' | 'scheduled_rounds' | 'tee_time' | 'tee_hole' | 'owgr_event_id' | 'owgr_points' | 'owgr_rank_before' | 'owgr_rank_after' | 'owgr_year' | 'owgr_week' | 'created_at' | 'updated_at'> & { rounds: ProRound[] };
export interface WorldRank { rank: number; ranking_date: string; prior_rank: number | null; season_start_rank: number | null; best_rank: number | null; source: string }
export function parseWorldRank(value: unknown): WorldRank | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || typeof v !== 'object' || !('rank' in v) || typeof v.rank !== 'number') return null;
  const row = v as Record<string, unknown>;
  const number = (key: string) => typeof row[key] === 'number' ? row[key] as number : null;
  return { rank: v.rank, ranking_date: String(row.ranking_date ?? ''), prior_rank: number('prior_rank'), season_start_rank: number('season_start_rank'), best_rank: number('best_rank'), source: String(row.source ?? '') };
}
export function rankMovement(rank: WorldRank | null) {
  if (!rank) return null;
  const base = rank.season_start_rank ?? rank.prior_rank;
  if (base == null || base === rank.rank) return null;
  return { improved: base > rank.rank, difference: Math.abs(base - rank.rank), period: rank.season_start_rank != null ? 'this season' : 'this week' };
}
export function finishPosition(finish: string | null): number | null {
  const match = finish?.match(/^T?(\d+)(?:st|nd|rd|th)?$/i);
  return match && Number(match[1]) > 0 ? Number(match[1]) : null;
}
export function finishLabel(finish: string | null) {
  if (!finish || /^T/i.test(finish)) return finish ?? '—';
  const n = finishPosition(finish);
  if (n == null) return finish;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthLabel = (date: string | null) => date ? MONTHS[new Date(`${date.slice(0,10)}T12:00:00Z`).getUTCMonth()] ?? '' : '';
export const formatWorldRank = (rank: number | null) => rank == null ? '—' : rank.toLocaleString('en-GB');
export function pointsCopy(points: number | null) {
  return points == null || points <= 0 ? '' : points < .005 ? ' Under 0.01 ranking points earned.' : ` ${points.toFixed(2)} ranking points earned.`;
}
export const scoreLabel = (score: number | null) => score == null ? '—' : score < 0 ? `−${Math.abs(score)}` : score === 0 ? 'E' : `+${score}`;
export function eventYear(event: ProEvent): number | null { return event.start_date ? Number(event.start_date.slice(0, 4)) : event.owgr_year; }
export function sortedEvents(events: ProEvent[]) {
  return [...events].sort((a, b) => {
    const key = (e: ProEvent) => e.start_date ?? (e.owgr_year != null ? new Date(Date.UTC(e.owgr_year, 0, 1 + ((e.owgr_week ?? 1) - 1) * 7)).toISOString().slice(0, 10) : '');
    return key(b).localeCompare(key(a)) || a.id.localeCompare(b.id);
  });
}
export function seasonSummary(events: ProEvent[], year: number) {
  const rows = events.filter(e => eventYear(e) === year && e.finish != null);
  const best = rows.map(e => ({ finish: e.finish, position: finishPosition(e.finish) })).filter(e => e.position != null).sort((a, b) => Number(a.position) - Number(b.position))[0];
  const strokes = rows.flatMap(e => e.source === 'owgr' ? e.rounds.filter(r => r.source === 'owgr' && r.strokes != null).map(r => Number(r.strokes)) : []);
  return { events: rows.length, cuts: rows.filter(e => !['MC', 'WD', 'DQ'].includes(e.finish?.toUpperCase() ?? '')).length, top10s: rows.filter(e => { const p = finishPosition(e.finish); return p != null && p <= 10; }).length, best: best?.finish ?? null, average: strokes.length ? (strokes.reduce((a, b) => a + b, 0) / strokes.length).toFixed(1) : null };
}
export function tourEvents(results: PlayerResult[], userId: string): ProEvent[] {
  return results.map(r => ({ id: r.tournament_id, user_id: userId, source: 'tour', event_name: r.name, tour_name: r.tour, start_date: r.start_date, end_date: r.end_date, finish: ['MC','WD','DQ'].includes(r.status?.toUpperCase()) ? r.status.toUpperCase() : r.display_position ?? String(r.finish_position), to_par: r.score, total_strokes: null, venue: null, country: null, tee_time: null, tee_hole: null, scheduled_rounds: null, owgr_event_id: null, owgr_points: null, owgr_rank_before: null, owgr_rank_after: null, owgr_week: null, owgr_year: null, created_at: '', updated_at: '', rounds: [r.round_1,r.round_2,r.round_3,r.round_4].flatMap((score, i) => score == null ? [] : [{ event_id: r.tournament_id, round_no: i + 1, to_par: score, strokes: null, holes_played: 18, source: 'tour', posted_at: '' }]) }));
}
