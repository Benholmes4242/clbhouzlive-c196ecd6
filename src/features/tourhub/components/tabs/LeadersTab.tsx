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
import { formatStatMargin, formatStatMarginGap } from '../../utils/formatStatMargin';

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

  // ─── Hero leader (#1) + runner for margin ───
  // Lifted above the loading early return so hook order stays stable across
  // renders (was: React error #310 when isLoading flipped). All downstream
  // react-query hooks have `enabled` guards (verified in audit Q3) so they
  // sit idle until rankedPlayers materialises.
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

  // ─── Build hero narrative pills (Phase 2: Margin → Streak → vs Avg → Recent Form) ───
  // - Margin uses the shared formatStatMargin util — handles higher-better,
  //   lower-better (with U+2212), and tied uniformly. Phase 2 unlocks Margin
  //   pills for putt_avg/scoring_avg for the first time.
  // - vs Avg renders only when category.tourAverageNumeric !== null. Always
  //   slate normal variant (editorial context, not a dominance moment).
  const heroPills = useMemo<MastheadPill[]>(() => {
    const out: MastheadPill[] = [];
    if (!leader) return out;

    // 1. Margin pill — stat-aware, handles all three branches.
    if (runnerUp) {
      const margin = formatStatMargin({
        leaderValue: leader.value,
        runnerValue: runnerUp.value,
        unit: category.unit,
        higherIsBetter: category.higherIsBetter,
        categoryKey: category.key,
      });
      out.push({
        variant: margin.variant,
        label: 'Margin:',
        value: margin.copy,
      });
    }

    // 2. Streak pill — World Rankings only.
    if (category.showStreak && streakWeeks && streakWeeks >= 2) {
      out.push({
        variant: 'highlight',
        icon: 'flame',
        value: `${streakWeeks}-week leader`,
      });
    }

    // 3. vs Avg pill — render whenever a numeric tour average exists.
    //    Always slate normal variant regardless of direction. Edge case
    //    "at avg" prevents "+0"/"−0" from rendering as a fake margin.
    if (category.tourAverageNumeric !== null) {
      const tourAvg = category.tourAverageNumeric;
      const diff = leader.value - tourAvg;
      let value: string;
      if (diff === 0) {
        value = 'at avg';
      } else {
        const absDiff = Math.abs(diff);
        const formatted = formatStatMarginGap(absDiff, category.unit, category.key);
        // Higher-better: positive diff = above avg (good) → '+'.
        //                negative diff = below avg (rare/bad) → U+2212.
        // Lower-better:  negative diff = below avg (good)    → U+2212.
        //                positive diff = above avg (rare/bad) → '+'.
        const sign = diff > 0 ? '+' : '\u2212';
        value = `${sign}${formatted}`;
      }
      out.push({
        variant: 'normal',
        label: 'vs avg:',
        value,
      });
    }

    // 4. Recent Form pill — when leader has played ≥3 events in last 8 weeks.
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
        category={category}
        formatOverride={worldFormatOverride}
        unitOverride={worldUnitOverride}
        leaderValue={leaderValue}
        pills={heroPills}
      />

      {/* Sticky header — back link + group tabs + chip rail + count/search */}
      <div
        className="sticky top-0 z-20"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        }}
      >
        {/* Control row — back link + search button */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 0', gap: 6 }}>
          <Link
            to="/tourhub?tab=overview"
            replace
            className="flex items-center gap-0.5 active:opacity-50 transition-opacity shrink-0"
            style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', textDecoration: 'none', marginLeft: '-4px' }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </Link>

          <div style={{ flex: 1 }} />

          {!searchExpanded && (
            <button
              onClick={() => setSearchExpanded(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8,
                background: 'rgba(15,23,42,0.04)',
                border: 'none', cursor: 'pointer',
              }}
              aria-label="Search players"
            >
              <Search className="w-3 h-3" style={{ color: '#0F172A' }} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Search</span>
            </button>
          )}
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

        {/* Category chips — amber language family (Phase 1 fix.1.6) */}
        <div style={{ display: 'flex', gap: '8px', padding: '14px 18px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {activeGroupCats.map(cat => {
            const on = cat.key === categoryKey;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className="flex-shrink-0 active:scale-[0.97]"
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: on ? 800 : 700,
                  color: on ? '#c97a10' : '#334155',
                  background: on ? 'rgba(247,147,30,0.08)' : '#ffffff',
                  border: `1px solid ${on ? 'rgba(247,147,30,0.30)' : '#E2E8F0'}`,
                  cursor: 'pointer', whiteSpace: 'nowrap' as const,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {(cat as any).emoji} {cat.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Count bar OR search input — mutually exclusive (Phase 1 fix.1.7) */}
        {!searchExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 8px', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
              {listPlayers.length.toLocaleString()} {listPlayers.length === 1 ? 'player' : 'players'}
              <span style={{ color: '#CBD5E1' }}> · ranked by </span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{category.shortLabel}</span>
            </span>
          </div>
        ) : (
          <div style={{ padding: '6px 16px 8px' }}>
            <div style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4" style={{ color: '#F7931E' }} strokeWidth={2.5} />
              <input
                type="text"
                autoFocus
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-9 rounded-lg text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.09)' }}
              />
              <button
                onClick={() => { setSearch(''); setSearchExpanded(false); }}
                aria-label="Close search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full active:scale-90"
                style={{ background: 'rgba(15,23,42,0.06)' }}
              >
                <X className="w-3 h-3" style={{ color: '#0F172A' }} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Rankings list — white surface (column header removed Phase 1 fix.1.3) */}
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
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
                  {listPlayers.map((item, idx) => {
                    const fmt = worldFormatOverride ?? category.format;
                    const unit = worldUnitOverride ?? category.unit;
                    // Movement gated to World Rankings only — only sr_world_rankings has
                    // prior-rank snapshots. Cross-references useElitePlayers (Players page)
                    // as the single source of truth for rankChange. If a leader isn't in
                    // the elite top-200, no indicator renders — absence over fabrication.
                    const rankChange = isWorldCategory
                      ? (eliteRankMap.get(item.playerId) ?? null)
                      : null;
                    return (
                      <PlayerCardV2
                        key={item.playerId}
                        player={{
                          id: item.playerId,
                          fullName: item.player.full_name,
                          country: item.player.country,
                          countryCode: item.player.country_code,
                          photoUrl: item.player.photo_url,
                          pgaTourId: item.player.pga_tour_id,
                          tourCodes: (item.player as any).tour_codes ?? null,
                        }}
                        worldRank={item.rank}
                        index={idx}
                        isTopTen={idx < 9}
                        rankChange={rankChange}
                        recentResult={recentResultsMap?.get(item.playerId) ?? null}
                        displayValue={{ main: fmt(item.value), label: unit || undefined }}
                      />
                    );
                  })}
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
