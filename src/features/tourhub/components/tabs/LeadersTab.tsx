/**
 * LeadersTab — Immersive hero-driven leaderboard.
 * Full-bleed #1 hero matching PlayersHero, opaque runner cards,
 * pill tabs matching PlayersTourFilter, OWGR leaderboard style.
 * URL-persisted category via ?category= param.
 */

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronLeft, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategorySheet } from '../leaders/LeadersCategorySheet';
import { LeadersHero } from '../leaders/LeadersHero';
import { LeadersRunnersStrip } from '../leaders/LeadersRunnersStrip';
import { LeaderRow } from '../leaders/LeaderRow';
import { LeadersEmptyState } from '../leaders/LeadersEmptyState';
import { LeadersStatContext } from '../leaders/LeadersStatContext';

interface RankedItem {
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    tour_codes?: string[] | null;
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

  // ─── Pull-to-refresh ───
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
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

  // Leader name+value for each category — shown in the sheet grid tiles
  const categoryLeaderValues = useMemo(() => {
    const map: Record<string, { name: string; value: string }> = {};

    const abbrevName = (fullName: string) => {
      const parts = fullName.trim().split(' ');
      if (parts.length < 2) return fullName;
      return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
    };

    if (playerStats?.length) {
      for (const cat of LEADER_CATEGORIES) {
        if (cat.key === 'world_rank') continue;
        const sorted = playerStats
          .map((s: any) => ({ player: s.player, value: cat.accessor(s.statistics ?? s) }))
          .filter((x: any) => x.value !== null && x.value !== undefined && x.player)
          .sort((a: any, b: any) =>
            cat.sortDirection === 'asc' ? a.value - b.value : b.value - a.value
          );
        if (sorted.length > 0) {
          const top = sorted[0];
          map[cat.key] = {
            name: abbrevName(top.player.full_name),
            value: cat.format(top.value),
          };
        }
      }
    }

    if (worldRankings?.length) {
      const top = worldRankings[0];
      map['world_rank'] = {
        name: abbrevName((top as any).player?.full_name ?? (top as any).playerName ?? ''),
        value: '#1',
      };
    }

    return map;
  }, [playerStats, worldRankings]);

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="rounded-2xl w-full" style={{ height: '45dvh' }} />
        {/* Runner card skeletons */}
        <div className="flex gap-2 px-4" style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <Skeleton className="flex-1 h-[60px] rounded-2xl" />
          <Skeleton className="flex-1 h-[60px] rounded-2xl" />
        </div>
        <Skeleton className="mx-4 mt-3 h-[48px] rounded-2xl" />
        <Skeleton className="mx-4 mt-3 h-[72px] rounded-xl" />
        <div className="rounded-2xl border border-border/30 overflow-hidden mx-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-none border-b border-border/20" />
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

      {/* ══════════════════════════════════════════════
          STICKY HEADER — back link · category pill · stat context
          ══════════════════════════════════════════════ */}
      <div
        className="-mx-4 sticky top-0 z-20"
        style={{
          background: 'hsl(var(--background) / 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsl(var(--border) / 0.10)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          marginTop: '12px',
        }}
      >
        {/* Control row: ← Tour Overview | [spacer] | category pill */}
        <div className="flex items-center gap-2 px-4 pt-2.5">
          {/* Back link */}
          <Link
            to="/tourhub?tab=overview"
            replace
            className="flex items-center gap-0.5 text-[12px] font-medium active:opacity-50 transition-opacity shrink-0"
            style={{ color: 'hsl(var(--muted-foreground) / 0.70)' }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </Link>

          <div className="flex-1" />

          {/* Category selector pill — opens LeadersCategorySheet */}
          <button
            onClick={() => setCategorySheetOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] shrink-0',
              'bg-card border border-border/50 shadow-sm',
              'transition-all duration-150 active:scale-[0.97]'
            )}
          >
            <category.icon
              className="w-[13px] h-[13px] shrink-0"
              style={{
                color: category.key !== 'world_rank'
                  ? (category as any).accentColor ?? 'hsl(var(--muted-foreground))'
                  : 'hsl(var(--muted-foreground))',
              }}
            />
            <span className="text-[12px] font-bold text-foreground">
              {category.shortLabel}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Leaderboard
            </span>
            {leaderValue && (
              <span
                className="text-[10px] font-bold"
                style={{ color: 'hsl(var(--muted-foreground) / 0.40)' }}
              >
                · {leaderValue}
              </span>
            )}
            <ChevronDown className="w-[11px] h-[11px] text-muted-foreground/60" strokeWidth={2.5} />
          </button>
        </div>

        {/* Stat context — tight 2-line block, always visible in header */}
        <div className="px-4 pt-2 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`ctx-${category.key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LeadersStatContext
                category={category}
                leaderValue={leaderValue}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4" style={{ paddingTop: 0, paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Rankings list (#4–50) */}
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
                <div>
                  {listPlayers.map((item, idx) => (
                    <LeaderRow
                      key={item.playerId}
                      rank={item.rank}
                      overrideRank={isWorldCategory ? item.rank : undefined}
                      player={{
                        id: item.playerId,
                        fullName: item.player.full_name,
                        country: item.player.country,
                        countryCode: item.player.country_code,
                        photoUrl: item.player.photo_url,
                        pgaTourId: item.player.pga_tour_id,
                        tourCodes: (item.player as any).tour_codes ?? null,
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

      {/* Category sheet — driven by categorySheetOpen state */}
      <LeadersCategorySheet
        categories={LEADER_CATEGORIES}
        activeKey={category.key}
        onCategoryChange={setCategory}
        leaderValue={leaderValue}
        categoryLeaderValues={categoryLeaderValues}
        externalOpen={categorySheetOpen}
        onExternalClose={() => setCategorySheetOpen(false)}
        hideTrigger
      />
    </div>
  );
}
