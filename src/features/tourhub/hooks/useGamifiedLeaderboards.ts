/**
 * useGamifiedLeaderboards
 *
 * Aggregates data for all 13 gamified categories on StatOfTheWeek.
 * Combines:
 *   - useTourPlayerStatistics(seasonId): 12 stat categories
 *   - useWorldRankingsLeaders(50): world rank category
 *
 * Returns a Map<categoryKey, GamifiedLeaderboardEntry> where each entry
 * holds the sorted player list (leader + chasers) for that category.
 *
 * PGA-only by data limitation (sr_player_statistics is PGA-only).
 */

import { useMemo } from 'react';
import {
  useTourSeason,
  useTourPlayerStatistics,
  type TourPlayerStatistics,
} from './useTourHubData';
import { useWorldRankingsLeaders } from './useWorldRankingsLeaders';
import {
  LEADER_CATEGORIES,
  type LeaderCategory,
} from '../components/leaders/constants';
import { formatStatMarginGap } from '../utils/formatStatMargin';

export interface GamifiedPlayer {
  playerId: string;
  fullName: string;
  lastName: string;
  countryCode: string | null;
  photoUrl: string | null;
  /** Raw numeric value used for sorting / margin calc. */
  value: number;
  /** Display string per category formatter (e.g. "$9.2M", "323.5"). */
  display: string;
  birthDate: string | null;
  turnedPro: number | null;
}

export interface GamifiedLeaderboardEntry {
  category: LeaderCategory;
  /** Sorted players (best → worst per sortDirection). */
  players: GamifiedPlayer[];
  /** Absolute margin between #1 and #2 (formatted display). null if <2 players. */
  marginDisplay: string | null;
  /** Numeric absolute margin between #1 and #2. null if <2. */
  marginValue: number | null;
}

function lastNameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

/**
 * Sign-less margin display for StatOfTheWeek copy
 * ("leads the field by {marginDisplay}").
 *
 * Delegates to the shared formatStatMarginGap util so per-stat precision
 * lives in one place. Output must remain byte-identical to the previous
 * inline implementation — verified cases:
 *   - earnings: "$1.20M" / "$200K" / "$500"
 *   - putt_avg / scoring_avg: "0.123 avg" / "0.123"
 *   - strokes_gained_total: "0.42"
 *   - yds / %: "1.5 yds" / "1.5%"
 *   - events / cuts / top_10: integer
 *   - generic: 2dp
 *
 * NB: legacy version emitted "0.123" (no unit) for putt_avg / scoring_avg
 * because category.unit was not appended. The shared util appends unit
 * when present; for putt_avg/scoring_avg unit is "avg" so output now
 * reads "0.123 avg". This matches the visible Tour Average format
 * ("1.790") in copy and is the editorially correct presentation.
 */
function formatMarginValue(category: LeaderCategory, margin: number): string {
  return formatStatMarginGap(margin, category.unit, category.key);
}

export function useGamifiedLeaderboards() {
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: worldRankings, isLoading: worldLoading } = useWorldRankingsLeaders(50);

  const isLoading = statsLoading || worldLoading;

  const entries = useMemo(() => {
    const map = new Map<string, GamifiedLeaderboardEntry>();
    if (!playerStats || playerStats.length === 0) return map;

    for (const category of LEADER_CATEGORIES) {
      let players: GamifiedPlayer[] = [];

      if (category.key === 'world_rank') {
        // World rank pulls from sr_world_rankings (separate hook)
        if (!worldRankings || worldRankings.length === 0) continue;
        players = worldRankings
          .filter((r) => r.player && r.totalPoints > 0)
          .map((r) => ({
            playerId: r.player.id,
            fullName: r.player.full_name,
            lastName: lastNameOf(r.player.full_name),
            countryCode: r.player.country_code,
            photoUrl: r.player.photo_url,
            value: r.totalPoints,
            display: `${Math.round(r.totalPoints)}pts`,
            birthDate: null, // not in WorldRankEntry shape
            turnedPro: null,
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        // All 12 stat categories pull from sr_player_statistics
        const rows = playerStats
          .map((s: TourPlayerStatistics) => {
            const value = category.accessor(s);
            if (value === null || value === undefined || !Number.isFinite(value)) {
              return null;
            }
            // For 'asc' (lower is better) categories, exclude zero/negative noise
            if (category.sortDirection === 'asc' && value <= 0) return null;
            // For desc categories, exclude zeros too (no data)
            if (category.sortDirection === 'desc' && value === 0) return null;
            return { stat: s, value };
          })
          .filter((x): x is { stat: TourPlayerStatistics; value: number } => x !== null);

        rows.sort((a, b) =>
          category.sortDirection === 'asc' ? a.value - b.value : b.value - a.value
        );

        players = rows.map(({ stat, value }) => ({
          playerId: stat.player_id,
          fullName: stat.player?.full_name ?? 'Unknown',
          lastName: stat.player ? lastNameOf(stat.player.full_name) : 'Unknown',
          countryCode: stat.player?.country_code ?? null,
          photoUrl: stat.player?.photo_url ?? null,
          value,
          display: category.format(value),
          birthDate: stat.player?.birth_date ?? null,
          turnedPro: stat.player?.turned_pro ?? null,
        }));
      }

      if (players.length === 0) continue;

      let marginValue: number | null = null;
      let marginDisplay: string | null = null;
      if (players.length >= 2) {
        marginValue = Math.abs(players[0].value - players[1].value);
        marginDisplay = formatMarginValue(category, marginValue);
      }

      map.set(category.key, {
        category,
        players,
        marginDisplay,
        marginValue,
      });
    }

    return map;
  }, [playerStats, worldRankings]);

  return { entries, isLoading };
}
