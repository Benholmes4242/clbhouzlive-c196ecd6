/**
 * PlayersTab - Dispatch-style Players page.
 * Flat ruled design with editorial opening.
 */

import { useState, useMemo, useCallback, useEffect, useRef, type RefObject } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronRight, Users, Crown } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useRecentPlayerResults } from '../../hooks/useRecentPlayerResults';
import { useTourSeasonRankings } from '../../hooks/useTourSeasonRankings';

import { type PlayerTourCode } from '../players/PlayersTourFilterSheet';
import { type PlayerSortType, getDefaultSortForTour } from '../players/PlayerSortControl';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { PlayersEmptyState } from '../players/PlayersEmptyState';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import {
  AMBER,
  GOLD,
  GOLD_DEEP,
  GOLD_BORDER,
  GOLD_TINT,
  GOLD_TINT_10,
  HAIRLINE_INK_10,
  INK,
  INK_DEEP,
  INK_FAINT,
  INK_MUTE,
  INK_TINT_06,
  INK_TINT_07,
  SLATE_50,
  SLATE_150,
  SURFACE,
} from '../../_shared/tokens';

// Inline sort label resolver
function getSortShortLabel(sort: PlayerSortType, activeTour: string): string {
  const map: Record<string, string> = {
    'world-rank-desc': 'World Ranking',
    'world-rank-asc': 'World Ranking ↑',
    'alpha-az': 'A–Z',
    'alpha-za': 'Z–A',
    'most-wins': 'Wins',
    'highest-earnings': 'Earnings',
    'fedex-points': 'FedEx',
    'race-to-dubai': 'Race to Dubai',
    'race-to-cme': 'Race to CME Globe',
    'points-list': 'Standings',
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

// ─────────────────────────────────────────────────────────────────────────────
// HeroChampion — World-Rankings #1 card (IMG_6046 exemplar)
// Caption row · 80px squircle photo (gold ring + "1" badge) · name+country · big points
// ─────────────────────────────────────────────────────────────────────────────
interface HeroChampionProps {
  champion: ElitePlayer;
  runnerUp: ElitePlayer | null;
  champStats: { earnings: number | null; wins: number | null; tourRank: number | null; points: number | null; tournamentsPlayed: number | null } | undefined;
  champAvatarCandidates: string[];
  sort: PlayerSortType;
  activeTour: string;
  onClick: () => void;
}

function formatEarningsCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function HeroChampion({ champion, champStats, champPhotoUrl, sort, activeTour, onClick }: HeroChampionProps) {
  const primary = (() => {
    if (sort === 'fedex-points') {
      if (!champStats?.points || champStats.points <= 0) return null;
      return {
        value: champStats.points.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        label: 'FEDEX POINTS',
      };
    }
    if (sort === 'highest-earnings') {
      if (!champStats?.earnings || champStats.earnings <= 0) return null;
      return { value: formatEarningsCompact(champStats.earnings), label: 'SEASON EARNINGS' };
    }
    if (sort === 'most-wins') {
      if (!champStats?.wins) return null;
      return { value: String(champStats.wins), label: champStats.wins === 1 ? 'WIN' : 'WINS' };
    }
    const isNonPgaTour = activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP';
    const tourPts = champStats?.points && champStats.points > 0 && (sort !== 'world-rank-desc' && (sort !== 'alpha-az' && sort !== 'alpha-za' || isNonPgaTour))
      ? champStats.points
      : null;
    const owgrPts = champion.totalPoints ?? champion.avgPoints;
    const displayPts = tourPts ?? (isNonPgaTour ? null : owgrPts);
    if (displayPts == null) return null;
    return {
      value: displayPts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      label: 'TOTAL POINTS',
    };
  })();

  const isWorldRankTour = activeTour === 'pga' || activeTour === 'LPGA';
  const rankLabel =
      sort === 'fedex-points'      ? 'FEDEX LEADER'
    : sort === 'highest-earnings'  ? 'MONEY LEADER'
    : sort === 'most-wins'         ? 'WINS LEADER'
    : sort === 'world-rank-desc'   ? (isWorldRankTour ? 'WORLD #1' : 'TOUR LEADER')
    : 'TOUR LEADER';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer active:opacity-80 transition-opacity"
      style={{
        background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
      }}
    >
      {/* Caption row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Crown size={13} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP, flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: INK }}>
          {rankLabel}
        </span>
      </div>

      {/* Body row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Photo + "1" badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 80, height: 80, borderRadius: '34%', overflow: 'hidden', background: INK_TINT_06, border: `2.5px solid ${GOLD}`, boxShadow: '0 4px 12px rgba(255,184,0,0.20)' }}>
            <img
              src={champPhotoUrl}
              alt={champion.playerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
              onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          </div>
          <div
            style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: '50%',
              background: GOLD, color: INK,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900,
              border: `2.5px solid ${SURFACE}`,
              boxShadow: '0 1px 3px rgba(15,23,42,0.15)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            1
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {champion.playerName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <CountryFlag country={champion.country} size="sm" />
            <span style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titleCaseCountry(champion.country)}</span>
          </div>

          {primary && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {primary.value}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: INK_MUTE, textTransform: 'uppercase' as const }}>
                {primary.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function PlayersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const initialTour = searchParams.get('tour') || 'pga';
  const [sort, setSort] = useState<PlayerSortType>(getDefaultSortForTour(initialTour));
  const [searchExpanded, setSearchExpanded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Tour filter from URL
  const rawTour = (searchParams.get('tour') as PlayerTourCode) || 'pga';
  const activeTour = (rawTour === 'CHAMP' ? 'pga' : rawTour) as PlayerTourCode;
  const setActiveTour = useCallback((tour: PlayerTourCode) => {
    const params = new URLSearchParams(searchParams);
    params.set('tour', tour);
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
  const { data: tourRankings, isPending: tourRankingsPending } = useTourSeasonRankings(tourRankingsCode, seasonYear);

  // Non-PGA tours depend on tour_season_rankings for sort + display. Block paint
  // until it resolves so we never flash an OWGR-ordered interim (race fix).
  const isNonPgaTour = activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP';
  const tourRanksLoading = isNonPgaTour && (tourRankingsPending || !tourRankings);

  // Reset pagination on search/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, sort]);

  // Whenever the active tour changes (incl. landing/return), snap sort to that
  // tour's canonical default. PGA → World Ranking, never a stale FedEx/Earnings tab.
  useEffect(() => {
    setSort(getDefaultSortForTour(activeTour));
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTour]);

  // Build world rank & stats lookup from elite players (includes weekly rank change)
  const rankMap = useMemo(() => {
    const map = new Map<string, { worldRank: number; avgPoints: number | null; totalPoints: number | null; rankChange: number | null }>();
    if (elitePlayers) {
      elitePlayers.forEach(ep => {
        map.set(ep.playerId, {
          worldRank: ep.worldRank,
          avgPoints: ep.avgPoints,
          totalPoints: ep.totalPoints,
          rankChange: ep.rankChange,
        });
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
          tourRank: ps.fedex_rank ?? ps.earnings_rank ?? null,
          points: ps.fedex_points ?? null,
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
    if (!allPlayers) return allPlayers || [];
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
    // Non-PGA tours: derive hero directly from tour_season_rankings so the
    // champion is authoritative and never depends on the OWGR elite-pool race.
    const heroIsNonPga = activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP';
    if (heroIsNonPga && tourRankings && tourRankings.length > 0) {
      const playerById = new Map((allPlayers ?? []).map(p => [p.id, p]));
      return tourRankings.slice(0, 5).map(r => {
        const pid = r.player_id || r.manual_player_id || '';
        const p = pid ? playerById.get(pid) : undefined;
        if (p) {
          return {
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
          } as ElitePlayer;
        }
        // Synthetic ElitePlayer for unjoinable rows so the top-5 position is preserved.
        const parts = (r.player_name || '').split(/\s+/);
        return {
          id: pid || `rank-${r.id}`,
          playerId: pid || `rank-${r.id}`,
          playerName: r.player_name || '',
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          country: r.country ?? null,
          countryCode: null,
          photoUrl: null,
          pgaTourId: null,
          tourCode: r.tour_code ?? null,
          worldRank: 0,
          avgPoints: null,
          totalPoints: null,
          priorRank: null,
          rankChange: null,
        } as ElitePlayer;
      });
    }

    const sortCandidates = (candidates: ElitePlayer[]) => {
      return [...candidates].sort((a, b) => {
        const aStats = statsMap.get(a.playerId);
        const bStats = statsMap.get(b.playerId);
        switch (sort) {
          case 'alpha-az':
          case 'alpha-za': {
            // For non-PGA tours, freeze hero to tour ranking order
            const isNonPgaTour = activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP';
            if (isNonPgaTour) {
              const aRank = aStats?.tourRank ?? Infinity;
              const bRank = bStats?.tourRank ?? Infinity;
              if (aRank !== bRank) return aRank - bRank;
              return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
            }
            // PGA: freeze to world rank
            const aWR = a.worldRank ?? Infinity;
            const bWR = b.worldRank ?? Infinity;
            return aWR - bWR;
          }
          case 'highest-earnings': {
            // Hero shows top earners
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
          }
          case 'most-wins': {
            // Hero shows most wins leaders
            const aWins = aStats?.wins ?? 0;
            const bWins = bStats?.wins ?? 0;
            if (bWins !== aWins) return bWins - aWins;
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
          }
          case 'fedex-points': {
            // Hero frozen to FedEx points order for PGA
            const aPts = aStats?.points ?? 0;
            const bPts = bStats?.points ?? 0;
            if (bPts !== aPts) return bPts - aPts;
            return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
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
            // world-rank-desc and any other sort — use world rank
            const aWR = a.worldRank ?? Infinity;
            const bWR = b.worldRank ?? Infinity;
            if (aWR !== bWR) return aWR - bWR;
            return (bStats?.earnings ?? 0) - (aStats?.earnings ?? 0);
          }
        }
      });
    };

    const tourElite = (elitePlayers || []).filter(ep => {
      const player = allPlayers?.find(p => p.id === ep.playerId);
      if (!player) return false;
      if (player.tour_codes?.includes(activeTour)) return true;
      if (activeTour === 'pga' && (!player.tour_codes || player.tour_codes.length === 0)) {
        return ep.worldRank != null && ep.worldRank <= 100;
      }
      return false;
    });

    const isNonPgaTour = activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV' || activeTour === 'CHAMP';
    const needsFullPool = sort === 'most-wins' || sort === 'highest-earnings' || sort === 'fedex-points' || sort === 'race-to-dubai' || sort === 'race-to-cme' || sort === 'points-list' || sort === 'liv-standings' || (isNonPgaTour && (sort === 'alpha-az' || sort === 'alpha-za'));
    
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
  }, [elitePlayers, activeTour, allPlayers, statsMap, tourFilteredPlayers, rankMap, sort, tourRankings]);

  // Search filter
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // Pipeline: tour → search → sort → pagination
  // Only the world #1 (champion) is excluded from the rendered list. Rows 2-5
  // appear in the list directly below the hero per Phase 1 spec.
  const heroPlayerIds = useMemo(
    () => new Set(heroPlayers.slice(0, 1).map(p => p.playerId)),
    [heroPlayers],
  );

  const { rows, totalCount } = useMemo(() => {
    let filtered = tourFilteredPlayers.filter(p =>
      matchesSearch(p.full_name, p.country) &&
      (debouncedSearch ? true : !heroPlayerIds.has(p.id))
    );

    // OWGR tab on PGA: only show players with a confirmed world rank
    if (activeTour === 'pga' && sort === 'world-rank-desc') {
      filtered = filtered.filter(p => {
        const wr = rankMap.get(p.id)?.worldRank;
        if (!wr || wr <= 0) return false;
        const codes = p.tour_codes ?? [];
        if (codes.length > 0 && codes.every((c: string) => c === 'LPGA')) return false;
        return true;
      });
    }

    // Earnings tab: only show players who have earnings data this season
    if (activeTour === 'pga' && sort === 'highest-earnings') {
      filtered = filtered.filter(p => {
        const earnings = statsMap.get(p.id)?.earnings;
        return earnings != null && earnings > 0;
      });
    }

    // Wins tab: only show players with at least 1 win
    if (activeTour === 'pga' && sort === 'most-wins') {
      filtered = filtered.filter(p => {
        const wins = statsMap.get(p.id)?.wins;
        return wins != null && wins > 0;
      });
    }

    // FedEx tab: only show players with FedEx points
    if (sort === 'fedex-points') {
      filtered = filtered.filter(p => (statsMap.get(p.id)?.points ?? 0) > 0);
    }

    // Tour-standing sorts: only include players with a tour rank, so unjoinable
    // rows can't appear with phantom (OWGR) positions.
    if (sort === 'race-to-dubai' || sort === 'race-to-cme' || sort === 'points-list' || sort === 'liv-standings') {
      filtered = filtered.filter(p => statsMap.get(p.id)?.tourRank != null);
    }

    filtered = [...filtered].sort((a, b) => {
      // Never fall back to OWGR for the tour-points sorts — players without a
      // tour rank sort to the bottom rather than being slotted by world ranking.
      const aRank = statsMap.get(a.id)?.tourRank ?? Infinity;
      const bRank = statsMap.get(b.id)?.tourRank ?? Infinity;

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
        case 'fedex-points': {
          const apts = statsMap.get(a.id)?.points ?? 0;
          const bpts = statsMap.get(b.id)?.points ?? 0;
          if (bpts !== apts) return bpts - apts;
          return (rankMap.get(a.id)?.worldRank ?? Infinity) - (rankMap.get(b.id)?.worldRank ?? Infinity);
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

  const isLoading = (allLoading && (!allPlayers || (allPlayers as TourPlayer[]).length === 0)) || tourRanksLoading;

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  // Recent results — batched 4-week query for ALL sortable rows (not just visible).
  // This ensures stable cache across load-more and tab switches with the same player set.
  const sortedPlayerIds = useMemo(() => rows.map(r => r.id), [rows]);
  const { data: recentResultsMap } = useRecentPlayerResults(sortedPlayerIds);

  // Auto-load more players when sentinel scrolls into view
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingRef.current) {
          isFetchingRef.current = true;
          setVisibleCount(c => c + PAGE_SIZE);
          setTimeout(() => { isFetchingRef.current = false; }, 300);
        }
      },
      { rootMargin: '400px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

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
    <div style={{ background: SLATE_50 }}>

      {/* ── EDITORIAL OPENING — Masthead + No.1 Cover Story + Movers Grid ── */}
      {!debouncedSearch && elitePlayers && elitePlayers.length > 0 && (() => {
        const top5 = heroPlayers;
        const champion = top5[0];
        const runners = top5.slice(1, 5);
        if (!champion) return null;
        const champStats = statsMap.get(champion.playerId);
        const champPhotoUrl = getPlayerHeadshotUrl(champion.playerName, champion.tourCode ?? 'pga');

        return (
          <div style={{ padding: '16px 16px 0', background: SLATE_50 }}>
            {/* ── MASTHEAD ── */}
            {(() => {
              const tourLabel = activeTour === 'pga' ? 'PGA Tour'
                : activeTour === 'EURO' ? 'DP World Tour'
                : activeTour === 'LPGA' ? 'LPGA'
                : activeTour === 'PGAD' ? 'Korn Ferry'
                : activeTour === 'LIV' ? 'LIV Golf'
                : activeTour === 'CHAMP' ? 'PGA Tour Champions'
                : 'Tour';
              const seasonLabel = `${season?.year ?? new Date().getFullYear()} ${tourLabel} Season`;
              return (
                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
                    aria-label="Players — open Tour Overview"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Users size={13} strokeWidth={2.5} style={{ color: AMBER }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: AMBER, textTransform: 'uppercase' as const }}>
                      PLAYERS
                    </span>
                    <ChevronRight size={11} strokeWidth={2.5} style={{ color: AMBER, marginTop: 1 }} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.005em' }}>
                      {seasonLabel}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}>
                      {totalCount.toLocaleString()} players
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── NO.1 COVER STORY ── */}
            <HeroChampion
              champion={champion}
              runnerUp={top5[1] ?? null}
              champStats={champStats}
              champPhotoUrl={champPhotoUrl}
              sort={sort}
              activeTour={activeTour}
              onClick={() => navigate(`/tourhub/player/${champion.playerId}`)}
            />

            {/* 2-5 preview removed (Phase 1 — fix.1.1). Rows 2+ render in the
                main list below the hero. */}
          </div>
        );
      })()}

      {/* Inline control row — search button only (back link + tour pill moved to shell) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
          {!searchExpanded && (
            <button
              onClick={() => setSearchExpanded(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 11px', borderRadius: 8,
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

        {/* Underline tour-specific tabs — only render when >1 tab */}
        {(() => {
          // Per-tour tab config — single source of truth.
          const tabs: { value: PlayerSortType; label: string }[] =
            activeTour === 'pga'
              ? [
                  { value: 'world-rank-desc', label: 'World Ranking' },
                  { value: 'fedex-points', label: 'FedEx Cup' },
                  { value: 'highest-earnings', label: 'Earnings' },
                ]
            : activeTour === 'EURO' ? [{ value: 'race-to-dubai', label: 'Race to Dubai' }]
            : activeTour === 'LPGA' ? [{ value: 'race-to-cme', label: 'Race to CME Globe' }]
            : activeTour === 'PGAD' ? [{ value: 'points-list', label: 'Korn Ferry Points' }]
            : activeTour === 'LIV' ? [{ value: 'liv-standings', label: 'Individual Standings' }]
            : activeTour === 'CHAMP' ? [{ value: 'highest-earnings', label: 'Earnings' }]
            : [{ value: getDefaultSortForTour(activeTour) as PlayerSortType, label: getSortShortLabel(getDefaultSortForTour(activeTour), activeTour) }];

          if (tabs.length <= 1) return null;

          return (
            <div style={{ display: 'flex', borderBottom: `1px solid ${HAIRLINE_INK_10}` }}>
              {tabs.map(tab => {
                const isActive = sort === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => { setSort(tab.value); setVisibleCount(PAGE_SIZE); }}
                    style={{
                      flex: 1, padding: '12px 0',
                      fontSize: '12px', fontWeight: isActive ? 800 : 600,
                      color: isActive ? INK : INK_FAINT,
                      background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${isActive ? INK_DEEP : 'transparent'}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Search input — appears only when expanded */}
        {searchExpanded && (
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



      {/* Tour filter bottom sheet — moved to PlayersShellRow */}

      {/* Content — white surface */}
      <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
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
                      worldRank={(() => {
                        if (sort === 'highest-earnings' || sort === 'fedex-points' || sort === 'most-wins') {
                          // Positional rank — champion is hero #1, list starts at #2
                          return index + 2;
                        }
                        if (sort === 'race-to-dubai' || sort === 'race-to-cme' || sort === 'points-list' || sort === 'liv-standings') {
                          return pStats?.tourRank ?? null;
                        }
                        if (sort === 'alpha-az' || sort === 'alpha-za') {
                          return null;
                        }
                        return rank?.worldRank;
                      })()}
                      owgr={rank?.worldRank}
                      earnings={pStats?.earnings}
                      wins={pStats?.wins}
                      points={pStats?.points}
                      totalPoints={rank?.totalPoints}
                      tournamentsPlayed={pStats?.tournamentsPlayed}
                      showTourBadge={false}
                      index={index}
                      activeSort={sort}
                      activeTour={activeTour}
                      isTopTen={index < 9}
                      // Movement indicator gated to OWGR-only because only sr_world_rankings
                      // has prior-rank snapshots. Widen this gate when other ranking systems
                      // (FedEx Cup / Earnings / Race to Dubai / Race to CME Globe) add weekly history.
                      rankChange={
                        activeTour === 'pga' && sort === 'world-rank-desc'
                          ? rank?.rankChange ?? null
                          : null
                      }
                      recentResult={recentResultsMap?.get(player.id) ?? null}
                      directoryMode={false}
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

        {/* Sentinel — triggers auto-load when scrolled into view */}
        {hasMore && (
          <div ref={sentinelRef} style={{ padding: '20px 16px', textAlign: 'center' as const }}>
            <div style={{ width: 20, height: 20, margin: '0 auto', border: '2px solid rgba(15,23,42,0.12)', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {totalCount > 0 && (
          <div style={{ padding: '8px 16px 32px', textAlign: 'center' as const }}>
            <span style={{ fontSize: '10px', color: INK_FAINT }}>
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
