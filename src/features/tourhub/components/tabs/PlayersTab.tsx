/**
 * PlayersTab - Dispatch-style Players page.
 * Flat ruled design with editorial opening.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronLeft, RefreshCw, Globe, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useTourSeasonRankings } from '../../hooks/useTourSeasonRankings';
import { type PlayerTourCode } from '../players/PlayersTourFilterSheet';
import { type PlayerSortType, getDefaultSortForTour } from '../players/PlayerSortControl';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { PlayersEmptyState } from '../players/PlayersEmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';

// Inline sort label resolver
function getSortShortLabel(sort: PlayerSortType, activeTour: string): string {
  const map: Record<string, string> = {
    'world-rank-desc': 'World Ranking',
    'world-rank-asc': 'World Ranking ↑',
    'alpha-az': 'A–Z',
    'alpha-za': 'Z–A',
    'most-wins': 'Wins',
    'highest-earnings': 'Earnings',
    'race-to-dubai': 'Race to Dubai',
    'race-to-cme': 'Race to CME Globe',
    'points-list': 'Points List',
    'liv-standings': 'Standings',
  };
  return map[sort] ?? 'Sort';
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debounced;
}

const PAGE_SIZE = 50;

export function PlayersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const initialTour = searchParams.get('tour') || 'all';
  const [sort, setSort] = useState<PlayerSortType>(getDefaultSortForTour(initialTour));
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tourSheetOpen, setTourSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'players'] }),
      queryClient.invalidateQueries({ queryKey: ['elite-players'] }),
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'player-statistics'] }),
      queryClient.invalidateQueries({ queryKey: ['tour-season-rankings'] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      handleRefresh();
    }
    setPullDistance(0);
    isPulling.current = false;
  }, [pullDistance, handleRefresh]);

  // Tour filter from URL
  const activeTour = (searchParams.get('tour') as PlayerTourCode) || 'all';
  const setActiveTour = useCallback((tour: PlayerTourCode) => {
    const params = new URLSearchParams(searchParams);
    if (tour === 'all') {
      params.delete('tour');
    } else {
      params.set('tour', tour);
    }
    params.set('tab', 'players');
    setSearchParams(params, { replace: true });
    setVisibleCount(PAGE_SIZE);
    setSort(getDefaultSortForTour(tour));
  }, [searchParams, setSearchParams]);

  // Data hooks
  const { data: allPlayers, isLoading: allLoading } = useTourPlayers();
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(200);
  const { data: season } = useTourSeason();
  const { data: playerStats } = useTourPlayerStatistics(season?.id);

  // Tour season rankings
  const tourRankingsCode = activeTour === 'EURO' ? 'euro' : (activeTour === 'LPGA' ? 'lpga' : (activeTour === 'PGAD' ? 'pgad' : (activeTour === 'LIV' ? 'liv' : (activeTour === 'CHAMP' ? 'champ' : ''))));
  const seasonYear = useMemo(() => {
    const now = new Date();
    return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  }, []);
  const { data: tourRankings } = useTourSeasonRankings(tourRankingsCode, seasonYear);

  // Reset pagination on search/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, sort]);

  // Build world rank & stats lookup from elite players
  const rankMap = useMemo(() => {
    const map = new Map<string, { worldRank: number; avgPoints: number | null; totalPoints: number | null }>();
    if (elitePlayers) {
      elitePlayers.forEach(ep => {
        map.set(ep.playerId, { worldRank: ep.worldRank, avgPoints: ep.avgPoints, totalPoints: ep.totalPoints });
      });
    }
    return map;
  }, [elitePlayers]);

  // Build stats map
  const statsMap = useMemo(() => {
    const map = new Map<string, { 
      earnings: number | null; 
      wins: number | null; 
      tourRank: number | null; 
      points: number | null;
      tournamentsPlayed: number | null;
    }>();
    if (playerStats) {
      playerStats.forEach(ps => {
        map.set(ps.player_id, { 
          earnings: ps.earnings, 
          wins: ps.wins,
          tourRank: ps.earnings_rank ?? ps.fedex_rank ?? null,
          points: null,
          tournamentsPlayed: null,
        });
      });
    }
    if ((activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP') && tourRankings) {
      tourRankings.forEach(r => {
        const playerId = r.player_id || r.manual_player_id;
        if (playerId) {
          const existing = map.get(playerId);
          map.set(playerId, {
            earnings: existing?.earnings ?? null,
            wins: r.wins ?? existing?.wins ?? null,
            tourRank: r.position,
            points: r.points,
            tournamentsPlayed: r.tournaments_played,
          });
        }
      });
    }
    return map;
  }, [playerStats, activeTour, tourRankings]);

  // Tour-level filtering
  const tourFilteredPlayers = useMemo(() => {
    if (!allPlayers || activeTour === 'all') return allPlayers || [];
    return allPlayers.filter(p => {
      if (p.tour_codes?.includes(activeTour)) return true;
      if (activeTour === 'pga' && (!p.tour_codes || p.tour_codes.length === 0)) {
        const wr = rankMap.get(p.id)?.worldRank;
        return wr != null && wr <= 100;
      }
      return false;
    });
  }, [allPlayers, activeTour, rankMap]);

  // Tour counts
  const tourCounts = useMemo(() => {
    if (!allPlayers) return {};
    const counts: Record<string, number> = {};
    allPlayers.forEach(p => {
      p.tour_codes?.forEach(code => {
        counts[code] = (counts[code] || 0) + 1;
      });
    });
    return counts;
  }, [allPlayers]);

  // Hero players — sorted to match the active sort selection
  const heroPlayers = useMemo<ElitePlayer[]>(() => {
    const sortCandidates = (candidates: ElitePlayer[]) => {
      return [...candidates].sort((a, b) => {
        const aStats = statsMap.get(a.playerId);
        const bStats = statsMap.get(b.playerId);
        switch (sort) {
          case 'most-wins': {
            const aWins = aStats?.wins ?? 0;
            const bWins = bStats?.wins ?? 0;
            if (bWins !== aWins) return bWins - aWins;
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            return (bStats?.points ?? 0) - (aStats?.points ?? 0);
          }
          case 'alpha-az':
            return a.playerName.localeCompare(b.playerName);
          case 'alpha-za':
            return b.playerName.localeCompare(a.playerName);
          case 'highest-earnings': {
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            const aRank = aStats?.tourRank ?? a.worldRank ?? Infinity;
            const bRank = bStats?.tourRank ?? b.worldRank ?? Infinity;
            return aRank - bRank;
          }
          case 'race-to-dubai':
          case 'race-to-cme':
          case 'points-list':
          case 'liv-standings': {
            const aRank = aStats?.tourRank ?? Infinity;
            const bRank = bStats?.tourRank ?? Infinity;
            if (aRank !== bRank) return aRank - bRank;
            return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
          }
          default: {
            const aWR = a.worldRank ?? Infinity;
            const bWR = b.worldRank ?? Infinity;
            if (aWR !== bWR) return aWR - bWR;
            return (bStats?.earnings ?? 0) - (aStats?.earnings ?? 0);
          }
        }
      });
    };

    if (activeTour === 'all') {
      return (elitePlayers || [])
        .filter(p => p.worldRank && p.worldRank > 0)
        .sort((a, b) => (a.worldRank || 999) - (b.worldRank || 999))
        .slice(0, 8);
    }
    
    const tourElite = (elitePlayers || []).filter(ep => {
      const player = allPlayers?.find(p => p.id === ep.playerId);
      if (!player) return false;
      if (player.tour_codes?.includes(activeTour)) return true;
      if (activeTour === 'pga' && (!player.tour_codes || player.tour_codes.length === 0)) {
        return ep.worldRank != null && ep.worldRank <= 100;
      }
      return false;
    });

    const needsFullPool = sort === 'most-wins' || sort === 'highest-earnings' || sort === 'race-to-dubai' || sort === 'race-to-cme' || sort === 'points-list' || sort === 'liv-standings';
    
    const toEliteShape = (p: TourPlayer): ElitePlayer => ({
      id: p.id,
      playerId: p.id,
      playerName: p.full_name,
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      country: p.country,
      countryCode: p.country_code,
      photoUrl: p.photo_url,
      pgaTourId: p.pga_tour_id,
      tourCode: p.tour_codes?.[0] ?? null,
      worldRank: rankMap.get(p.id)?.worldRank ?? 0,
      avgPoints: rankMap.get(p.id)?.avgPoints ?? null,
      totalPoints: null,
      priorRank: null,
      rankChange: null,
    });

    let heroPool: ElitePlayer[] = [...tourElite];

    if (needsFullPool && tourFilteredPlayers && tourFilteredPlayers.length > 0) {
      const existingIds = new Set(heroPool.map(ep => ep.playerId));
      const additional = tourFilteredPlayers
        .filter(p => !existingIds.has(p.id))
        .map(toEliteShape);
      heroPool = [...heroPool, ...additional];
    }

    if (heroPool.length > 0) {
      return sortCandidates(heroPool).slice(0, 5);
    }
    
    if (!tourFilteredPlayers || tourFilteredPlayers.length === 0) return [];
    
    return tourFilteredPlayers.slice(0, 5).map(toEliteShape);
  }, [elitePlayers, activeTour, allPlayers, statsMap, tourFilteredPlayers, rankMap, sort]);

  // Search filter
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // Pipeline: tour → search → sort → pagination
  const heroPlayerIds = useMemo(() => new Set(heroPlayers.map(p => p.playerId)), [heroPlayers]);

  const { rows, totalCount } = useMemo(() => {
    let filtered = tourFilteredPlayers.filter(p =>
      matchesSearch(p.full_name, p.country) &&
      (debouncedSearch ? true : !heroPlayerIds.has(p.id))
    );

    filtered = [...filtered].sort((a, b) => {
      const aWorldRank = rankMap.get(a.id)?.worldRank ?? Infinity;
      const bWorldRank = rankMap.get(b.id)?.worldRank ?? Infinity;
      
      const aRank = activeTour === 'all' 
        ? aWorldRank 
        : (statsMap.get(a.id)?.tourRank ?? aWorldRank);
      const bRank = activeTour === 'all' 
        ? bWorldRank 
        : (statsMap.get(b.id)?.tourRank ?? bWorldRank);

      switch (sort) {
        case 'world-rank-desc': {
          const aWR = rankMap.get(a.id)?.worldRank ?? Infinity;
          const bWR = rankMap.get(b.id)?.worldRank ?? Infinity;
          if (aWR === Infinity && bWR === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aWR === Infinity) return 1;
          if (bWR === Infinity) return -1;
          if (aWR !== bWR) return aWR - bWR;
          return a.full_name.localeCompare(b.full_name);
        }
        case 'world-rank-asc':
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          if (aRank !== bRank) return bRank - aRank;
          return a.full_name.localeCompare(b.full_name);
        case 'alpha-az':
          return a.full_name.localeCompare(b.full_name);
        case 'alpha-za':
          return b.full_name.localeCompare(a.full_name);
        case 'most-wins': {
          const aStats = statsMap.get(a.id);
          const bStats = statsMap.get(b.id);
          const aWins = aStats?.wins ?? 0;
          const bWins = bStats?.wins ?? 0;
          if (bWins !== aWins) return bWins - aWins;
          const aEarn = aStats?.earnings ?? 0;
          const bEarn = bStats?.earnings ?? 0;
          if (bEarn !== aEarn) return bEarn - aEarn;
          return (bStats?.points ?? 0) - (aStats?.points ?? 0);
        }
        case 'highest-earnings': {
          const aEarn = statsMap.get(a.id)?.earnings ?? 0;
          const bEarn = statsMap.get(b.id)?.earnings ?? 0;
          return bEarn - aEarn || aRank - bRank;
        }
        case 'race-to-dubai':
        case 'race-to-cme':
        case 'points-list':
        case 'liv-standings': {
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          if (aRank !== bRank) return aRank - bRank;
          return a.full_name.localeCompare(b.full_name);
        }
        default:
          return aRank - bRank;
      }
    });

    return { rows: filtered, totalCount: filtered.length };
  }, [tourFilteredPlayers, matchesSearch, sort, rankMap, statsMap, activeTour, heroPlayerIds, debouncedSearch]);

  const isLoading = allLoading && (!allPlayers || (allPlayers as TourPlayer[]).length === 0);

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const contentKey = `${activeTour}-${debouncedSearch}-${sort}`;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 -mx-5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Skeleton className="w-full" style={{ height: '35dvh' }} />
        <div className="px-5 space-y-3">
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 rounded-2xl" style={{ width: 140, height: 180 }} />
            ))}
          </div>
          <Skeleton className="h-[38px] rounded-[10px] w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-[34px] rounded-[10px] flex-1" />
            <Skeleton className="h-[34px] rounded-[10px] flex-1" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ background: '#F8FAFC' }}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="flex items-center justify-center"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isRefreshing ? 48 : pullDistance, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RefreshCw
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                isRefreshing && 'animate-spin'
              )}
              style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EDITORIAL OPENING — Masthead + No.1 Cover Story + Movers Grid ── */}
      {!debouncedSearch && elitePlayers && elitePlayers.length > 0 && (() => {
        const top5 = heroPlayers;
        const champion = top5[0];
        const runners = top5.slice(1, 5);
        if (!champion) return null;
        const champStats = statsMap.get(champion.playerId);
        const champPhotoUrl = getPlayerHeadshotUrl(champion.playerName, champion.tourCode ?? 'pga');

        return (
          <div style={{ padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0', background: '#F8FAFC' }}>
            {/* ── MASTHEAD ── */}
            <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                    ⚡ CLBHOUZ · TOUR HUB
                  </div>
                  <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
                    Players
                  </h1>
                </div>
                {/* Tour filter pill — lives in masthead */}
                <button
                  onClick={() => setTourSheetOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    borderRadius: '9px', padding: '6px 10px',
                    border: activeTour !== 'all'
                      ? '1px solid rgba(247,147,30,0.4)'
                      : '1px solid rgba(15,23,42,0.09)',
                    background: activeTour !== 'all' ? 'rgba(247,147,30,0.06)' : '#ffffff',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                    cursor: 'pointer', marginBottom: '2px',
                  }}
                >
                  {activeTour !== 'all' && hasTourLogo(activeTour.toLowerCase())
                    ? <img src={getTourLogo(activeTour.toLowerCase())} alt={activeTour} className="shrink-0" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    : <Globe className="w-[14px] h-[14px] shrink-0" style={{ color: '#F7931E' }} strokeWidth={2.5} />
                  }
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                    {activeTour === 'all' ? 'All Tours'
                      : activeTour === 'pga' ? 'PGA Tour'
                      : activeTour === 'EURO' ? 'DP World Tour'
                      : activeTour === 'LPGA' ? 'LPGA'
                      : activeTour === 'PGAD' ? 'Korn Ferry'
                      : activeTour === 'LIV' ? 'LIV Golf'
                      : 'All Tours'}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5" style={{ color: '#94A3B8' }} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* ── NO.1 COVER STORY ── */}
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                marginBottom: '14px', paddingBottom: '14px',
                borderBottom: '0.5px solid rgba(15,23,42,0.07)',
              }}
              onClick={() => navigate(`/tourhub/player/${champion.playerId}`)}
              className="cursor-pointer active:opacity-80 transition-opacity"
            >
              {/* Large faded rank number */}
              <div style={{ flexShrink: 0, width: '56px', paddingTop: '4px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', marginBottom: '2px' }}>NO.1</div>
                <span style={{ fontSize: '52px', fontWeight: 900, color: 'rgba(247,147,30,0.15)', lineHeight: 1, letterSpacing: '-0.05em', display: 'block' }}>1</span>
              </div>
              {/* Player info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <CountryFlag country={champion.country} size="sm" />
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{titleCaseCountry(champion.country)}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '8px' }}>
                  {champion.playerName}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', flexWrap: 'wrap' as const }}>
                  {champion.totalPoints != null ? (
                    <div>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.03em' }}>
                        {champion.totalPoints.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                      <span style={{ fontSize: '10px', color: '#F7931E', marginLeft: '3px' }}>pts</span>
                    </div>
                  ) : champion.avgPoints != null ? (
                    <div>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.03em' }}>
                        {champion.avgPoints.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '10px', color: '#F7931E', marginLeft: '3px' }}>pts</span>
                    </div>
                  ) : null}
                  {champStats?.earnings != null && champStats.earnings > 0 && (
                    <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                      {champStats.earnings >= 1_000_000
                        ? `$${(champStats.earnings / 1_000_000).toFixed(1)}M`
                        : `$${(champStats.earnings / 1_000).toFixed(0)}K`}
                    </span>
                  )}
                  {(champStats?.wins ?? 0) > 0 && (
                    <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                      {champStats!.wins} {champStats!.wins === 1 ? 'win' : 'wins'}
                    </span>
                  )}
                </div>
              </div>
              {/* Headshot */}
              <div style={{ width: '56px', height: '56px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
                <img
                  src={champPhotoUrl}
                  alt={champion.playerName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
                  onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>
            </div>

            {/* ── MOVERS GRID — #2–5 ── */}
            {runners.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                    {activeTour === 'all' ? 'World Rankings · 2–5' : 'Tour Rankings · 2–5'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                  {runners.map((player, i) => {
                    const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
                    const displayRank = i + 2; // positional: 2, 3, 4, 5
                    return (
                      <div
                        key={player.playerId}
                        onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
                        className="cursor-pointer active:opacity-70 transition-opacity"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '9px',
                          padding: '11px 12px',
                          borderRight: i % 2 === 0 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                          borderBottom: i < 2 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(15,23,42,0.15)', width: '18px', flexShrink: 0 }}>
                          {displayRank}
                        </span>
                        <div style={{ width: '30px', height: '30px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
                          <img
                            src={photoUrl}
                            alt={player.playerName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {player.playerName.split(' ').slice(-1)[0]}
                          </div>
                          {player.totalPoints != null ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', fontSize: '10px', fontWeight: 800, marginTop: '1px' }}>
                              <span style={{ color: '#F7931E' }}>{player.totalPoints.toLocaleString(undefined, { maximumFractionDigits: 1 })}pts</span>
                              {(() => {
                                const ps = statsMap.get(player.playerId);
                                if (ps?.earnings != null && ps.earnings > 0) {
                                  const e = ps.earnings >= 1_000_000 ? `$${(ps.earnings / 1_000_000).toFixed(1)}M` : `$${(ps.earnings / 1_000).toFixed(0)}K`;
                                  return <span style={{ color: '#0F172A' }}>{e}</span>;
                                }
                                return null;
                              })()}
                            </div>
                          ) : player.avgPoints != null ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', fontSize: '10px', fontWeight: 800, marginTop: '1px' }}>
                              <span style={{ color: '#F7931E' }}>{player.avgPoints.toFixed(2)}pts</span>
                              {(() => {
                                const ps = statsMap.get(player.playerId);
                                if (ps?.earnings != null && ps.earnings > 0) {
                                  const e = ps.earnings >= 1_000_000 ? `$${(ps.earnings / 1_000_000).toFixed(1)}M` : `$${(ps.earnings / 1_000).toFixed(0)}K`;
                                  return <span style={{ color: '#0F172A' }}>{e}</span>;
                                }
                                return null;
                              })()}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════
          STICKY HEADER — back link · sort · search
          ══════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Collapsible search bar */}
        <div
          style={{
            overflow: 'hidden',
            transition: 'max-height 250ms ease, opacity 250ms ease',
            maxHeight: searchExpanded ? '60px' : '0px',
            opacity: searchExpanded ? 1 : 0,
            padding: searchExpanded ? '8px 16px 0' : '0 16px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search players, countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-9 rounded-xl text-[13px] bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60 transition-all"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted active:scale-90"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Control row — back link + sort + search */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 0', gap: '6px' }}>
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            className="-ml-1 flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground/70 active:opacity-50 transition-opacity shrink-0"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </button>

          <div style={{ flex: 1 }} />

          {/* Sort pill — only for specific tours */}
          {activeTour !== 'all' && (
            <button
              onClick={() => setSortSheetOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 9px', borderRadius: '8px',
                background: '#ffffff', border: '1px solid rgba(15,23,42,0.09)',
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)', cursor: 'pointer',
              }}
              className="active:scale-[0.97] transition-transform"
            >
              <SlidersHorizontal className="w-3 h-3 shrink-0" style={{ color: '#F7931E' }} strokeWidth={2.5} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
                {getSortShortLabel(sort, activeTour)}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/60" strokeWidth={2.5} />
            </button>
          )}

          {/* Search icon */}
          <button
            onClick={() => setSearchExpanded(v => !v)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: searchExpanded ? 'rgba(247,147,30,0.08)' : 'transparent',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Search
              className="w-4 h-4 transition-colors"
              style={{ color: searchExpanded ? '#F7931E' : undefined }}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Underline sort tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.1)', marginTop: '6px' }}>
          {(activeTour === 'all'
            ? [
                { value: 'world-rank-desc' as PlayerSortType, label: 'OWGR' },
                { value: 'highest-earnings' as PlayerSortType, label: 'Earnings' },
                { value: 'most-wins' as PlayerSortType, label: 'Wins' },
                { value: 'alpha-az' as PlayerSortType, label: 'A–Z' },
              ]
            : [
                { value: getDefaultSortForTour(activeTour) as PlayerSortType, label: getSortShortLabel(getDefaultSortForTour(activeTour), activeTour) },
                { value: 'most-wins' as PlayerSortType, label: 'Wins' },
                { value: 'highest-earnings' as PlayerSortType, label: 'Earnings' },
                { value: 'alpha-az' as PlayerSortType, label: 'A–Z' },
              ]
          ).map(tab => {
            const isActive = sort === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => { setSort(tab.value); setVisibleCount(PAGE_SIZE); }}
                style={{
                  flex: 1, padding: '8px 0',
                  fontSize: '11px', fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#0F172A' : '#94A3B8',
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${isActive ? '#F7931E' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Count line */}
        <div style={{ padding: '5px 16px 8px' }}>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>
            {activeTour === 'all'
              ? `${totalCount.toLocaleString()} players · ${getSortShortLabel(sort, activeTour)}`
              : `${(tourCounts[activeTour] ?? 0).toLocaleString()} players`}
          </span>
        </div>
      </div>

      {/* Sort bottom sheet */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        ariaLabelledBy="players-sort-sheet-title"
      >
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Sort</div>
          <div id="players-sort-sheet-title" style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Sort Players</div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        {(() => {
          const isPGA = activeTour === 'pga';
          const isEuro = activeTour === 'EURO';
          const isLPGA = activeTour === 'LPGA';
          const isPGAD = activeTour === 'PGAD';
          const isLIV = activeTour === 'LIV';
          const opts: { value: PlayerSortType; label: string }[] =
            isLIV  ? [{ value: 'liv-standings', label: 'Standings' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isPGAD ? [{ value: 'points-list', label: 'Points List' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isLPGA ? [{ value: 'race-to-cme', label: 'Race to CME Globe' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isEuro ? [{ value: 'race-to-dubai', label: 'Race to Dubai' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isPGA  ? [{ value: 'world-rank-desc', label: 'Highest World Ranking' }, { value: 'highest-earnings', label: 'Highest Earnings' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : [{ value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }];
          return opts.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setVisibleCount(PAGE_SIZE); setSortSheetOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                background: sort === opt.value ? 'rgba(247,147,30,0.04)' : 'transparent',
                border: 'none',
                borderLeft: sort === opt.value ? '3px solid #F7931E' : '3px solid transparent',
                borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                cursor: 'pointer', textAlign: 'left' as const,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: sort === opt.value ? 800 : 500, color: '#0F172A' }}>
                {opt.label}
              </span>
              {sort === opt.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
            </button>
          ));
        })()}
        </div>
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>

      {/* Tour filter bottom sheet */}
      <BottomSheet
        open={tourSheetOpen}
        onClose={() => setTourSheetOpen(false)}
        ariaLabelledBy="players-tour-sheet-title"
      >
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Filter</div>
          <div id="players-tour-sheet-title" style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Select Tour</div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        {(['all', 'pga', 'EURO', 'LPGA', 'CHAMP', 'PGAD', 'LIV'] as const).map((code) => {
          const labels: Record<string, string> = {
            all: 'All Tours', pga: 'PGA Tour', EURO: 'DP World Tour',
            LPGA: 'LPGA', CHAMP: 'Champions', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
          };
          const descriptions: Record<string, string> = {
            all: 'Show players from every tour',
            pga: 'PGA Tour players',
            EURO: 'DP World Tour players',
            LPGA: 'LPGA Tour players',
            CHAMP: 'PGA Champions Tour players',
            PGAD: 'Korn Ferry Tour players',
            LIV: 'LIV Golf players',
          };
          const isSelected = activeTour === code;
          const count = code === 'all'
            ? Object.values(tourCounts).reduce((s, c) => s + c, 0)
            : (tourCounts[code] ?? 0);
          if (code !== 'all' && count === 0) return null;
          return (
            <button
              key={code}
              onClick={() => { setActiveTour(code as PlayerTourCode); setTourSheetOpen(false); }}
              aria-pressed={isSelected}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px',
                background: isSelected ? 'rgba(247,147,30,0.04)' : 'transparent',
                border: 'none',
                borderLeft: isSelected ? '3px solid #F7931E' : '3px solid transparent',
                borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                cursor: 'pointer', textAlign: 'left' as const,
              }}
            >
              {/* Tour logo chip */}
              <div style={{ width: 36, height: 22, borderRadius: 4, background: 'rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {code === 'all'
                  ? <Globe className="w-4 h-4" style={{ color: '#94A3B8' }} />
                  : hasTourLogo(code.toLowerCase())
                    ? <img src={getTourLogo(code.toLowerCase())} alt="" aria-hidden="true" style={{ width: 28, height: 18, objectFit: 'contain' }} />
                    : null
                }
              </div>
              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: '#0F172A' }}>
                  {labels[code]}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  {descriptions[code]}
                </div>
              </div>
              {/* Count */}
              {count > 0 && <span style={{ fontSize: 13, color: '#94A3B8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{count.toLocaleString()}</span>}
              {/* Active dot */}
              {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
            </button>
          );
        })}
        </div>
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>

      {/* Content — white surface */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            {displayRows.length > 0 ? (
              <>
                {displayRows.map((player, index) => {
                  const rank = rankMap.get(player.id);
                  const pStats = statsMap.get(player.id);
                  return (
                    <PlayerCardV2
                      key={player.id}
                      player={{
                        id: player.id,
                        fullName: player.full_name,
                        country: player.country,
                        countryCode: player.country_code,
                        photoUrl: player.photo_url,
                        pgaTourId: player.pga_tour_id,
                        tourCodes: player.tour_codes,
                      }}
                      worldRank={
                        sort === 'world-rank-desc' || sort === 'alpha-az' || sort === 'alpha-za' || activeTour === 'all'
                          ? rank?.worldRank
                          : (pStats?.tourRank || rank?.worldRank)
                      }
                      owgr={rank?.worldRank}
                      earnings={pStats?.earnings}
                      wins={pStats?.wins}
                      points={pStats?.points}
                      totalPoints={rank?.totalPoints}
                      tournamentsPlayed={pStats?.tournamentsPlayed}
                      showTourBadge={activeTour === 'all'}
                      index={index}
                      activeSort={sort}
                      activeTour={activeTour}
                      directoryMode={activeTour === 'all'}
                      onNavigate={() => sessionStorage.setItem('players-scroll', String(window.scrollY))}
                    />
                  );
                })}
              </>
            ) : (
              <PlayersEmptyState />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <div style={{ padding: '14px 16px', textAlign: 'center' as const, borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              style={{
                fontSize: '13px', fontWeight: 700, color: '#0F172A',
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
              }}
              className="active:opacity-70 transition-opacity"
            >
              Load more ({Math.min(visibleCount + PAGE_SIZE, totalCount) - visibleCount} players) ›
            </button>
          </div>
        )}

        {totalCount > 0 && (
          <div style={{ padding: '8px 16px 32px', textAlign: 'center' as const }}>
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>
              Showing {Math.min(visibleCount, totalCount)} of {totalCount}
            </span>
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }} />
    </div>
  );
}
