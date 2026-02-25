import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExplorationLeaderboard, useUserExplorationStatus } from '@/hooks/leaderboards';
import { useSeasonCalendar } from '@/hooks/championship';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';
import { supabase } from '@/integrations/supabase/client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import { CountrySelector } from '../shared/CountrySelector';
import { ExplorationPodium } from './ExplorationPodium';
import { GlobalProgressMap } from './GlobalProgressMap';
import { GlobalGolfersMapStatsRow } from './GlobalGolfersMapStatsRow';
import { ClubSearchBar } from './ClubSearchBar';
import type { LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

// --- Constants ---
const ROW_HEIGHT = 72; // 64px row (py-3 + h-10 avatar) + 8px gap (space-y-2)
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;
const STORAGE_KEY_SCROLL = 'exploration-leaderboard-scroll';
const STORAGE_KEY_FILTERS = 'exploration-leaderboard-filters';

// --- Helper components (module-level) ---
function ExplorationLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function InlineRetryCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 px-4">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-alt text-sm text-muted-foreground hover:bg-muted/30 active:scale-[0.98] transition-all"
      >
        Couldn't load more golfers · Tap to retry
      </button>
    </div>
  );
}

function InitialErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <p className="text-muted-foreground text-sm">Something went wrong loading the leaderboard.</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
      >
        Try again
      </button>
    </div>
  );
}

// --- Filter persistence helpers ---
function loadSavedFilters() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export function ExplorationTab() {
  const { user } = useSupabaseSession();
  const savedFilters = useRef(loadSavedFilters()).current;

  // Season color derivation
  const { data: seasonCalendar } = useSeasonCalendar();
  const seasonThemeColor = useMemo(() => {
    const currentSeason = seasonCalendar?.find(s => s.is_current);
    if (!currentSeason) return '#006747';
    const lower = currentSeason.name.toLowerCase();
    let id: SeasonId = 'major';
    if (lower.includes('pre-season') || lower.includes('preseason') || lower.includes('training')) id = 'preseason';
    else if (lower.includes('summer')) id = 'summer';
    else if (lower.includes('off-season') || lower.includes('offseason')) id = 'offseason';
    return getSeasonConfig(id).themeColor;
  }, [seasonCalendar]);

  const [scope, setScope] = useState<LeaderboardScope>(() => savedFilters?.scope ?? 'global');
  const [metric, setMetric] = useState<ExplorationMetric>(() => savedFilters?.metric ?? 'countries');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => savedFilters?.selectedClubId ?? null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(() => savedFilters?.selectedClubName ?? null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => savedFilters?.selectedCountry ?? null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  
  const [scrollTop, setScrollTop] = useState(0);

  // Refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const scrollPositionRef = useRef(0);
  const isFilterChangeRef = useRef(false);

  // Save filters
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
      scope, metric, selectedClubId, selectedClubName, selectedCountry,
    }));
    isFilterChangeRef.current = true;
    scrollPositionRef.current = (() => {
      const rootEl = document.getElementById('root');
      return (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    })();
  }, [scope, metric, selectedClubId, selectedClubName, selectedCountry]);

  // Preserve scroll on filter change
  useLayoutEffect(() => {
    if (isFilterChangeRef.current) {
      isFilterChangeRef.current = false;
      const scrollTarget = scrollPositionRef.current;
      if (scrollTarget > 0) {
        const rootEl = document.getElementById('root');
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
      }
    }
  });

  // Scroll tracking for virtualization
  useEffect(() => {
    const handleScroll = () => {
      const rootEl = document.getElementById('root');
      const currentScroll = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
      setScrollTop(currentScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const rootEl = document.getElementById('root');
    rootEl?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      rootEl?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Clear country when switching away from country scope
  useEffect(() => {
    if (scope !== 'country') {
      setSelectedCountry(null);
    }
  }, [scope]);

  // Fetch user's home club
  useEffect(() => {
    async function fetchUserHomeClub() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, golf_clubs!user_profiles_primary_club_id_fkey(name)')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName((data.golf_clubs as any)?.name || null);
        if (!selectedClubId) {
          setSelectedClubId(data.primary_club_id);
          setSelectedClubName((data.golf_clubs as any)?.name || null);
        }
      }
    }
    fetchUserHomeClub();
  }, [user?.id]);

  // When switching to club scope, default to user's home club
  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  // Data fetching
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useExplorationLeaderboard({
    scope,
    metric,
    clubId: scope === 'club' ? selectedClubId : null,
    country: scope === 'country' ? selectedCountry : null,
  });

  const allEntries = useMemo(
    () => data?.pages.flatMap(page => page.entries) ?? [],
    [data?.pages]
  );

  // User's exploration status for world map
  const { data: userStatus } = useUserExplorationStatus({ userId: user?.id });

  // Scroll restore
  useEffect(() => {
    if (hasRestoredScroll.current || allEntries.length === 0) return;
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allEntries.length]);

  // Infinite scroll observer
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Save scroll on entry click
  const handleEntryClick = useCallback(() => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
  }, []);

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  // Get metric value for display
  const getMetricValue = (entry: any) => {
    switch (metric) {
      case 'continents':
        return entry.continents_count;
      default:
        return entry.countries_count;
    }
  };

  const getPodiumRingColor = (rank: number): string | null => {
    switch (rank) {
      case 1: return '#D4A853';
      case 2: return '#B8C6C9';
      case 3: return '#C4956A';
      default: return null;
    }
  };

  const getMetricColor = (_rank: number): string => {
    // All stat numbers use season color for consistency
    return '';
  };

  const podiumEntries = allEntries.slice(0, 3);

  // Computed values for stats row
  const continentsPlayed = userStatus?.continent_list?.filter(c => c !== 'Antarctica').length ?? 0;
  const countriesPlayed = userStatus?.countries_count ?? 0;

  // Virtualization
  const virtualizedContent = useMemo(() => {
    if (allEntries.length <= VIRTUALIZATION_THRESHOLD) return null;
    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);
    const viewportHeight = window.innerHeight;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(allEntries.length, startIndex + visibleCount);
    const totalHeight = allEntries.length * ROW_HEIGHT;
    const offsetY = startIndex * ROW_HEIGHT;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [allEntries.length, scrollTop]);

  // Render entries helper
  const renderEntry = (entry: any, index: number) => (
    <div key={entry.user_id} onClick={handleEntryClick}>
      <LeaderboardRow
        rank={entry.rank}
        userId={entry.user_id}
        displayName={entry.display_name || 'Golfer'}
        profilePhotoUrl={entry.avatar_url}
        homeClub={entry.home_club}
        coursesCount={entry.courses_count}
        ringColor={getPodiumRingColor(entry.rank)}
        isCurrentUser={entry.user_id === user?.id}
        isFriend={entry.is_friend && scope !== 'friends'}
        seasonColor={seasonThemeColor}
      >
        <div className={getMetricColor(entry.rank)}>
          <LeaderboardStat value={getMetricValue(entry)} seasonColor={seasonThemeColor} />
        </div>
      </LeaderboardRow>
    </div>
  );

  return (
    <div className="flex flex-col px-5 pt-4" style={{ gap: 20 }}>
      {/* 1. World Map — 16px below sub-tabs (pt-4) */}
      {user && userStatus && (
        <GlobalProgressMap 
          playedContinents={userStatus.continent_list ?? []}
          playedCountries={userStatus.country_list ?? []}
          mapView={metric}
          seasonColor={seasonThemeColor}
        />
      )}

      {/* 2. Continents Achievement Banner */}
      {user && userStatus && (
        <div>
          <GlobalGolfersMapStatsRow
            continentsPlayed={continentsPlayed}
            continentsTotal={6}
            countriesPlayed={countriesPlayed}
            viewMode={metric}
            onViewModeChange={setMetric}
            seasonColor={seasonThemeColor}
          />
        </div>
      )}

      {/* 3. Scope Selector */}
      <div className="flex justify-center">
        <LeaderboardScopeSelector value={scope} onChange={setScope} showClub={false} showCountry={false} />
      </div>


      {/* Initial error */}
      {isError && allEntries.length === 0 && !isLoading && (
        <div>
          <InitialErrorState onRetry={() => refetch()} />
        </div>
       )}

      {/* Initial loading */}
      {isLoading ? (
        <LeaderboardLoading />
      ) : !isError && allEntries.length === 0 ? (
        <LeaderboardEmpty
          title="No explorers yet"
          description={
            scope === 'club' && selectedClubName
              ? `No clbhouz golfers found for ${selectedClubName} yet`
              : scope === 'friends'
              ? "None of your friends have explored yet"
              : "Rate courses in different countries to appear here!"
          }
        />
      ) : allEntries.length > 0 ? (
        <div>
          {/* Podium */}
          <ExplorationPodium 
            entries={podiumEntries} 
            metric={metric}
            currentUserId={user?.id}
            seasonColor={seasonThemeColor}
          />

          {/* Rankings List */}
          <div ref={listContainerRef} className="flex flex-col">
            {virtualizedContent ? (
              <div style={{ height: virtualizedContent.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${virtualizedContent.offsetY}px)`, position: 'absolute', width: '100%' }}>
                  {allEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map((entry, i) =>
                    renderEntry(entry, virtualizedContent.startIndex + i)
                  )}
                </div>
              </div>
            ) : (
              allEntries.map((entry, i) => renderEntry(entry, i))
            )}
          </div>

          {/* Sentinel + loading skeleton */}
          {hasNextPage && !isError && (
            <div ref={sentinelRef}>
              {isFetchingNextPage && <ExplorationLeaderboardSkeleton />}
            </div>
          )}

          {/* Inline retry on pagination error */}
          {isError && !isFetchingNextPage && allEntries.length > 0 && (
            <InlineRetryCard onRetry={() => fetchNextPage()} />
          )}

          {/* Loading indicator during retry */}
          {isError && isFetchingNextPage && allEntries.length > 0 && (
            <ExplorationLeaderboardSkeleton />
          )}
        </div>
      ) : null}

    </div>
  );
}
