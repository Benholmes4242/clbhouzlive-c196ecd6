/**
 * The Wire — marker resolution.
 *
 * The parser is PURE and synchronous; anything needing the database happens
 * here, once, at parse time. The stored block always holds a uuid, so a player
 * who changes name later cannot break a published story.
 *
 * MATCHING IS EXACT, case- and space-insensitive. It deliberately does NOT
 * fuzzy-match: resolving "Scheffler" to the wrong Scheffler is worse than
 * asking the author which one they meant.
 *
 * Three marker kinds arrive here. [player:] needs a name only. [stat:] also
 * needs a statistics row to exist, and [round:] an appearance at the story's
 * tournament — a card with no figures is worse than a reported marker, so both
 * are CHECKED HERE and dropped if the data is not there.
 *
 * ONLY IDS ARE STORED. Every figure is read live at render time, so a season
 * average that moves after publication moves in the story too.
 */
import { supabase } from '@/integrations/supabase/client';
import type { ParseResult, PendingPlayer } from './parseStoryText';
import { parseStoryText, UUID_RE, type ParseContext } from './parseStoryText';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Resolve one written name to the matching sr_players ids. Exact match only. */
async function idsForName(name: string): Promise<string[]> {
  const { data } = await supabase
    .from('sr_players')
    .select('id, full_name, first_name, last_name')
    // Escape wildcards so a stray % in a name cannot widen the match.
    .ilike('full_name', name.replace(/[%_]/g, (c) => `\\${c}`))
    .limit(20);
  const key = norm(name);
  const ids: string[] = [];
  for (const row of (data ?? []) as any[]) {
    const candidates = [
      row.full_name,
      [row.first_name, row.last_name].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .map((v: string) => norm(v));
    if (candidates.includes(key) && !ids.includes(row.id)) ids.push(row.id);
  }
  return ids;
}

/** Does this player have ANY season statistics row? (S1.6) */
async function hasStatistics(playerId: string): Promise<boolean> {
  const { data } = await supabase
    .from('sr_player_statistics')
    .select('player_id')
    .eq('player_id', playerId)
    .limit(1);
  return (data ?? []).length > 0;
}

/**
 * Did this player play that tournament? (S2.6)
 *
 * hole_number = 1 ON PURPOSE. sr_scorecards stores one row per hole, and the
 * ROUND-level summary counts (birdies, bogeys, round_strokes...) are written on
 * the hole-1 row only — holes 2-18 carry nulls. This is a storage quirk, not a
 * bug: the counts describe the ROUND, not the first hole.
 */
async function playedTournament(playerId: string, tournamentId: string): Promise<boolean> {
  const { data } = await supabase
    .from('sr_scorecards')
    .select('player_id')
    .eq('player_id', playerId)
    .eq('tournament_id', tournamentId)
    .eq('hole_number', 1)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Write the resolved uuid into the placeholder block for this marker kind. */
function fill(result: ParseResult, pending: PendingPlayer, playerId: string) {
  const existing = result.blocks[pending.blockIndex];
  if (pending.kind === 'stat') {
    result.blocks[pending.blockIndex] = { type: 'stat', player_id: playerId };
  } else if (pending.kind === 'round') {
    const tid =
      pending.tournamentId ??
      (existing && existing.type === 'round' ? existing.tournament_id : '');
    result.blocks[pending.blockIndex] = { type: 'round', player_id: playerId, tournament_id: tid };
  } else {
    result.blocks[pending.blockIndex] = { type: 'player', player_id: playerId };
  }
}

/** Fill in every pending marker, dropping the ones that do not resolve. */
export async function resolveStoryMarkers(result: ParseResult): Promise<ParseResult> {
  if (result.pendingPlayers.length === 0) return result;

  // One query per distinct name: a name contains spaces and commas break the
  // `or()` filter grammar, and three names a story is not a load worth batching.
  const nameCache = new Map<string, string[]>();
  const resolveOne = async (written: string): Promise<string[]> => {
    if (UUID_RE.test(written)) return [written];
    const key = norm(written);
    if (!nameCache.has(key)) nameCache.set(key, await idsForName(written));
    return nameCache.get(key)!;
  };

  const unresolved = [...result.unresolved];
  const drop = new Set<number>();
  const dropped: Record<PendingPlayer['kind'], number> = { player: 0, stat: 0, round: 0 };

  for (const pending of result.pendingPlayers) {
    const found = await resolveOne(pending.name);

    if (found.length !== 1) {
      drop.add(pending.blockIndex);
      dropped[pending.kind] += 1;
      unresolved.push(
        found.length === 0
          ? `no player found for "${pending.name}"`
          : `"${pending.name}" matches ${found.length} players — use the uuid`,
      );
      continue;
    }

    const playerId = found[0];

    if (pending.kind === 'stat' && !(await hasStatistics(playerId))) {
      drop.add(pending.blockIndex);
      dropped.stat += 1;
      unresolved.push(`no season statistics for "${pending.name}" — stat block dropped`);
      continue;
    }

    if (pending.kind === 'round') {
      const tid = pending.tournamentId ?? '';
      if (!tid) {
        drop.add(pending.blockIndex);
        dropped.round += 1;
        unresolved.push(`round block "${pending.name}" has no tournament — pick one above`);
        continue;
      }
      if (!(await playedTournament(playerId, tid))) {
        drop.add(pending.blockIndex);
        dropped.round += 1;
        unresolved.push(`"${pending.name}" did not play this tournament — round block dropped`);
        continue;
      }
    }

    fill(result, pending, playerId);
  }

  const blocks = result.blocks.filter((_, i) => !drop.has(i));
  return {
    ...result,
    blocks,
    counts: {
      ...result.counts,
      player: result.counts.player - dropped.player,
      stat: result.counts.stat - dropped.stat,
      round: result.counts.round - dropped.round,
    },
    unresolved,
    pendingPlayers: [],
  };
}

/** Parse and resolve in one call — what the editor's Parse button runs. */
export async function parseAndResolveStoryText(source: string, ctx: ParseContext = {}) {
  return resolveStoryMarkers(parseStoryText(source, ctx));
}

/** Types whose count reads better as "resolved" than as a bare tally. */
const RESOLVED_TYPES = new Set(['player', 'leaderboard', 'stat', 'round']);

/**
 * One line the author can read without opening the preview:
 * "3 paragraphs · 1 leaderboard · 2 players resolved".
 */
export function parseSummary(result: ParseResult): string {
  const parts = Object.entries(result.counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}${RESOLVED_TYPES.has(k) ? ' resolved' : ''}`);
  return parts.join(' · ') || 'nothing';
}
