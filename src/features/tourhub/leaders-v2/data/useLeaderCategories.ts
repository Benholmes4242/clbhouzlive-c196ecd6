/**
 * useLeaderCategories — "The Boards" data source of truth (per-tour).
 *
 * Per-tour category reality (fields ARE real; nothing is faked):
 *
 *   pga (sr_player_statistics) — 11 categories:
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
 *   all tours (sr_world_rankings) — PGA-only per editorial policy:
 *     world_rank (asc rank -> desc points, latest ranking_date)  OWGR PTS
 *
 * ONE fetch per data source per tour — categories share the pool. The
 * FullListSheet reads the same top-50 slice; the board slices to 3.
 *
 * i18n — LEADER_STAT_LABELS is the canonical registry of category KEY ->
 * { labelKey, shortKey, unitKey } consumed by StatBoard, FullListSheet, and
 * (Wave 3e.iv Turn C.3) player-v2/StatsSheet. One source of truth per stat.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourId } from '../../hooks/useOverviewData';
import { formatCurrencyUsd, formatNumber, formatNumberMaxFrac } from '@/i18n/format';

export interface LeaderRow {
  playerId: string;
  rank: number;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
  value: number;
  valueFormatted: string;
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
  earnings:                 { labelKey: 'leaders.stat.earnings.label',                 shortKey: 'leaders.stat.earnings.short',                 unitKey: 'leaders.stat.earnings.unit' },
  scoring_avg:              { labelKey: 'leaders.stat.scoring_avg.label',              shortKey: 'leaders.stat.scoring_avg.short',              unitKey: 'leaders.stat.scoring_avg.unit' },
  wins:                     { labelKey: 'leaders.stat.wins.label',                     shortKey: 'leaders.stat.wins.short',                     unitKey: 'leaders.stat.wins.unit' },
  top_10:                   { labelKey: 'leaders.stat.top_10.label',                   shortKey: 'leaders.stat.top_10.short',                   unitKey: 'leaders.stat.top_10.unit' },
  drive_avg:                { labelKey: 'leaders.stat.drive_avg.label',                shortKey: 'leaders.stat.drive_avg.short',                unitKey: 'leaders.stat.drive_avg.unit' },
  drive_acc:                { labelKey: 'leaders.stat.drive_acc.label',                shortKey: 'leaders.stat.drive_acc.short',                unitKey: 'leaders.stat.drive_acc.unit' },
  gir_pct:                  { labelKey: 'leaders.stat.gir_pct.label',                  shortKey: 'leaders.stat.gir_pct.short',                  unitKey: 'leaders.stat.gir_pct.unit' },
  sand_saves_pct:           { labelKey: 'leaders.stat.sand_saves_pct.label',           shortKey: 'leaders.stat.sand_saves_pct.short',           unitKey: 'leaders.stat.sand_saves_pct.unit' },
  putt_avg:                 { labelKey: 'leaders.stat.putt_avg.label',                 shortKey: 'leaders.stat.putt_avg.short',                 unitKey: 'leaders.stat.putt_avg.unit' },
  strokes_gained_tee_green: { labelKey: 'leaders.stat.strokes_gained_tee_green.label', shortKey: 'leaders.stat.strokes_gained_tee_green.short', unitKey: 'leaders.stat.strokes_gained_tee_green.unit' },
  strokes_gained_putting:   { labelKey: 'leaders.stat.strokes_gained_putting.label',   shortKey: 'leaders.stat.strokes_gained_putting.short',   unitKey: 'leaders.stat.strokes_gained_putting.unit' },
  world_rank:               { labelKey: 'leaders.stat.world_rank.label',               shortKey: 'leaders.stat.world_rank.short',               unitKey: 'leaders.stat.world_rank.unit' },
  points:                   { labelKey: 'leaders.stat.points.label',                   shortKey: 'leaders.stat.points.short',                   unitKey: 'leaders.stat.points.unit' },
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
}

export interface LeaderCategoriesResult {
  synced: boolean;
  categories: LeaderCategoryDef[];
  year: number;
}


// ── formatting helpers ────────────────────────────────────────────────
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
    const { data } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('tour_name', 'pga')
      .eq('year', y)
      .limit(10);
    for (const row of data ?? []) {
      const { count } = await supabase
        .from('sr_player_statistics')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', row.id);
      if ((count ?? 0) > 0) return row.id;
    }
  }
  return null;
}

// PGA category definitions (accessor + sort + format). Labels are resolved via
// LEADER_STAT_LABELS[key] at render — no display strings live here.
interface PgaCatSpec {
  key: string;
  dir: 'asc' | 'desc';
  accessor: (s: any) => number | null;
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
  const { data } = await supabase
    .from('sr_players')
    .select('id, full_name, country, country_code, photo_url, tour_codes')
    .in('id', ids);
  return new Map(((data ?? []) as PlayerRec[]).map((p) => [p.id, p]));
}

async function fetchWorldRankingCat(): Promise<LeaderCategoryDef | null> {
  // World ranking (OWGR) is PGA-centric / male-tour — restricted to PGA only.
  const { data } = await supabase
    .from('sr_world_rankings')
    .select('player_id, rank, points, ranking_date')
    .order('ranking_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(600);
  if (!data?.length) return null;
  const latestDate = data[0].ranking_date;
  const latest = data.filter((r) => r.ranking_date === latestDate);
  const seen = new Set<string>();
  const dedup = latest.filter((r) => (seen.has(r.player_id) ? false : (seen.add(r.player_id), true)));

  const pmap = await fetchPlayers(dedup.map((r) => r.player_id));

  const rows: LeaderRow[] = dedup
    .filter((r) => pmap.has(r.player_id))
    .slice(0, 50)
    .map((r, i) => {
      const p = pmap.get(r.player_id)!;
      const pts = r.points != null ? Number(r.points) : 0;
      return {
        playerId: r.player_id,
        rank: i + 1,
        name: p.full_name,
        country: p.country ?? null,
        countryCode: p.country_code ?? null,
        photoUrl: p.photo_url ?? null,
        tourCode: p.tour_codes?.[0] ?? 'pga',
        value: pts,
        valueFormatted: pts > 0 ? formatNumberMaxFrac(pts, 2) : `#${i + 1}`,
      };
    });

  return {
    key: 'world_rank',
    ...LEADER_STAT_LABELS.world_rank,
    rows,
  };
}

async function fetchPgaCategories(): Promise<LeaderCategoriesResult> {
  const seasonId = await resolvePgaSeasonId();
  if (!seasonId) {
    const world = await fetchWorldRankingCat();
    return { synced: false, categories: world ? [world] : [], year: currentSeasonYear() };
  }
  const { data: stats } = await supabase
    .from('sr_player_statistics')
    .select(
      'player_id, earnings, scoring_average, wins, top_10s, driving_distance, driving_accuracy, greens_in_reg, sand_saves, putting_average, strokes_gained_tee_green, strokes_gained_putting'
    )
    .eq('season_id', seasonId)
    .limit(500);

  const pool = stats ?? [];
  const playerIds = [...new Set(pool.map((s: any) => s.player_id).filter(Boolean))];
  const pmap = await fetchPlayers(playerIds);

  const categories: LeaderCategoryDef[] = PGA_CATS
    .map((cat) => {
      const rows: Array<{ pid: string; value: number }> = [];
      for (const s of pool as any[]) {
        const v = cat.accessor(s);
        if (v == null || v === 0) continue;
        if (!s.player_id || !pmap.has(s.player_id)) continue;
        rows.push({ pid: s.player_id, value: Number(v) });
      }
      rows.sort((a, b) => (cat.dir === 'asc' ? a.value - b.value : b.value - a.value));
      const top = rows.slice(0, 50).map((r, i) => {
        const p = pmap.get(r.pid)!;
        return {
          playerId: r.pid,
          rank: i + 1,
          name: p.full_name,
          country: p.country ?? null,
          countryCode: p.country_code ?? null,
          photoUrl: p.photo_url ?? null,
          tourCode: p.tour_codes?.[0] ?? 'pga',
          value: r.value,
          valueFormatted: cat.format(r.value),
        } as LeaderRow;
      });
      if (top.length < 3) return null;
      return {
        key: cat.key,
        label: cat.label,
        short: cat.short,
        unit: cat.unit,
        rows: top,
      } as LeaderCategoryDef;
    })
    .filter((c): c is LeaderCategoryDef => !!c);

  const world = await fetchWorldRankingCat();
  if (world) categories.unshift(world);

  return { synced: true, categories, year: currentSeasonYear() };
}

async function fetchSeasonRankingsCategories(tour: TourId): Promise<LeaderCategoriesResult> {
  const year = currentSeasonYear();
  let { data: rankings } = await supabase
    .from('tour_season_rankings' as any)
    .select('player_id, manual_player_id, player_name, position, points, wins, country, tour_code')
    .eq('tour_code', tour)
    .eq('season_year', year)
    .order('position', { ascending: true })
    .limit(200);
  if (!rankings?.length) {
    const alt = await supabase
      .from('tour_season_rankings' as any)
      .select('player_id, manual_player_id, player_name, position, points, wins, country, tour_code')
      .eq('tour_code', tour)
      .eq('season_year', year - 1)
      .order('position', { ascending: true })
      .limit(200);
    rankings = alt.data ?? [];
  }

  const categories: LeaderCategoryDef[] = [];

  if (rankings?.length) {
    const pool = rankings as any[];
    const playerIds = [
      ...new Set(
        pool
          .map((r) => (r.player_id ?? r.manual_player_id) as string | null)
          .filter((v): v is string => !!v),
      ),
    ];
    const pmap = await fetchPlayers(playerIds);

    const resolve = (r: any): LeaderRow | null => {
      const pid = (r.player_id ?? r.manual_player_id ?? '') as string;
      const p = pid ? pmap.get(pid) : undefined;
      return {
        playerId: pid,
        rank: 0,
        name: p?.full_name ?? r.player_name ?? 'Unknown',
        country: p?.country ?? r.country ?? null,
        countryCode: p?.country_code ?? null,
        photoUrl: p?.photo_url ?? null,
        tourCode: p?.tour_codes?.[0] ?? tour,
        value: 0,
        valueFormatted: '',
      };
    };

    // Points
    const pointsRows = pool
      .filter((r) => r.points != null && Number(r.points) > 0)
      .sort((a, b) => Number(b.points) - Number(a.points))
      .slice(0, 50)
      .map((r, i) => {
        const base = resolve(r)!;
        base.rank = i + 1;
        base.value = Number(r.points);
        base.valueFormatted = formatNumberMaxFrac(base.value, 2);
        return base;
      });
    if (pointsRows.length >= 3) {
      const label = tour === 'euro' ? 'Race to Dubai'
        : tour === 'lpga' ? 'CME Points'
        : tour === 'liv' ? 'LIV Points'
        : 'Season Points';
      categories.push({ key: 'points', label, short: 'POINTS', unit: 'PTS', rows: pointsRows });
    }

    // Wins
    const winsRows = pool
      .filter((r) => r.wins != null && Number(r.wins) > 0)
      .sort((a, b) => Number(b.wins) - Number(a.wins))
      .slice(0, 50)
      .map((r, i) => {
        const base = resolve(r)!;
        base.rank = i + 1;
        base.value = Number(r.wins);
        base.valueFormatted = fmtInt(base.value);
        return base;
      });
    if (winsRows.length >= 3) {
      categories.push({ key: 'wins', label: 'Wins', short: 'WINS', unit: 'WINS', rows: winsRows });
    }
  }

  // World ranking is PGA-only per editorial policy — not appended to other tours.

  return { synced: categories.length > 0, categories, year };
}

export function useLeaderCategories(tour: TourId) {
  return useQuery<LeaderCategoriesResult>({
    queryKey: ['leaders-v2', 'categories', tour, currentSeasonYear()],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      if (tour === 'pga') return fetchPgaCategories();
      // champ is not offered on the leaders page — hook coerces to pga just in case.
      if (tour === 'champ') return fetchPgaCategories();
      return fetchSeasonRankingsCategories(tour);
    },
  });
}
