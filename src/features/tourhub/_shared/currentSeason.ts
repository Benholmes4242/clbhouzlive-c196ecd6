/**
 * currentSeasonFor(tour) — the ONE rule for "current season".
 *
 * The current season is the season of the tour's earliest event that hasn't
 * finished (end_date ≥ today, any status except cancelled). If there is none,
 * the season of its most recently finished event.
 *
 * Derived from sr_tournaments joined to sr_seasons, never from sr_seasons'
 * status/dates (historically NULL) and never from the highest year: next
 * season's rows load months before this season ends (DP World opens in late
 * November), so "newest year" is wrong for most of the autumn.
 */
import { supabase } from '@/integrations/supabase/client';
import type { TourId } from '../hooks/useOverviewData';

export interface SeasonEventRow {
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  season: { id: string; year: number | null } | null;
}

export interface CurrentSeason { id: string; year: number | null }

const CANCELLED = new Set(['cancelled', 'canceled']);

/** Pure picker; `today` is yyyy-MM-dd (UTC). */
export function pickCurrentSeason(rows: SeasonEventRow[], today: string): CurrentSeason | null {
  const live = rows.filter((r) => r.season && r.end_date && !CANCELLED.has((r.status ?? '').toLowerCase()));
  const pending = live
    .filter((r) => (r.end_date as string) >= today)
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '') || (a.end_date as string).localeCompare(b.end_date as string));
  const pick = pending[0] ?? live
    .filter((r) => (r.end_date as string) < today)
    .sort((a, b) => (b.end_date as string).localeCompare(a.end_date as string))[0];
  return pick?.season ? { id: pick.season.id, year: pick.season.year ?? null } : null;
}

export const todayUTC = (now = new Date()) => now.toISOString().slice(0, 10);

export async function currentSeasonFor(tour: TourId, now = new Date()): Promise<CurrentSeason | null> {
  const today = todayUTC(now);
  const base = () => supabase
    .from('sr_tournaments')
    .select('start_date, end_date, status, season:sr_seasons!inner(id, year, tour_name)')
    .ilike('season.tour_name', tour)
    .or('status.is.null,status.not.in.(cancelled,canceled)');
  const next = await base().gte('end_date', today).order('start_date', { ascending: true }).limit(5);
  if (next.error) throw next.error;
  const hit = pickCurrentSeason((next.data ?? []) as unknown as SeasonEventRow[], today);
  if (hit) return hit;
  const last = await base().lt('end_date', today).order('end_date', { ascending: false }).limit(5);
  if (last.error) throw last.error;
  return pickCurrentSeason((last.data ?? []) as unknown as SeasonEventRow[], today);
}
