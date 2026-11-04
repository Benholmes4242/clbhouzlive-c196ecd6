/** Only public board rows determine grouping/counts. Field/results never fill
 * missing members. Six-name disclosure and viewer/followed priority live here. */
import type { TournamentPicksBoardRow } from '../../../hooks/useTournamentPick';
export const PICKS_VISIBLE_MEMBERS = 6;
export const pickMemberName = (row: TournamentPicksBoardRow) => row.display_name?.trim() || row.username?.trim() || '';
export function groupTournamentPicks(rows: TournamentPicksBoardRow[]) {
  const groups = new Map<string, { playerId: string; playerName: string; members: TournamentPicksBoardRow[] }>();
  for (const row of rows) {
    const group = groups.get(row.player_id) ?? { playerId: row.player_id, playerName: row.player_name, members: [] };
    group.members.push(row);
    groups.set(row.player_id, group);
  }
  return [...groups.values()].map(group => ({ ...group, members: [...group.members].sort((a,b) =>
    Number(b.is_viewer)-Number(a.is_viewer) || Number(b.is_followed)-Number(a.is_followed) || pickMemberName(a).localeCompare(pickMemberName(b)))
  })).sort((a,b) => b.members.length-a.members.length || a.playerName.localeCompare(b.playerName));
}