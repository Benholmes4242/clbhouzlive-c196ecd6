/**
 * LeadersTab — Dispatch editorial layout for Stat Watch.
 * Slate masthead, underline group tabs, amber chip rail, white surface table.
 * Rows reuse the Players-page PlayerCardV2 primitive for visual consistency
 * across Tour Hub destinations.
 */

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronLeft, ChevronDown, Search, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { useElitePlayers } from '../../hooks/useElitePlayers';
import { useChampionStreak } from '../../hooks/useChampionStreak';
import { useChampionRecentForm } from '../../hooks/useChampionRecentForm';
import { useRecentPlayerResults } from '../../hooks/useRecentPlayerResults';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategorySheet } from '../leaders/LeadersCategorySheet';
import { LeadersMasthead, type MastheadPill } from '../leaders/LeadersMasthead';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { LeadersEmptyState } from '../leaders/LeadersEmptyState';

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

// Group keys for tabs and chips
const GROUP_KEYS: Record<string, string[]> = {
  'General': ['world_rank', 'events_played', 'cuts_made', 'top_10', 'earnings', 'strokes_gained_total', 'scoring_avg'],
  'Ball Striking': ['drive_avg', 'drive_acc', 'gir_pct'],
  'Short Game': ['putt_avg', 'sand_saves_pct', 'scrambling_pct'],
};

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

  // ─── Inline search (Phase 1 fix.1.7) ───
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);

  // Reset search on category change — less surprise across chips.
  useEffect(() => {
    setSearch('');
    setSearchExpanded(false);
  }, [categoryKey]);

  // Cross-reference Players-page elite map for movement deltas (World Rank only).
  const { data: elitePlayers } = useElitePlayers(200);
  const eliteRankMap = useMemo(() => {
    const map = new Map<string, number | null>();
    elitePlayers?.forEach((ep) => map.set(ep.playerId, ep.rankChange));
    return map;
  }, [elitePlayers]);

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
        value: wr.totalPoints,
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
    ? (v: number) => `${Math.round(v)}pts`
    : undefined;
  const worldUnitOverride = isWorldCategory ? '' : undefined;

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
      <div style={{ background: '#F8FAFC' }}>
        {/* Masthead skeleton */}
        <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 14px' }}>
          <Skeleton className="h-3 w-48 mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <Skeleton className="h-6 w-40 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <Skeleton className="h-24 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            {[1, 2].map(i => <Skeleton key={i} className="h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
          </div>
        </div>
        {/* Sticky header skeleton */}
        <div style={{ padding: '12px 16px' }}>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        {/* Row skeletons */}
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Hero leader (#1) + runner for margin ───
  const leader = rankedPlayers[0] ?? null;
  const runnerUp = rankedPlayers[1] ?? null;

  // ─── Search-filtered list (hero #1 stays in list) ───
  const filteredPlayers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (q.length < 2) return rankedPlayers;
    return rankedPlayers.filter((item) => {
      const name = item.player.full_name?.toLowerCase() ?? '';
      const country = item.player.country?.toLowerCase() ?? '';
      return name.includes(q) || country.includes(q);
    });
  }, [rankedPlayers, debouncedSearch]);
  const listPlayers = filteredPlayers;

  // ─── Recent results pills — batch fetch for all rendered rows ───
  const sortedPlayerIds = useMemo(
    () => rankedPlayers.map((p) => p.playerId),
    [rankedPlayers],
  );
  const { data: recentResultsMap } = useRecentPlayerResults(sortedPlayerIds);

  // ─── Champion streak + recent form for hero pills ───
  const { data: streakWeeks } = useChampionStreak(
    isWorldCategory ? leader?.playerId : null,
  );
  const { data: recentForm } = useChampionRecentForm(leader?.playerId, 8);

  // ─── Build hero narrative pills (Phase 1: Margin + Streak + Recent Form) ───
  // vs Avg pill is Phase 2; lower-is-better Margin is Phase 2 (omits in Phase 1).
  const heroPills = useMemo<MastheadPill[]>(() => {
    const out: MastheadPill[] = [];
    if (!leader) return out;

    // Margin pill — Phase 1 ships higher-is-better only.
    if (runnerUp && category.higherIsBetter) {
      const gap = leader.value - runnerUp.value;
      if (gap > 0) {
        // Format gap using category's own formatter for consistency, drop unit
        // when format() already includes it (e.g. earnings "$1.2M").
        const fmtGap = category.format(gap);
        const unit = category.unit && !fmtGap.includes(category.unit) ? ` ${category.unit}` : '';
        out.push({
          variant: 'highlight',
          label: 'Margin:',
          value: `+${fmtGap}${unit}`,
        });
      } else if (gap === 0) {
        out.push({
          variant: 'normal',
          label: 'Margin:',
          value: 'tied with #2',
        });
      }
    }

    // Streak pill — World Rankings only.
    if (category.showStreak && streakWeeks && streakWeeks >= 2) {
      out.push({
        variant: 'highlight',
        icon: 'flame',
        value: `${streakWeeks}-week leader`,
      });
    }

    // Recent Form pill — when leader has played ≥3 events in last 8 weeks.
    if (recentForm && recentForm.starts >= 3) {
      let value: string | null = null;
      if (recentForm.wins > 0) {
        value = `${recentForm.starts} starts · ${recentForm.wins} ${recentForm.wins === 1 ? 'win' : 'wins'}`;
      } else if (recentForm.top10s > 0) {
        value = `${recentForm.starts} starts · ${recentForm.top10s} top-10${recentForm.top10s === 1 ? '' : 's'}`;
      }
      if (value) {
        out.push({
          variant: 'normal',
          icon: 'trophy',
          value,
        });
      }
    }

    return out;
  }, [leader, runnerUp, category, streakWeeks, recentForm]);

  // Active group detection
  const activeGroup = Object.entries(GROUP_KEYS).find(([, keys]) => keys.includes(categoryKey))?.[0] ?? 'General';
  const activeGroupKeys = GROUP_KEYS[activeGroup] ?? [];
  const activeGroupCats = LEADER_CATEGORIES.filter(c => activeGroupKeys.includes(c.key));

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

      {/* Unified editorial masthead */}
      <LeadersMasthead
        leader={leader}
        runners={runners}
        category={category}
        formatOverride={worldFormatOverride}
        unitOverride={worldUnitOverride}
        leaderValue={leaderValue}
      />

      {/* Sticky header — back link + category pill + group tabs + category chips */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        }}
      >
        {/* Back link */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 0' }}>
          <Link
            to="/tourhub?tab=overview"
            replace
            className="flex items-center gap-0.5 active:opacity-50 transition-opacity shrink-0"
            style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', textDecoration: 'none', marginLeft: '-4px' }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </Link>
        </div>

        {/* Group underline tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(15,23,42,0.07)', marginTop: '6px' }}>
          {Object.keys(GROUP_KEYS).map((groupLabel) => {
            const isActive = groupLabel === activeGroup;
            const firstKey = GROUP_KEYS[groupLabel]?.[0];
            return (
              <button
                key={groupLabel}
                onClick={() => { if (firstKey) setCategory(firstKey); }}
                className="active:opacity-70 transition-opacity"
                style={{
                  flex: 1, padding: '10px 4px 9px',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#0F172A' : '#94A3B8',
                  background: 'transparent', border: 'none',
                  borderBottom: isActive ? '2px solid #F7931E' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap' as const,
                  textAlign: 'center' as const,
                }}
              >
                {groupLabel}
              </button>
            );
          })}
        </div>

        {/* Category chips — within the active group */}
        <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {activeGroupCats.map(cat => {
            const on = cat.key === categoryKey;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className="flex-shrink-0 active:scale-[0.97] transition-transform"
                style={{
                  padding: '4px 10px', borderRadius: '6px',
                  fontSize: '10px', fontWeight: on ? 800 : 600,
                  color: on ? '#ffffff' : '#94A3B8',
                  background: on ? '#0F172A' : 'transparent',
                  border: on ? 'none' : '0.5px solid rgba(15,23,42,0.12)',
                  cursor: 'pointer', whiteSpace: 'nowrap' as const,
                  transition: 'all 0.15s',
                }}
              >
                {(cat as any).emoji} {cat.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Rankings list — white surface */}
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 16px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ width: '44px', fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>RK</span>
            <span style={{ flex: 1, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PLAYER</span>
            <span style={{ width: '72px', textAlign: 'right' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0, paddingRight: '14px' }}>
              {category.shortLabel.toUpperCase()}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={category.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {listPlayers.length > 0 ? (
                <>
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
                  {/* Footer */}
                  <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                      SEASON LEADERS · AVAILABLE TOURNAMENT DATA
                    </span>
                  </div>
                </>
              ) : (
                <LeadersEmptyState />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Category sheet */}
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
