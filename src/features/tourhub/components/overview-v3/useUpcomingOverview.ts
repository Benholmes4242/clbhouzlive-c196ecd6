/** Shared selected-upcoming snapshot. Draw rows use AlsoThisWeek's exact
 * sr_tee_times → sr_tee_time_players → sr_players source via useTeeTimesAll.
 * Before publication the canonical get_pick_field supplies membership/rank;
 * failed reads suppress their dependent facts. No live/completed reads. */
import { usePickField } from '../../hooks/useTournamentPick';
import { useTournamentLastYearTop4 } from '../../hooks/useTournamentLastYearTop4';
import { useTeeTimesAll } from '../../tournament-v2/data/useTeeTimesAll';
import { useTournamentMeta } from '../../leaderboard/useTournamentMeta';
import { useTournamentCourseHoles } from '../../tournament-v2/data/useTournamentCourseHoles';
import type { UpcomingPlayer } from './upcomingOverviewRules';
export function useUpcomingOverview(id: string | null) {
  const fieldQuery = usePickField(id ?? '');
  const drawQuery = useTeeTimesAll(id, 1, { enabled: !!id });
  const lastQuery = useTournamentLastYearTop4(id);
  const metaQuery = useTournamentMeta(id);
  const holesQuery = useTournamentCourseHoles(id ?? undefined);
  const groups = !id || drawQuery.isError ? [] : drawQuery.data ?? [];
  const ranked = !id || fieldQuery.isError ? [] : fieldQuery.data ?? [];
  const drawn = groups.length > 0;
  const players = new Map<string, UpcomingPlayer>();
  if (drawn) for (const group of groups) for (const player of group.players) {
    if (player.id && !players.has(player.id)) players.set(player.id, { id: player.id, name: player.name, teeTime: group.teeTime, worldRank: ranked.find(p => p.player_id === player.id)?.world_rank });
  }
  else for (const player of ranked) players.set(player.player_id, { id: player.player_id, name: player.full_name, worldRank: player.world_rank });
  return { field: [...players.values()], drawn, first: drawn ? groups[0]?.teeTime ?? null : null,
    last: !id || lastQuery.isError ? [] : lastQuery.data ?? [],
    zone: !id || metaQuery.isError ? null : metaQuery.data?.course_timezone ?? metaQuery.data?.timezone ?? null,
    holes: !id || holesQuery.isError ? [] : holesQuery.data ?? [] };
}