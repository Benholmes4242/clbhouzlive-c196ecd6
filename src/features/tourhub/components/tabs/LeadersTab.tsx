/**
 * LeadersTab — Immersive hero-driven leaderboard.
 * Full-bleed #1 hero matching PlayersHero, opaque runner cards,
 * pill tabs matching PlayersTourFilter, OWGR leaderboard style.
 * URL-persisted category via ?category= param.
 */

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategorySheet } from '../leaders/LeadersCategorySheet';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || 'world_rank';
  const category = getCategoryByKey(categoryKey) || LEADER_CATEGORIES[0];
  const queryClient = useQueryClient();

  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: worldRankings, isLoading: worldLoading } = useWorldRankingsLeaders(50);

  const isWorldCategory = category.key === 'world_rank';
  const isLoading = isWorldCategory ? worldLoading : statsLoading;

  // ─── Scroll to top on category change ───
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryKey]);

  // Scroll position handled by centralized ScrollRestoration component

  // ─── Pull-to-refresh ───
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['tour-player-statistics'] });
    await queryClient.invalidateQueries({ queryKey: ['world-rankings-leaders'] });
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 600);
  }, [queryClient]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= 50) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, handleRefresh]);

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
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div className="flex justify-center overflow-hidden" style={{ height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? 40 : 0)}px` : '0px', transition: isRefreshing ? 'none' : 'height 0.2s ease' }}>
        <motion.div
          className="flex items-center justify-center"
          animate={{ rotate: isRefreshing ? 360 : pullDistance * 3.6 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
        >
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

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

      {/* ← Tour Overview back link */}
      <div className="px-4 pt-3 pb-0">
        <button
          onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
          className="text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          ← Tour Overview
        </button>
      </div>

      {/* Content area */}
      <div className="px-4" style={{ paddingTop: 8, paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
        {/* Category selector — sticky */}
        <div
          className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-2"
          style={{
            background: 'hsl(var(--background) / 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid hsl(var(--border) / 0.15)',
          }}
        >
          <LeadersCategorySheet
            categories={LEADER_CATEGORIES}
            activeKey={category.key}
            onCategoryChange={setCategory}
          />
        </div>

        {/* Rankings list (#4–50) — 12px gap from dropdown */}
        <div style={{ marginTop: 16 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {listPlayers.length > 0 && (
                <div className="flex flex-col">
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
        </div>

        {/* Footer */}
        <div className="text-center" style={{ marginTop: 20 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
            className="text-muted-foreground/30"
          >
            Season leaders · available tournament data
          </p>
        </div>
      </div>
    </div>
  );
}