/**
 * LeadersTab — Clean, data-driven leaderboard.
 * 12-category chip selector, hero card for #1, ranked list for 2-50.
 * URL-persisted category via ?category= param.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategoryPicker } from '../leaders/LeadersCategoryPicker';
import { LeadersHeroCard } from '../leaders/LeadersHeroCard';
import { LeaderRow } from '../leaders/LeaderRow';
import { LeadersEmptyState } from '../leaders/LeadersEmptyState';

export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || 'world_rank';
  const category = getCategoryByKey(categoryKey) || LEADER_CATEGORIES[0];

  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);

  const setCategory = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', key);
    params.set('tab', 'leaderboards');
    setSearchParams(params, { replace: true });
  };

  // Sort + filter players for the selected category
  const rankedPlayers = useMemo(() => {
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
          ? (a.value! - b.value!)
          : (b.value! - a.value!)
      )
      .slice(0, 50);
  }, [playerStats, category]);

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-6 py-6 animate-pulse">
        {/* Chip skeletons */}
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
        {/* Hero skeleton */}
        <div className="h-[140px] rounded-2xl bg-muted/50" />
        {/* Row skeletons */}
        <div className="rounded-2xl overflow-hidden bg-card border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[68px] border-b border-border/30 bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  const heroPlayer = rankedPlayers[0];
  const listPlayers = rankedPlayers.slice(1);

  return (
    <div className="space-y-6 py-6">
      {/* Category picker */}
      <LeadersCategoryPicker
        categories={LEADER_CATEGORIES}
        activeKey={category.key}
        onCategoryChange={setCategory}
      />

      {/* OWGR badge (world_rank only) */}
      {category.key === 'world_rank' && (
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

      {/* Hero card for #1 */}
      {heroPlayer && heroPlayer.stat.player && (
        <LeadersHeroCard
          player={{
            id: heroPlayer.stat.player_id,
            fullName: heroPlayer.stat.player.full_name,
            country: heroPlayer.stat.player.country,
            countryCode: heroPlayer.stat.player.country_code,
            photoUrl: heroPlayer.stat.player.photo_url,
            pgaTourId: heroPlayer.stat.player.pga_tour_id,
          }}
          value={heroPlayer.value!}
          category={category}
        />
      )}

      {/* Player list (#2–50) */}
      {listPlayers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {listPlayers.map((item, idx) => (
            <LeaderRow
              key={item.stat.player_id}
              rank={idx + 2}
              player={{
                id: item.stat.player_id,
                fullName: item.stat.player!.full_name,
                country: item.stat.player!.country,
                countryCode: item.stat.player!.country_code,
                photoUrl: item.stat.player!.photo_url,
                pgaTourId: item.stat.player!.pga_tour_id,
              }}
              value={item.value!}
              category={category}
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
