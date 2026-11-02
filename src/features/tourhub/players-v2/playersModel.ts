/**
 * playersModel — joins the page's reads into the rows the views render, and
 * reads one stat's value for one row. Pure: no React, no reads.
 */
import type { RankedRow } from './data/usePlayersRanking';
import type { ScorecardStat } from './data/useScorecardStats';
import type { WorldRankMap } from './data/useWorldRankLookup';
import { asPercent, displayPlayerName, qualifies, rankStat, STAT_DEFS, type StandingRow, type StatEntry, type Start } from './playersRules';

export interface PlayerView extends StandingRow {
  rawName: string;
  country: string | null;
  tourCode: string | null;
  photoUrl: string | null;
  followed: boolean;
  moved: number | null;
  world: number | null;
  form: Start[];
  source: RankedRow;
}

export function buildPlayers(args: {
  rows: RankedRow[];
  follows: Set<string>;
  movement: Map<string, number> | undefined;
  form: Map<string, Start[]> | undefined;
  world: WorldRankMap | undefined;
}): PlayerView[] {
  return args.rows.map((r) => ({
    key: r.playerKey || r.playerId || r.name.toLowerCase(),
    playerId: r.playerId,
    rank: r.rank,
    name: displayPlayerName(r.name),
    rawName: r.rawName,
    points: r.stat,
    wins: r.wins,
    top10s: r.top10s,
    events: r.eventsPlayed,
    country: r.countryCode || r.country,
    tourCode: r.tourCode,
    photoUrl: r.photoUrl,
    followed: !!r.playerId && args.follows.has(r.playerId),
    moved: args.movement?.get(r.playerKey) ?? null,
    world: (r.playerId && args.world?.[r.playerId]?.rank) || null,
    form: (r.playerId && args.form?.get(r.playerId)) || [],
    source: r,
  }));
}

function rawStat(raw: unknown, ...keys: string[]): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nested = o.statistics && typeof o.statistics === 'object' ? (o.statistics as Record<string, unknown>) : o;
  for (const k of keys) {
    const v = Number(nested[k]);
    if (Number.isFinite(v) && v !== 0) return v;
  }
  return null;
}

const nz = (v: number | null | undefined) => (v == null || !Number.isFinite(Number(v)) || Number(v) === 0 ? null : Number(v));

export function statValue(key: string, p: PlayerView, isPga: boolean, scorecard: Map<string, ScorecardStat> | undefined): number | null {
  if (key === 'world_rank') return p.world;
  if (key === 'wins') return p.wins;
  if (isPga) {
    const s = p.source.pga;
    if (!s) return null;
    switch (key) {
      case 'scoring_avg': return nz(s.scoring_average);
      case 'strokes_gained_total': return rawStat(s.raw_data, 'strokes_gained_total', 'strokesGainedTotal');
      case 'strokes_gained_tee_green': return s.strokes_gained_tee_green == null ? null : Number(s.strokes_gained_tee_green);
      case 'strokes_gained_putting': return s.strokes_gained_putting == null ? null : Number(s.strokes_gained_putting);
      case 'drive_avg': return nz(s.driving_distance);
      case 'drive_acc': return nz(s.driving_accuracy);
      case 'gir_pct': return nz(s.greens_in_reg);
      case 'scrambling': return rawStat(s.raw_data, 'scrambling', 'scrambling_pct');
      case 'sand_saves_pct': return nz(s.sand_saves);
      case 'putt_avg': return nz(s.putting_average);
      case 'birdies_per_round': return rawStat(s.raw_data, 'birdies_per_round', 'birdiesPerRound');
      case 'top_10': return p.top10s;
      case 'top_25': return s.top_25s;
      case 'cuts_made': return s.cuts_made;
      case 'earnings': return nz(s.earnings);
      default: return null;
    }
  }
  const c = p.playerId ? scorecard?.get(p.playerId) : undefined;
  if (!c) return null;
  switch (key) {
    case 'scoring_avg': return nz(c.scoring_avg);
    case 'birdies_per_round': return c.birdies_per_round ?? null;
    case 'bogey_rate': return asPercent(c.bogey_rate);
    case 'par3': return c.par3 ?? null;
    case 'par4': return c.par4 ?? null;
    case 'par5': return c.par5 ?? null;
    default: return null;
  }
}

export function statList(key: string, players: PlayerView[], isPga: boolean, scorecard: Map<string, ScorecardStat> | undefined): StatEntry<PlayerView>[] {
  const d = STAT_DEFS[key];
  if (!d) return [];
  const items: Array<{ row: PlayerView; value: number }> = [];
  for (const p of players) {
    const value = statValue(key, p, isPga, scorecard);
    const rounds = p.playerId ? scorecard?.get(p.playerId)?.rounds ?? null : null;
    if (qualifies(d, { value, starts: p.events, rounds }, isPga)) items.push({ row: p, value: value as number });
  }
  return rankStat(d, items);
}
