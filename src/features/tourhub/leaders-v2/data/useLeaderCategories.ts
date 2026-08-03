/**
 * useLeaderCategories - "The Boards" data source of truth (per-tour).
 *
 * Per-tour category reality (fields ARE real; nothing is faked):
 *
 *   pga (sr_player_statistics) - 11 categories:
 *     earnings                  (desc)  USD
 *     scoring_average           (asc)   AVG
 *     wins                      (desc)  WINS
 *     top_10s                   (desc)  TOP 10
 *     driving_distance          (desc)  YDS
 *     driving_accuracy          (desc)  %
 *     greens_in_reg             (desc)  %
 *     sand_saves                (desc)  %
 *     putting_average           (asc)   PUTTS
 *     strokes_gained_tee_green  (desc)  SG
 *     strokes_gained_putting    (desc)  SG
 *
 *   euro / lpga / pgad / liv (tour_season_rankings):
 *     points  (desc)  PTS  (per-tour brand label: Race to Dubai / CME Points / LIV Points / Season Points)
 *     wins    (desc)  WINS (only when wins column has any nonzero)
 *
 *   all tours (sr_world_rankings) - PGA-only per editorial policy:
 *     world_rank (asc rank -> desc points, latest ranking_date)  OWGR PTS
 *
 * ONE fetch per data source per tour - categories share the pool. The
 * FullListSheet reads the same top-50 slice; the board slices to 3.
 *
 * i18n - LEADER_STAT_LABELS is the canonical registry of category KEY ->
 * { labelKey, shortKey, unitKey } consumed by StatBoard, FullListSheet, and
 * (Wave 3e.iv Turn C.3) player-v2/StatsSheet. One source of truth per stat.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourId } from '../../hooks/useOverviewData';
import { formatCurrencyUsd, formatNumber, formatNumberMaxFrac } from '@/i18n/format';
import { movementFrom } from '../../_shared/movement';

export interface LeaderRow {
  playerId: string;
  /** Numeric competition rank. Ties share the lower rank. Never a string:
   *  used as a React key fallback and as an analytics prop. */
  rank: number;
  /** What is displayed: "3", "T3", "T12". */
  rankLabel: string;
  /** True when at least one other row in the list shares this rank. */
  tied: boolean;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
  value: number;
  valueFormatted: string;
  /** prior_rank - rank. Populated for world_rank only; null everywhere else. */
  movement: number | null;
  /** Gap to the leader, formatted with the category's OWN formatter, always as
   *  a positive quantity. null on the leader row and on exact ties. */
  behindFormatted: string | null;
}

/**
 * Standard competition ranking ("1224"): equal values share the lower rank and
 * the next distinct value skips. Input MUST already be sorted in display order.
 *
 * Equality is decided on the DISPLAYED figure, not the raw one: 74.34 and 74.28
 * both render "74.3%", so they are a tie as far as the member can see.
 */
function applyCompetitionRanks<T extends { value: number; rank: number; rankLabel: string; tied: boolean }>(
  rows: T[],
  format: (v: number) => string,
): T[] {
  let prevKey: string | null = null;
  let prevRank = 0;
  const counts = new Map<number, number>();
  rows.forEach((r, i) => {
    const key = format(r.value);
    const rank = prevKey !== null && key === prevKey ? prevRank : i + 1;
    r.rank = rank;
    prevKey = key;
    prevRank = rank;
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  });
  for (const r of rows) {
    r.tied = (counts.get(r.rank) ?? 0) > 1;
    r.rankLabel = r.tied ? `T${r.rank}` : String(r.rank);
  }
  return rows;
}

/**
 * Stamps `behindFormatted` on a leader-first row list. The direction flips with
 * the sort so the gap is always positive: higher-is-better reads
 * leader - value, lower-is-better reads value - leader.
 */
function applyBehind(
  rows: LeaderRow[],
  dir: 'asc' | 'desc',
  format: (v: number) => string,
): LeaderRow[] {
  if (rows.length < 2) return rows;
  const leaderValue = rows[0].value;
  const zero = format(0);
  for (let i = 1; i < rows.length; i++) {
    const gap = dir === 'desc' ? leaderValue - rows[i].value : rows[i].value - leaderValue;
    if (!(gap > 0)) continue;
    const s = format(gap);
    // An exact tie formats identically to zero -> render nothing, not "0 behind".
    if (s === zero) continue;
    rows[i].behindFormatted = dir === 'asc' && !/^[+$]/.test(s) ? `+${s}` : s;
  }
  return rows;
}


// Canonical category-label registry. Keys are the stable category identifiers
// (never displayed, never compared against translated labels). Values point at
// the i18n keys under tourhub#leaders.stat.<key>.{label,short,unit}. Shared
// between leaders-v2 (StatBoard/FullListSheet) and player-v2 (StatsSheet, C.3).
export interface LeaderStatLabelSet {
  labelKey: string;
  shortKey: string;
  unitKey: string;
}
export const LEADER_STAT_LABELS: Record<string, LeaderStatLabelSet> = {
  earnings:                    { labelKey: 'leaders.stat.earnings.label',                    shortKey: 'leaders.stat.earnings.short',                    unitKey: 'leaders.stat.earnings.unit' },
  scoring_avg:                 { labelKey: 'leaders.stat.scoring_avg.label',                 shortKey: 'leaders.stat.scoring_avg.short',                 unitKey: 'leaders.stat.scoring_avg.unit' },
  wins:                        { labelKey: 'leaders.stat.wins.label',                        shortKey: 'leaders.stat.wins.short',                        unitKey: 'leaders.stat.wins.unit' },
  top_10:                      { labelKey: 'leaders.stat.top_10.label',                      shortKey: 'leaders.stat.top_10.short',                      unitKey: 'leaders.stat.top_10.unit' },
  drive_avg:                   { labelKey: 'leaders.stat.drive_avg.label',                   shortKey: 'leaders.stat.drive_avg.short',                   unitKey: 'leaders.stat.drive_avg.unit' },
  drive_acc:                   { labelKey: 'leaders.stat.drive_acc.label',                   shortKey: 'leaders.stat.drive_acc.short',                   unitKey: 'leaders.stat.drive_acc.unit' },
  gir_pct:                     { labelKey: 'leaders.stat.gir_pct.label',                     shortKey: 'leaders.stat.gir_pct.short',                     unitKey: 'leaders.stat.gir_pct.unit' },
  sand_saves_pct:              { labelKey: 'leaders.stat.sand_saves_pct.label',              shortKey: 'leaders.stat.sand_saves_pct.short',              unitKey: 'leaders.stat.sand_saves_pct.unit' },
  putt_avg:                    { labelKey: 'leaders.stat.putt_avg.label',                    shortKey: 'leaders.stat.putt_avg.short',                    unitKey: 'leaders.stat.putt_avg.unit' },
  strokes_gained_tee_green:    { labelKey: 'leaders.stat.strokes_gained_tee_green.label',    shortKey: 'leaders.stat.strokes_gained_tee_green.short',    unitKey: 'leaders.stat.strokes_gained_tee_green.unit' },
  strokes_gained_putting:      { labelKey: 'leaders.stat.strokes_gained_putting.label',      shortKey: 'leaders.stat.strokes_gained_putting.short',      unitKey: 'leaders.stat.strokes_gained_putting.unit' },
  world_rank:                  { labelKey: 'leaders.stat.world_rank.label',                  shortKey: 'leaders.stat.world_rank.short',                  unitKey: 'leaders.stat.world_rank.unit' },
  points:                      { labelKey: 'leaders.stat.points.label',                      shortKey: 'leaders.stat.points.short',                      unitKey: 'leaders.stat.points.unit' },
  // Wave 3e.iv Turn C.3 extensions - consumed by player-v2/StatsSheet.
  events_played:               { labelKey: 'leaders.stat.events_played.label',               shortKey: 'leaders.stat.events_played.short',               unitKey: 'leaders.stat.events_played.unit' },
  top_25:                      { labelKey: 'leaders.stat.top_25.label',                      shortKey: 'leaders.stat.top_25.short',                      unitKey: 'leaders.stat.top_25.unit' },
  cuts_made:                   { labelKey: 'leaders.stat.cuts_made.label',                   shortKey: 'leaders.stat.cuts_made.short',                   unitKey: 'leaders.stat.cuts_made.unit' },
  birdies_per_round:           { labelKey: 'leaders.stat.birdies_per_round.label',           shortKey: 'leaders.stat.birdies_per_round.short',           unitKey: 'leaders.stat.birdies_per_round.unit' },
  scrambling:                  { labelKey: 'leaders.stat.scrambling.label',                  shortKey: 'leaders.stat.scrambling.short',                  unitKey: 'leaders.stat.scrambling.unit' },
  strokes_gained_total:        { labelKey: 'leaders.stat.strokes_gained_total.label',        shortKey: 'leaders.stat.strokes_gained_total.short',        unitKey: 'leaders.stat.strokes_gained_total.unit' },
  strokes_gained_around_green: { labelKey: 'leaders.stat.strokes_gained_around_green.label', shortKey: 'leaders.stat.strokes_gained_around_green.short', unitKey: 'leaders.stat.strokes_gained_around_green.unit' },
};

// Per-tour override for the points category display label (brand names).
// shortKey/unitKey stay on the generic points entry above.
const POINTS_LABEL_KEY_BY_TOUR: Partial<Record<TourId, string>> = {
  euro: 'leaders.pointsBrand.euro',
  lpga: 'leaders.pointsBrand.lpga',
  liv:  'leaders.pointsBrand.liv',
};

export interface LeaderCategoryDef {
  key: string;
  labelKey: string;      // t() -> full title ("Season Earnings")
  shortKey: string;      // t() -> eyebrow ("EARNINGS")
  unitKey: string;       // t() -> right-column subtitle in the sheet header
  rows: LeaderRow[];     // top 50
  poolSize: number;      // players in the category pool BEFORE the top-50 slice
}

/**
 * ADDITIVE (player-v2/StatsSheet): category key -> player_id -> rank.
 * Built over the FULL ranked pool, not the top-50 slice. Empty on every
 * non-PGA tour, where tour_season_rankings carries no stat columns.
 */
export type LeaderRankMaps = Record<string, Record<string, { rank: number; tied: boolean }>>;

export interface LeaderCategoriesResult {
  synced: boolean;
  categories: LeaderCategoryDef[];
  year: number;
  /** Additive. Empty object off the PGA Tour. */
  rankMaps?: LeaderRankMaps;
}


// -- formatting helpers
function fmtMoneyCompact(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
  return formatCurrencyUsd(Math.round(v));
}
function fmtAvg(v: number): string {
  return v.toFixed(2);
}
function fmtAvg3(v: number): string {
  return v.toFixed(3);
}
function fmtInt(v: number): string {
  return formatNumber(Math.round(v));
}
function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}
function fmtYds(v: number): string {
  return `${v.toFixed(1)}`;
}
function fmtSG(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

async function resolvePgaSeasonId(): Promise<string | null> {
  const year = currentSeasonYear();
  for (const y of [year, year - 1]) {
    const { data, error } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('tour_name', 'pga')
      .eq('year', y)
      .limit(10);
    if (error) throw error;
    for (const row of data ?? []) {
      const { count, error: cntErr } = await supabase
        .from('sr_player_statistics')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', row.id);
      if (cntErr) throw cntErr;
      if ((count ?? 0) > 0) return row.id;
    }
  }
  return null;
}

// PGA category definitions (accessor + sort + format). Labels are resolved via
// LEADER_STAT_LABELS[key] at render - no display strings live here.
type PgaStatRow = {
  player_id: string | null;
  earnings: number | null;
  scoring_average: number | null;
  wins: number | null;
  top_10s: number | null;
  driving_distance: number | null;
  driving_accuracy: number | null;
  greens_in_reg: number | null;
  sand_saves: number | null;
  putting_average: number | null;
  strokes_gained_tee_green: number | null;
  strokes_gained_putting: number | null;
};

type TourSeasonRankingRow = {
  player_id: string | null;
  manual_player_id: string | null;
  player_name: string | null;
  position: number | null;
  points: number | null;
  wins: number | null;
  country: string | null;
  tour_code: string | null;
};

interface PgaCatSpec {
  key: string;
  dir: 'asc' | 'desc';
  accessor: (s: PgaStatRow) => number | null;
  format: (v: number) => string;
}

const PGA_CATS: PgaCatSpec[] = [
  { key: 'earnings',                 dir: 'desc', accessor: (s) => s.earnings,                 format: fmtMoneyCompact },
  { key: 'scoring_avg',              dir: 'asc',  accessor: (s) => s.scoring_average,          format: fmtAvg3 },
  { key: 'wins',                     dir: 'desc', accessor: (s) => s.wins,                     format: fmtInt },
  { key: 'top_10',                   dir: 'desc', accessor: (s) => s.top_10s,                  format: fmtInt },
  { key: 'drive_avg',                dir: 'desc', accessor: (s) => s.driving_distance,         format: fmtYds },
  { key: 'drive_acc',                dir: 'desc', accessor: (s) => s.driving_accuracy,         format: fmtPct },
  { key: 'gir_pct',                  dir: 'desc', accessor: (s) => s.greens_in_reg,            format: fmtPct },
  { key: 'sand_saves_pct',           dir: 'desc', accessor: (s) => s.sand_saves,               format: fmtPct },
  { key: 'putt_avg',                 dir: 'asc',  accessor: (s) => s.putting_average,          format: fmtAvg3 },
  { key: 'strokes_gained_tee_green', dir: 'desc', accessor: (s) => s.strokes_gained_tee_green, format: fmtSG },
  { key: 'strokes_gained_putting',   dir: 'desc', accessor: (s) => s.strokes_gained_putting,   format: fmtSG },
];

type PlayerRec = {
  id: string;
  full_name: string;
  country: string | null;
  country_code: string | null;
  photo_url: string | null;
  tour_codes: string[] | null;
};

async function fetchPlayers(ids: string[]): Promise<Map<string, PlayerRec>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase
    .from('sr_players')
    .select('id, full_name, country, country_code, photo_url, tour_codes')
    .in('id', ids);
  if (error) throw error;
  return new Map(((data ?? []) as PlayerRec[]).map((p) => [p.id, p]));
}

async function fetchWorldRankingCat(): Promise<LeaderCategoryDef | null> {
  // World ranking (OWGR) is PGA-centric / male-tour - restricted to PGA only.
  const { data, error: rankErr } = await supabase
    .from('sr_world_rankings')
    .select('player_id, rank, prior_rank, tied, points, ranking_date')
    .order('ranking_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(600);
  if (rankErr) throw rankErr;
  if (!data?.length) return null;
  const latestDate = data[0].ranking_date;
  const latest = data.filter((r) => r.ranking_date === latestDate);
  const seen = new Set<string>();
  const dedup = latest.filter((r) => (seen.has(r.player_id) ? false : (seen.add(r.player_id), true)));

  const pmap = await fetchPlayers(dedup.map((r) => r.player_id));

  const eligible = dedup.filter((r) => pmap.has(r.player_id));
  const rows: LeaderRow[] = eligible
    .slice(0, 50)
    .map((r) => {
      const p = pmap.get(r.player_id)!;
      const pts = r.points != null ? Number(r.points) : 0;
      // The provider owns OWGR rank and its ties. We do not re-derive either:
      // our list position is not a world rank.
      const tied = r.tied ?? false;
      return {
        playerId: r.player_id,
        rank: r.rank,
        rankLabel: tied ? `T${r.rank}` : String(r.rank),
        tied,
        name: p.full_name,
        country: p.country ?? null,
        countryCode: p.country_code ?? null,
        photoUrl: p.photo_url ?? null,
        tourCode: p.tour_codes?.[0] ?? 'pga',
        value: pts,
        valueFormatted: pts > 0 ? formatNumberMaxFrac(pts, 2) : `#${r.rank}`,
        // Shared arithmetic - do not re-derive movement locally.
        movement: movementFrom(r.rank, r.prior_rank ?? null),
        behindFormatted: null,
      };
    });


  return {
    key: 'world_rank',
    ...LEADER_STAT_LABELS.world_rank,
    rows: applyBehind(rows, 'desc', (v) => formatNumberMaxFrac(v, 2)),
    poolSize: eligible.length,
  };
}

async function fetchPgaCategories(): Promise<LeaderCategoriesResult> {
  const seasonId = await resolvePgaSeasonId();
  if (!seasonId) {
    const world = await fetchWorldRankingCat();
    return { synced: false, categories: world ? [world] : [], year: currentSeasonYear() };
  }
  const { data: stats, error: statsErr } = await supabase
    .from('sr_player_statistics')
    .select(
      'player_id, earnings, scoring_average, wins, top_10s, driving_distance, driving_accuracy, greens_in_reg, sand_saves, putting_average, strokes_gained_tee_green, strokes_gained_putting'
    )
    .eq('season_id', seasonId)
    .limit(500);
  if (statsErr) throw statsErr;

  const pool = (stats ?? []) as PgaStatRow[];
  const playerIds = [...new Set(pool.map((s) => s.player_id).filter((v): v is string => !!v))];
  const pmap = await fetchPlayers(playerIds);

  const rankMaps: LeaderRankMaps = {};

  const categories: LeaderCategoryDef[] = PGA_CATS
    .map((cat) => {
      const rows: Array<{ pid: string; value: number; rank: number; rankLabel: string; tied: boolean }> = [];
      for (const s of pool) {
        const v = cat.accessor(s);
        if (v == null || v === 0) continue;
        if (!s.player_id || !pmap.has(s.player_id)) continue;
        rows.push({ pid: s.player_id, value: Number(v), rank: 0, rankLabel: '', tied: false });
      }
      rows.sort((a, b) => (cat.dir === 'asc' ? a.value - b.value : b.value - a.value));
      // Rank the FULL sorted pool BEFORE the top-50 slice: a player outside the
      // top 50 still needs a rank (player-v2/StatsSheet looks it up). The
      // top-50 rows then carry ranks correct by construction.
      applyCompetitionRanks(rows, cat.format);
      const map: Record<string, { rank: number; tied: boolean }> = {};
      for (const r of rows) {
        if (map[r.pid] === undefined) map[r.pid] = { rank: r.rank, tied: r.tied };
      }
      rankMaps[cat.key] = map;
      const top: LeaderRow[] = rows.slice(0, 50).map((r) => {
        const p = pmap.get(r.pid)!;
        return {
          playerId: r.pid,
          rank: r.rank,
          rankLabel: r.rankLabel,
          tied: r.tied,
          name: p.full_name,
          country: p.country ?? null,
          countryCode: p.country_code ?? null,
          photoUrl: p.photo_url ?? null,
          tourCode: p.tour_codes?.[0] ?? 'pga',
          value: r.value,
          valueFormatted: cat.format(r.value),
          movement: null,
          behindFormatted: null,
        };
      });
      if (top.length < 3) return null;
      return {
        key: cat.key,
        ...LEADER_STAT_LABELS[cat.key],
        rows: applyBehind(top, cat.dir, cat.format),
        poolSize: rows.length,
      } as LeaderCategoryDef;

    })
    .filter((c): c is LeaderCategoryDef => !!c);

  const world = await fetchWorldRankingCat();
  if (world) categories.unshift(world);

  return { synced: true, categories, year: currentSeasonYear(), rankMaps };
}

async function fetchSeasonRankingsCategories(tour: TourId): Promise<LeaderCategoriesResult> {
  const year = currentSeasonYear();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primary = await (supabase.from('tour_season_rankings' as any) as any)
    .select('player_id, manual_player_id, player_name, position, points, wins, country, tour_code')
    .eq('tour_code', tour)
    .eq('season_year', year)
    .order('position', { ascending: true })
    .limit(200);
  if (primary.error) throw primary.error;
  let rankings = (primary.data ?? []) as TourSeasonRankingRow[];
  if (!rankings.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alt = await (supabase.from('tour_season_rankings' as any) as any)
      .select('player_id, manual_player_id, player_name, position, points, wins, country, tour_code')
      .eq('tour_code', tour)
      .eq('season_year', year - 1)
      .order('position', { ascending: true })
      .limit(200);
    if (alt.error) throw alt.error;
    rankings = (alt.data ?? []) as TourSeasonRankingRow[];
  }

  const categories: LeaderCategoryDef[] = [];

  if (rankings.length) {
    const pool = rankings;
    const playerIds = [
      ...new Set(
        pool
          .map((r) => (r.player_id ?? r.manual_player_id))
          .filter((v): v is string => !!v),
      ),
    ];
    const pmap = await fetchPlayers(playerIds);

    const resolve = (r: TourSeasonRankingRow): LeaderRow => {
      const pid = (r.player_id ?? r.manual_player_id ?? '');
      const p = pid ? pmap.get(pid) : undefined;
      return {
        playerId: pid,
        rank: 0,
        rankLabel: '',
        tied: false,
        name: p?.full_name ?? r.player_name ?? 'Unknown',
        country: p?.country ?? r.country ?? null,
        countryCode: p?.country_code ?? null,
        photoUrl: p?.photo_url ?? null,
        tourCode: p?.tour_codes?.[0] ?? tour,
        value: 0,
        valueFormatted: '',
        movement: null,
        behindFormatted: null,
      };
    };

    // Points
    const fmtPoints = (v: number) => formatNumberMaxFrac(v, 2);
    const pointsPool = pool.filter((r) => r.points != null && Number(r.points) > 0);
    const pointsRows = pointsPool
      .slice()
      .sort((a, b) => Number(b.points) - Number(a.points))
      .slice(0, 50)
      .map((r) => {
        const base = resolve(r);
        base.value = Number(r.points);
        base.valueFormatted = fmtPoints(base.value);
        return base;
      });
    applyCompetitionRanks(pointsRows, fmtPoints);
    if (pointsRows.length >= 3) {
      const pointsBase = LEADER_STAT_LABELS.points;
      const brandLabelKey = POINTS_LABEL_KEY_BY_TOUR[tour];
      categories.push({
        key: 'points',
        labelKey: brandLabelKey ?? pointsBase.labelKey,
        shortKey: pointsBase.shortKey,
        unitKey: pointsBase.unitKey,
        rows: applyBehind(pointsRows, 'desc', fmtPoints),
        poolSize: pointsPool.length,
      });
    }

    // Wins
    const winsPool = pool.filter((r) => r.wins != null && Number(r.wins) > 0);
    const winsRows = winsPool
      .slice()
      .sort((a, b) => Number(b.wins) - Number(a.wins))
      .slice(0, 50)
      .map((r) => {
        const base = resolve(r);
        base.value = Number(r.wins);
        base.valueFormatted = fmtInt(base.value);
        return base;
      });
    applyCompetitionRanks(winsRows, fmtInt);
    if (winsRows.length >= 3) {
      categories.push({
        key: 'wins',
        ...LEADER_STAT_LABELS.wins,
        rows: applyBehind(winsRows, 'desc', fmtInt),
        poolSize: winsPool.length,
      });
    }

  }

  // World ranking is PGA-only per editorial policy - not appended to other tours.

  return { synced: categories.length > 0, categories, year };
}

export function useLeaderCategories(tour: TourId, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<LeaderCategoriesResult>({
    enabled,
    queryKey: ['leaders-v2', 'categories', tour, currentSeasonYear()],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      if (tour === 'pga') return fetchPgaCategories();
      // champ is not offered on the leaders page - hook coerces to pga just in case.
      if (tour === 'champ') return fetchPgaCategories();
      return fetchSeasonRankingsCategories(tour);
    },
  });
}
