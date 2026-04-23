/**
 * useResolvedLeaderboardEntities — Canonical resolver for leaderboard rows.
 *
 * sr_leaderboards rows are XOR: exactly one of player_id or team_id is set.
 * This module provides:
 *   - LEADERBOARD_ENTITY_SELECT: Supabase select string that joins both sides
 *     (NEITHER uses !inner — !inner on either would drop the other side).
 *   - resolveLeaderboardEntity(): converts a joined row into a uniform display entity.
 *
 * Consumers should swap their inline select for LEADERBOARD_ENTITY_SELECT and
 * call resolveLeaderboardEntity() per row.
 */

export type LeaderboardEntity = {
  kind: 'player' | 'team';
  /** Sportradar id — player sr_id or team sr_id */
  sr_id: string;
  /** Internal Supabase id — sr_players.id or sr_teams.id */
  id: string;
  full_name: string;        // "Rory McIlroy" OR "Smalley / Springer"
  display_name: string;     // alias of full_name
  /** Compact display name — "S. Scheffler" for players, "Smalley / Springer" for teams */
  short_name: string;
  avatar: {
    primary: { photo_url: string | null; sr_id: string };
    /** Present only for teams */
    secondary?: { photo_url: string | null; sr_id: string };
    silhouette_fallback: boolean;
  };
  country: string | null;
  country_code: string | null;
  pga_tour_id: string | null;   // null for teams
  tour_code: string | null;     // primary tour for headshot lookup
  headshot_override: string | null;
  /** Present only for teams, ordered by position_in_team ascending */
  players?: Array<{
    id: string;
    sr_id: string;
    full_name: string;
    photo_url: string | null;
    country: string | null;
  }>;
};

/**
 * Canonical select string. Use as the second argument to
 * supabase.from('sr_leaderboards').select(...).
 *
 * Add additional sr_leaderboards columns by concatenating with this constant
 * inside the consuming hook — e.g. `${LEADERBOARD_ENTITY_SELECT}, money, points`.
 */
export const LEADERBOARD_ENTITY_SELECT = `
  tournament_id,
  position,
  position_tied,
  score,
  strokes,
  thru,
  round_1,
  round_2,
  round_3,
  round_4,
  status,
  starting_score,
  wins,
  losses,
  player:sr_players!sr_leaderboards_player_id_fkey(
    id, sr_id, first_name, last_name, full_name, photo_url, pga_tour_id, country, tour_codes, headshot_override
  ),
  team:sr_teams!sr_leaderboards_team_id_fkey(
    id, sr_id, display_name, abbr_name, country,
    members:sr_team_players(
      position_in_team,
      player:sr_players!sr_team_players_player_id_fkey(
        id, sr_id, first_name, last_name, full_name, photo_url, country
      )
    )
  )
`;

type JoinedRow = {
  player?: {
    id: string;
    sr_id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    country: string | null;
    tour_codes?: string[] | null;
    headshot_override?: string | null;
  } | null;
  team?: {
    id: string;
    sr_id: string;
    display_name: string | null;
    abbr_name: string | null;
    country: string | null;
    members: Array<{
      position_in_team: number;
      player: {
        id: string;
        sr_id: string;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        photo_url: string | null;
        country: string | null;
      } | null;
    }>;
  } | null;
};

function buildShortName(first: string | null | undefined, last: string | null | undefined, fallback: string): string {
  if (first && first[0] && last) return `${first[0]}. ${last}`;
  return fallback;
}

export function resolveLeaderboardEntity(row: JoinedRow): LeaderboardEntity | null {
  if (row.team) {
    const members = (row.team.members || [])
      .filter(m => m.player != null)
      .sort((a, b) => a.position_in_team - b.position_in_team);

    const players = members.map(m => ({
      id: m.player!.id,
      sr_id: m.player!.sr_id,
      full_name:
        m.player!.full_name ||
        `${m.player!.first_name || ''} ${m.player!.last_name || ''}`.trim(),
      photo_url: m.player!.photo_url,
      country: m.player!.country,
    }));

    const name = row.team.abbr_name || row.team.display_name || '';

    return {
      kind: 'team',
      id: row.team.id,
      sr_id: row.team.sr_id,
      full_name: name,
      display_name: name,
      short_name: name,
      avatar: {
        primary: {
          photo_url: players[0]?.photo_url ?? null,
          sr_id: players[0]?.sr_id ?? '',
        },
        secondary: players[1]
          ? { photo_url: players[1].photo_url, sr_id: players[1].sr_id }
          : undefined,
        silhouette_fallback: players.every(p => !p.photo_url),
      },
      country: row.team.country,
      country_code: null,
      pga_tour_id: null,
      tour_code: null,
      headshot_override: null,
      players,
    };
  }

  if (row.player) {
    const name =
      row.player.full_name ||
      `${row.player.first_name || ''} ${row.player.last_name || ''}`.trim();

    return {
      kind: 'player',
      id: row.player.id,
      sr_id: row.player.sr_id,
      full_name: name,
      display_name: name,
      short_name: buildShortName(row.player.first_name, row.player.last_name, name),
      avatar: {
        primary: { photo_url: row.player.photo_url, sr_id: row.player.sr_id },
        silhouette_fallback: !row.player.photo_url,
      },
      country: row.player.country,
      country_code: null,
      pga_tour_id: row.player.pga_tour_id,
      tour_code: row.player.tour_codes?.[0] ?? null,
      headshot_override: row.player.headshot_override ?? null,
      players: [{
        id: row.player.id,
        sr_id: row.player.sr_id,
        full_name: name,
        photo_url: row.player.photo_url,
        country: row.player.country,
      }],
    };
  }

  return null;
}
