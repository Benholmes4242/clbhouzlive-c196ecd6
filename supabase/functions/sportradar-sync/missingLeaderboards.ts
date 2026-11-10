/** Manual missing-leaderboard sweep: database anti-join before the 25-event
 * cap, rolling 400 UTC days, season-owned API tour/year and persisted readback.
 * Only this function owns the 1.5-second gap; no cron or schedule is created. */
export interface MissingLeaderboardEvent {
  id: string; sr_id: string; name: string;
  season: { tour_name: string; year: number };
}
export async function backfillMissingLeaderboards(
  supabase: any,
  sync: (tour: string, year: number, srId: string) => Promise<unknown>,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
  now = new Date(),
) {
  const since = new Date(now.getTime() - 400 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase.from('sr_tournaments')
    .select('id, sr_id, name, season:sr_seasons!inner(tour_name, year), sr_leaderboards!left(id)')
    .eq('status', 'closed').gte('start_date', since)
    .lte('start_date', now.toISOString().slice(0, 10))
    .is('sr_leaderboards', null).order('start_date', { ascending: true }).limit(25);
  if (error) throw error;
  const events: MissingLeaderboardEvent[] = data ?? [];
  let filled = 0;
  const still_missing: string[] = [];
  for (const [index, event] of events.entries()) {
    if (index > 0) await pause(1500);
    try {
      await sync(event.season.tour_name.toLowerCase(), event.season.year, event.sr_id);
      const { count, error: readError } = await supabase.from('sr_leaderboards')
        .select('id', { count: 'exact', head: true }).eq('tournament_id', event.id);
      if (readError) throw readError;
      if ((count ?? 0) > 0) filled++;
      else still_missing.push(event.name);
    } catch {
      still_missing.push(event.name);
    }
  }
  return { checked: events.length, filled, still_missing };
}