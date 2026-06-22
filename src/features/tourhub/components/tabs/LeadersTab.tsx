/**
 * LeadersTab — Dispatch editorial layout for Stat Watch.
 * Slate masthead, underline group tabs, amber chip rail, white surface table.
 * Rows reuse the Players-page PlayerCardV2 primitive for visual consistency
 * across Tour Hub destinations.
 */

import { useMemo, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankingsLeaders } from '../../hooks/useWorldRankingsLeaders';
import { useElitePlayers } from '../../hooks/useElitePlayers';

import { useRecentPlayerResults } from '../../hooks/useRecentPlayerResults';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LEADER_CATEGORIES, getCategoryByKey } from '../leaders/constants';
import { LeadersCategorySheet } from '../leaders/LeadersCategorySheet';
import { LeadersMasthead } from '../leaders/LeadersMasthead';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { LeadersEmptyState } from '../leaders/LeadersEmptyState';
import { AMBER, GOLD_TINT_10, HAIRLINE_INK_10, INK, INK_FAINT, INK_MUTE, INK_TINT_06, INK_TINT_07, SLATE_50, SLATE_150, SURFACE } from '../../_shared/tokens';

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
  const categoryKey = searchParams.get('category') || 'earnings';
  const category = getCategoryByKey(categoryKey) || LEADER_CATEGORIES[0];

  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: worldRankings, isLoading: worldLoading } = useWorldRankingsLeaders(50);

  const isWorldCategory = category.key === 'world_rank';
  const isLoading = isWorldCategory ? worldLoading : statsLoading;

  // ─── Scroll to top on category change ───
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryKey]);

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

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

  // ─── Hero leader (#1) ───
  // Lifted above the loading early return so hook order stays stable across
  // renders (was: React error #310 when isLoading flipped). All downstream
  // react-query hooks have `enabled` guards (verified in audit Q3) so they
  // sit idle until rankedPlayers materialises.
  const leader = rankedPlayers[0] ?? null;

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

  // ─── (streak / margin labels removed in condense pass) ───

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div style={{ background: SLATE_50 }}>
        {/* Masthead skeleton */}
        <div style={{ background: SLATE_50, padding: '16px 16px 14px' }}>
          {/* Eyebrow line (10.5px / 700) */}
          <Skeleton className="h-3 w-24 mb-2" style={{ background: INK_TINT_06 }} />
          {/* h1 (24px / 800) */}
          <Skeleton className="h-7 w-40 mb-2" style={{ background: INK_TINT_06 }} />
          {/* Subhead (13px) */}
          <Skeleton className="h-3 w-56 mb-3" style={{ background: INK_TINT_06 }} />
          {/* Leader card */}
          <Skeleton className="h-28 w-full rounded-[14px]" style={{ background: GOLD_TINT_10 }} />
        </div>
        {/* Sticky header skeleton */}
        <div style={{ padding: '12px 16px' }}>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        {/* Row skeletons */}
        <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}` }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
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



  return (
    <div style={{ background: SLATE_50 }}>
      {/* Unified editorial masthead */}
      <LeadersMasthead
        leader={leader}
        category={category}
        formatOverride={worldFormatOverride}
        unitOverride={worldUnitOverride}
        seasonYear={season?.year ?? null}
        tourLabel="PGA"
        onEyebrowTap={() => navigate('/tourhub?tab=overview', { replace: true })}
      />

      {/* Inline control row — search button only (back link + group/chip nav moved to shell) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
          {!searchExpanded && (
            <button
              onClick={() => setSearchExpanded(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8,
                background: SLATE_150,
                border: 'none', cursor: 'pointer',
              }}
              aria-label="Search players"
            >
              <Search className="w-3 h-3" style={{ color: INK }} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Search</span>
            </button>
          )}
        </div>

        {/* Count bar OR search input — mutually exclusive */}
        {!searchExpanded ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 16px 8px' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: INK, letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontVariantNumeric: 'tabular-nums' }}>
              {listPlayers.length.toLocaleString()} {listPlayers.length === 1 ? 'PLAYER' : 'PLAYERS'}
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
              RANKED BY <span style={{ color: INK }}>{category.shortLabel.toUpperCase()}</span>
            </span>
          </div>
        ) : (
          <div style={{ padding: '6px 16px 8px' }}>
            <div style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4" style={{ color: AMBER }} strokeWidth={2.5} />
              <input
                type="text"
                autoFocus
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-9 rounded-lg text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}` }}
              />
              <button
                onClick={() => { setSearch(''); setSearchExpanded(false); }}
                aria-label="Close search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full active:scale-90"
                style={{ background: INK_TINT_06 }}
              >
                <X className="w-3 h-3" style={{ color: INK }} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Rankings list — white surface (column header removed Phase 1 fix.1.3) */}
        <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
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
                  {!search && (
                    <div style={{ padding: '12px 16px 6px' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                        CHASING
                      </span>
                    </div>
                  )}
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
                  <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: `0.5px solid ${INK_TINT_07}` }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
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
        leaderValue={leader ? `${(worldFormatOverride ?? category.format)(leader.value)}${(worldUnitOverride ?? category.unit) ? ` ${worldUnitOverride ?? category.unit}` : ''}` : undefined}
        categoryLeaderValues={categoryLeaderValues}
        externalOpen={categorySheetOpen}
        onExternalClose={() => setCategorySheetOpen(false)}
        hideTrigger
      />
    </div>
  );
}
