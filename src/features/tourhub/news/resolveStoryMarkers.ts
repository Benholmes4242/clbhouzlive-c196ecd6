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
 */
import { supabase } from '@/integrations/supabase/client';
import type { ParseResult } from './parseStoryText';
import { parseStoryText, type ParseContext } from './parseStoryText';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Fill in every pending player name, dropping the ones that do not resolve. */
export async function resolveStoryMarkers(result: ParseResult): Promise<ParseResult> {
  if (result.pendingPlayers.length === 0) return result;

  const names = Array.from(new Set(result.pendingPlayers.map((p) => norm(p.name))));
  const matches = new Map<string, string[]>();

  const { data } = await supabase
    .from('sr_players')
    .select('id, full_name, first_name, last_name')
    .or(names.map((n) => `full_name.ilike.${n}`).join(','))
    .limit(200);

  for (const row of (data ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }>) {
    const candidates = new Set(
      [row.full_name, [row.first_name, row.last_name].filter(Boolean).join(' ')]
        .filter(Boolean)
        .map((v) => norm(v as string)),
    );
    for (const key of candidates) {
      if (!names.includes(key)) continue;
      const list = matches.get(key) ?? [];
      if (!list.includes(row.id)) list.push(row.id);
      matches.set(key, list);
    }
  }

  const unresolved = [...result.unresolved];
  const drop = new Set<number>();

  for (const pending of result.pendingPlayers) {
    const found = matches.get(norm(pending.name)) ?? [];
    if (found.length === 1) {
      result.blocks[pending.blockIndex] = { type: 'player', player_id: found[0] };
    } else {
      drop.add(pending.blockIndex);
      unresolved.push(
        found.length === 0
          ? `no player found for "${pending.name}"`
          : `"${pending.name}" matches ${found.length} players — use the uuid`,
      );
    }
  }

  const blocks = result.blocks.filter((_, i) => !drop.has(i));
  return {
    ...result,
    blocks,
    counts: { ...result.counts, player: result.counts.player - drop.size },
    unresolved,
    pendingPlayers: [],
  };
}

/** Parse and resolve in one call — what the editor's Parse button runs. */
export async function parseAndResolveStoryText(source: string, ctx: ParseContext = {}) {
  return resolveStoryMarkers(parseStoryText(source, ctx));
}

/**
 * One line the author can read without opening the preview:
 * "3 paragraphs · 1 leaderboard · 2 players resolved".
 */
export function parseSummary(result: ParseResult): string {
  const parts = Object.entries(result.counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}${k === 'player' || k === 'leaderboard' ? ' resolved' : ''}`);
  return parts.join(' · ') || 'nothing';
}
