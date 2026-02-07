/**
 * LeadersTab — Clean, data-driven leaderboard.
 * Podium strip for top 3, ranked list for 4-50.
 * URL-persisted category via ?category= param.
 * World Ranking category uses sr_world_rankings directly.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategoryPicker } from '../leaders/LeadersCategoryPicker';
import { LeadersPodiumStrip, type PodiumEntry } from '../leaders/LeadersPodiumStrip';
import { LeaderRow } from '../leaders/LeaderRow';
import { LeadersEmptyState } from '../leaders/LeadersEmptyState';

interface RankedItem {
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
  };
  playerId: string;
  value: number;
  rank: number;
}

export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || 'world_rank';
  const category = getCategoryByKey(categoryKey) || LEADER_CATEGORIES[0];

  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: worldRankings, isLoading: worldLoading } = useWorldRankingsLeaders(50);

  const isWorldCategory = category.key === 'world_rank';
  const isLoading = isWorldCategory ? worldLoading : statsLoading;

  const setCategory = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', key);
    params.set('tab', 'leaderboards');
    setSearchParams(params, { replace: true });
  };

  // ─── Build ranked items ───
  const rankedPlayers = useMemo((): RankedItem[] => {
    // World Ranking: use sr_world_rankings directly
    if (isWorldCategory && worldRankings?.length) {
      return worldRankings.map((wr) => ({
        player: wr.player,
        playerId: wr.playerId,
        value: wr.avgPoints,
        rank: wr.rank,
      }));
    }

    // All other categories: use sr_player_statistics
    if (!playerStats?.length) return [];

    return playerStats
      .map((s) => {
        const value = category.accessor(s);
        return { stat: s, value };
      })
      .filter(
        (item) =>
          item.value !== null &&
          item.value !== undefined &&
          item.value !== 0 &&
          item.stat.player
      )
      .sort((a, b) =>
        category.sortDirection === 'asc'
          ? a.value! - b.value!
          : b.value! - a.value!
      )
      .slice(0, 50)
      .map((item, idx) => ({
        player: item.stat.player!,
        playerId: item.stat.player_id,
        value: item.value!,
        rank: idx + 1,
      }));
  }, [isWorldCategory, worldRankings, playerStats, category]);

  // World rank overrides: show avg points instead of rank
  const worldFormatOverride = isWorldCategory
    ? (v: number) => v.toFixed(2)
    : undefined;
  const worldUnitOverride = isWorldCategory ? 'avg pts' : undefined;

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-6 py-6 animate-pulse">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-20 rounded-lg bg-muted/50" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-9 w-20 rounded-lg bg-muted/50" />
            ))}
          </div>
        </div>
        {/* Podium skeleton */}
        <div className="flex gap-3">
          <div className="flex-[1.6] h-[100px] rounded-xl bg-muted/50" />
          <div className="flex-1 h-[100px] rounded-xl bg-muted/50" />
          <div className="flex-1 h-[100px] rounded-xl bg-muted/50" />
        </div>
        {/* Row skeletons */}
        <div className="rounded-2xl overflow-hidden bg-card border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[68px] border-b border-border/30 bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Podium entries (top 3) ───
  const podiumEntries: PodiumEntry[] = rankedPlayers.slice(0, 3).map((item) => ({
    player: {
      id: item.playerId,
      fullName: item.player.full_name,
      country: item.player.country,
      countryCode: item.player.country_code,
      photoUrl: item.player.photo_url,
      pgaTourId: item.player.pga_tour_id,
    },
    value: item.value,
    rank: item.rank,
    overrideRank: isWorldCategory ? item.rank : undefined,
  }));

  // ─── List entries (#4+) ───
  const listPlayers = rankedPlayers.slice(3);

  return (
    <div className="space-y-6 py-6">
      {/* Category picker */}
      <LeadersCategoryPicker
        categories={LEADER_CATEGORIES}
        activeKey={category.key}
        onCategoryChange={setCategory}
      />

      {/* OWGR badge (world_rank only) */}
      {isWorldCategory && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              Official World Golf Ranking
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Updated weekly</span>
        </div>
      )}

      {/* Podium strip — top 3 */}
      {podiumEntries.length > 0 && (
        <LeadersPodiumStrip
          entries={podiumEntries}
          category={category}
          formatOverride={worldFormatOverride}
          unitOverride={worldUnitOverride}
        />
      )}

      {/* Player list (#4–50) */}
      {listPlayers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {listPlayers.map((item, idx) => (
            <LeaderRow
              key={item.playerId}
              rank={idx + 4}
              overrideRank={isWorldCategory ? item.rank : undefined}
              player={{
                id: item.playerId,
                fullName: item.player.full_name,
                country: item.player.country,
                countryCode: item.player.country_code,
                photoUrl: item.player.photo_url,
                pgaTourId: item.player.pga_tour_id,
              }}
              value={item.value}
              category={category}
              formatOverride={worldFormatOverride}
              unitOverride={worldUnitOverride}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {rankedPlayers.length === 0 && <LeadersEmptyState />}

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Season leaders computed from available tournament data
        </p>
      </div>
    </div>
  );
}
