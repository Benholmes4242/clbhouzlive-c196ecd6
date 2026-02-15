/**
 * LeadersTab — Immersive hero-driven leaderboard.
 * Full-bleed #1 hero matching PlayersHero, opaque runner cards,
 * pill tabs matching PlayersTourFilter, OWGR leaderboard style.
 * URL-persisted category via ?category= param.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategoryPicker } from '../leaders/LeadersCategoryPicker';
import { LeadersHero } from '../leaders/LeadersHero';
import { LeadersRunnersStrip } from '../leaders/LeadersRunnersStrip';
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
    if (isWorldCategory && worldRankings?.length) {
      return worldRankings.map((wr) => ({
        player: wr.player,
        playerId: wr.playerId,
        value: wr.avgPoints,
        rank: wr.rank,
      }));
    }

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

  // World rank overrides
  const worldFormatOverride = isWorldCategory
    ? (v: number) => v.toFixed(2)
    : undefined;
  const worldUnitOverride = isWorldCategory ? 'avg pts' : undefined;

  // Leader value for active pill preview
  const leaderValue = rankedPlayers.length > 0
    ? (worldFormatOverride ?? category.format)(rankedPlayers[0].value)
    : undefined;

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse py-4">
        <div className="rounded-2xl bg-muted/40" style={{ height: 'clamp(282px, 53vh, 422px)' }} />
        <div className="flex gap-2 overflow-hidden px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-muted/40 shrink-0" />
          ))}
        </div>
        <div className="rounded-2xl border border-border/30 overflow-hidden mx-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[60px] border-b border-border/20 bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Hero leader (#1) ───
  const leader = rankedPlayers[0] ?? null;
  const runners = rankedPlayers.slice(1, 3);
  const listPlayers = rankedPlayers.slice(3);

  return (
    <div>
      {/* Immersive hero for #1 */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {leader && (
            <LeadersHero
              key={`${category.key}-${leader.playerId}`}
              leader={leader}
              category={category}
              formatOverride={worldFormatOverride}
              unitOverride={worldUnitOverride}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Opaque runner cards for #2–#3, overlapping hero */}
      {runners.length > 0 && (
        <LeadersRunnersStrip
          runners={runners}
          category={category}
          formatOverride={worldFormatOverride}
          unitOverride={worldUnitOverride}
        />
      )}

      {/* Content area — tight spacing */}
      <div className="px-4 sm:px-6 space-y-3 pt-4 pb-6">
        {/* Category picker — no fade */}
        <LeadersCategoryPicker
          categories={LEADER_CATEGORIES}
          activeKey={category.key}
          onCategoryChange={setCategory}
          leaderValue={leaderValue}
        />

        {/* Rankings list (#4–50) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {listPlayers.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
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
                    leaderValue={rankedPlayers[0]?.value ?? item.value}
                    category={category}
                    formatOverride={worldFormatOverride}
                    unitOverride={worldUnitOverride}
                    index={idx}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {rankedPlayers.length === 0 && <LeadersEmptyState />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Season leaders • available tournament data
          </p>
        </div>
      </div>
    </div>
  );
}
