import type { TFunction } from 'i18next';
import type { PlayerTournamentResult } from '../hooks/usePlayerResults';
import type { TourPlayerStatistics } from '../hooks/useTourHubData';
import {
  LEADER_STAT_LABELS,
  POINTS_LABEL_KEY_BY_TOUR,
  type LeaderCategoryDef,
  type LeaderRankMaps,
} from '../leaders-v2/data/useLeaderCategories';
import type { TourId } from '../hooks/useOverviewData';
import { playerOrdinal } from './playerOrdinal';

export const PLAYER_SKILL_KEYS = [
  'scoring_avg',
  'drive_avg',
  'drive_acc',
  'gir_pct',
  'sand_saves_pct',
  'putt_avg',
  'strokes_gained_tee_green',
  'strokes_gained_putting',
  'birdies_per_round',
  'scrambling',
  'strokes_gained_total',
] as const;

export type PlayerSkillKey = (typeof PLAYER_SKILL_KEYS)[number];

/**
 * UNVERIFIED editorial threshold. The top-ten-percent boundary is a judgement,
 * not a measured historical figure, and has not been validated against player-page use.
 */
export const PLAYER_STRENGTH_SHARE = 0.10;
export const PLAYER_WEAKNESS_SHARE = 0.50;

export interface PlayerSeasonStat {
  key: PlayerSkillKey;
  label: string;
  valueFormatted: string;
  rank: number;
  tied: boolean;
  poolSize: number;
}

export type PlayerVerdict =
  | { key: 'player.hero.verdict.winsRanked'; values: { wins: number; top10s: number; rank: string } }
  | { key: 'player.hero.verdict.noWin'; values: { top10s: number; rank: string } }
  | { key: 'player.hero.verdict.pointsRanked'; values: { wins: number; rank: string; raceLabel: string } }
  | { key: 'player.hero.verdict.resultsOnly'; values: { events: number; best: string } };

export interface PlayerSeasonSelection {
  verdict: PlayerVerdict | null;
  headline: PlayerSeasonStat | null;
  strengths: PlayerSeasonStat[];
  weaknesses: PlayerSeasonStat[];
  moduleCount: number;
  raceProof: {
    points: { rank: number; tied: boolean; label: string };
    wins: { rank: number; tied: boolean } | null;
  } | null;
}

const valueFor = (stats: TourPlayerStatistics, key: PlayerSkillKey): number | null => {
  const values: Record<PlayerSkillKey, number | null> = {
    scoring_avg: stats.scoring_average,
    drive_avg: stats.driving_distance,
    drive_acc: stats.driving_accuracy,
    gir_pct: stats.greens_in_reg,
    sand_saves_pct: stats.sand_saves,
    putt_avg: stats.putting_average,
    strokes_gained_tee_green: stats.strokes_gained_tee_green,
    strokes_gained_putting: stats.strokes_gained,
    birdies_per_round: stats.birdies_per_round,
    scrambling: stats.scrambling,
    strokes_gained_total: stats.strokes_gained_total,
  };
  return values[key];
};

const formatValue = (key: PlayerSkillKey, value: number): string => {
  if (['drive_acc', 'gir_pct', 'sand_saves_pct', 'scrambling'].includes(key)) return `${value.toFixed(1)}%`;
  if (key === 'drive_avg') return value.toFixed(1);
  if (key === 'scoring_avg' || key === 'putt_avg') return value.toFixed(3);
  if (key.startsWith('strokes_gained_')) {
    const rounded = Number(value.toFixed(2));
    return `${rounded > 0 ? '+' : ''}${rounded.toFixed(2)}`;
  }
  return value.toFixed(2);
};

function dedupe(rows: PlayerSeasonStat[]): PlayerSeasonStat[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const keepBetter = (a: PlayerSkillKey, b: PlayerSkillKey) => {
    const first = byKey.get(a);
    const second = byKey.get(b);
    if (!first || !second) return;
    byKey.delete(first.rank <= second.rank ? b : a);
  };
  keepBetter('strokes_gained_total', 'strokes_gained_tee_green');
  keepBetter('scoring_avg', 'strokes_gained_total');
  return rows.filter((row) => byKey.has(row.key));
}

function bestFinish(results: PlayerTournamentResult[]): PlayerTournamentResult | null {
  return results
    .filter((result) => typeof result.position === 'number')
    .sort((a, b) => (a.position ?? Number.POSITIVE_INFINITY) - (b.position ?? Number.POSITIVE_INFINITY))[0] ?? null;
}

export function selectPlayerSeason(
  playerId: string,
  tour: TourId,
  stats: TourPlayerStatistics | null,
  results: PlayerTournamentResult[],
  rankMaps: LeaderRankMaps | undefined,
  categories: LeaderCategoryDef[],
  t: TFunction,
): PlayerSeasonSelection {
  const categoryMap = new Map(categories.map((category) => [category.key, category]));
  const ranked = stats
    ? PLAYER_SKILL_KEYS.flatMap((key): PlayerSeasonStat[] => {
        const value = valueFor(stats, key);
        const rank = rankMaps?.[key]?.[stats.player_id];
        const category = categoryMap.get(key);
        if (value == null || !rank || !category || category.poolSize < 2) return [];
        return [{
          key,
          label: t(LEADER_STAT_LABELS[key].labelKey),
          valueFormatted: formatValue(key, value),
          rank: rank.rank,
          tied: rank.tied,
          poolSize: category.poolSize,
        }];
      })
    : [];

  const rawStrengths = ranked
    .filter((row) => row.rank <= Math.ceil(row.poolSize * PLAYER_STRENGTH_SHARE))
    .sort((a, b) => a.rank - b.rank);
  const headline = rawStrengths.find((row) => row.key === 'scoring_avg') ?? rawStrengths[0] ?? null;
  let remaining = ranked.filter((row) => row.key !== headline?.key);
  if (headline?.key === 'scoring_avg') remaining = remaining.filter((row) => row.key !== 'strokes_gained_total');
  remaining = dedupe(remaining);
  const strengths = remaining
    .filter((row) => row.rank <= Math.ceil(row.poolSize * PLAYER_STRENGTH_SHARE))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
  const weaknesses = remaining
    .filter((row) => row.rank >= Math.ceil(row.poolSize * PLAYER_WEAKNESS_SHARE))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 2);

  const worldRank = stats?.world_rank && stats.world_rank > 0 ? stats.world_rank : null;
  const wins = stats?.wins;
  const top10s = stats?.top_10s;
  const pointsRank = rankMaps?.points?.[playerId];
  const winsRank = rankMaps?.wins?.[playerId];
  const winsCategory = categoryMap.get('wins');
  const rankedWins = winsCategory?.rows.find((row) => row.playerId === playerId)?.value;
  const resultWins = results.filter((result) => result.position === 1).length;
  const effectiveWins = Math.max(wins ?? 0, rankedWins ?? 0, resultWins);
  const raceLabelKey = POINTS_LABEL_KEY_BY_TOUR[tour] ?? LEADER_STAT_LABELS.points.labelKey;
  const raceLabel = t(raceLabelKey);
  let verdict: PlayerVerdict | null = null;
  if (wins != null && wins >= 1 && top10s != null && worldRank) {
    verdict = { key: 'player.hero.verdict.winsRanked', values: { wins, top10s, rank: String(worldRank) } };
  } else if (wins === 0 && top10s != null && top10s >= 1 && worldRank) {
    verdict = { key: 'player.hero.verdict.noWin', values: { top10s, rank: String(worldRank) } };
  } else if (!worldRank && pointsRank) {
    verdict = {
      key: effectiveWins === 1 ? 'player.hero.verdict.pointsRanked_one' : 'player.hero.verdict.pointsRanked_other',
      values: { wins: effectiveWins, rank: pointsRank.tied ? `T${pointsRank.rank}` : playerOrdinal(t, pointsRank), raceLabel },
    };
  } else {
    const best = bestFinish(results);
    if (results.length > 0 && best?.position != null) {
      verdict = {
        key: 'player.hero.verdict.resultsOnly',
        values: { events: results.length, best: `${best.position_tied ? 'T' : ''}${best.position}` },
      };
    }
  }

  return {
    verdict,
    headline,
    strengths,
    weaknesses,
    moduleCount: Number(Boolean(headline)) + Number(strengths.length > 0 || weaknesses.length > 0),
    raceProof: !worldRank && pointsRank
      ? {
          points: { ...pointsRank, label: raceLabel },
          wins: effectiveWins >= 1 && winsRank ? winsRank : null,
        }
      : null,
  };
}