import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExplorationLeaderboard, useUserExplorationStatus } from '@/hooks/leaderboards';
import { supabase } from '@/integrations/supabase/client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
} from '../shared';
import { CountrySelector } from '../shared/CountrySelector';
import { ExplorationPodium } from './ExplorationPodium';
import { MiniGlobePreview } from './MiniGlobePreview';
import { GlobalGolfersMapStatsRow } from './GlobalGolfersMapStatsRow';
import { ClubSearchBar } from './ClubSearchBar';
import { usePlayedCourseCoordinates } from '@/hooks/usePlayedCourseCoordinates';
import { ContinentBreakdownGrid } from './ContinentBreakdownGrid';
import { ExplorerTierCard } from './ExplorerTierCard';
import { CountryLeaderboard } from './CountryLeaderboard';
import CountryFlag from '@/components/ui/country-flag';
import { getUserTier, getNextTier, EXPLORER_TIERS } from '@/config/explorerTiers';
import { useSeasonCalendar } from '@/hooks/championship';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';
import type { LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

// --- Constants ---
const ROW_HEIGHT = 72;
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;
const STORAGE_KEY_SCROLL = 'exploration-leaderboard-scroll';
const STORAGE_KEY_FILTERS = 'exploration-leaderboard-filters';

// --- Skeletons ---
function ExplorationLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-6 rounded" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function ExplorationPageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ background: 'linear-gradient(160deg, #1a1a2e, #2d1f3d, #1f1535)', padding: '16px 16px 0' }}>
        <Skeleton className="h-3 w-52 rounded mb-4" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Skeleton className="w-[52px] h-[52px] rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-3 w-28 rounded mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Skeleton className="h-6 w-24 rounded" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <Skeleton className="h-5 w-28 rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>
          </div>
          <Skeleton className="h-10 w-12 rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-[10px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-t-[8px]" style={{ background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }} />
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton className="h-16 w-full rounded-[14px]" />
        <Skeleton className="h-20 w-full rounded-[14px]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: '#FFFFFF', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)',
          }}>
            <Skeleton className="w-5 h-4 rounded" />
            <Skeleton className="w-11 h-11 rounded-lg" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton className="h-4 rounded" style={{ width: `${[70, 55, 65, 50, 60][i]}%` }} />
              <Skeleton className="h-3 rounded" style={{ width: `${[45, 40, 50, 35, 45][i]}%` }} />
            </div>
            <Skeleton className="h-6 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineRetryCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 px-3">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted text-sm text-muted-foreground active:scale-[0.98] active:opacity-70 transition-all"
      >
        Couldn't load more golfers · Tap to retry
      </button>
    </div>
  );
}

function InitialErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-3 text-center space-y-4">
      <p className="text-muted-foreground text-sm">Something went wrong loading the leaderboard.</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97] active:opacity-90 transition-all"
      >
        Try again
      </button>
    </div>
  );
}

// --- Filter persistence ---
function loadSavedFilters() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

const MAX_FLAGS = 7;

export function ExplorationTab() {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const savedFilters = useRef(loadSavedFilters()).current;

  const seasonThemeColor = '#f59e0b';

  const [scope, setScope] = useState<LeaderboardScope>(() => savedFilters?.scope ?? 'global');
  const [metric, setMetric] = useState<ExplorationMetric>(() => savedFilters?.metric ?? 'countries');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => savedFilters?.selectedClubId ?? null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(() => savedFilters?.selectedClubName ?? null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => savedFilters?.selectedCountry ?? null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'player' | 'country'>(() => savedFilters?.viewMode ?? 'player');
  const [activeContinent, setActiveContinent] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const scrollPositionRef = useRef(0);
  const isFilterChangeRef = useRef(false);

  // Season config
  const { data: seasonCalendar } = useSeasonCalendar();
  const currentSeasonId = useMemo(() => {
    const current = seasonCalendar?.find(s => s.is_current);
    if (!current) return 'major' as SeasonId;
    const lower = current.name.toLowerCase();
    if (lower.includes('pre')) return 'preseason' as SeasonId;
    if (lower.includes('summer')) return 'summer' as SeasonId;
    if (lower.includes('off')) return 'offseason' as SeasonId;
    return 'major' as SeasonId;
  }, [seasonCalendar]);

  // Save filters
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
      scope, metric, selectedClubId, selectedClubName, selectedCountry, viewMode,
    }));
    isFilterChangeRef.current = true;
    scrollPositionRef.current = (() => {
      const rootEl = document.getElementById('root');
      return (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    })();
  }, [scope, metric, selectedClubId, selectedClubName, selectedCountry, viewMode]);

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

  // Scroll tracking
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

  useEffect(() => {
    if (scope !== 'country') setSelectedCountry(null);
  }, [scope]);

  // Fetch user's home club + country
  const [userCountry, setUserCountry] = useState<string | null>(null);
  useEffect(() => {
    async function fetchUserHomeClub() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country, golf_clubs!user_profiles_primary_club_id_fkey(name, country)')
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
      const clubCountry = (data?.golf_clubs as any)?.country;
      setUserCountry(clubCountry || data?.country || null);
    }
    fetchUserHomeClub();
  }, [user?.id]);

  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  useEffect(() => {
    if (scope === 'country' && !selectedCountry && userCountry) {
      setSelectedCountry(userCountry);
    }
  }, [scope, selectedCountry, userCountry]);

  const {
    data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch,
  } = useExplorationLeaderboard({
    scope, metric,
    clubId: scope === 'club' ? selectedClubId : null,
    country: scope === 'country' ? selectedCountry : null,
  });

  const allEntries = useMemo(
    () => data?.pages.flatMap(page => page.entries) ?? [],
    [data?.pages]
  );

  const { data: userStatus } = useUserExplorationStatus({ userId: user?.id });
  const { data: playedCoordinates } = usePlayedCourseCoordinates(user?.id);

  const handleExploreMap = useCallback(() => {
    navigate('/top100?view=map');
  }, [navigate]);

  const currentUserEntry = useMemo(
    () => allEntries.find(e => e.user_id === user?.id) ?? null,
    [allEntries, user?.id]
  );

  const [currentUserProfile, setCurrentUserProfile] = useState<{
    display_name: string | null;
    profile_photo_url: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setCurrentUserProfile(data);
    }
    fetchProfile();
  }, [user?.id]);

  const filteredEntries = useMemo(() => {
    if (!activeContinent) return allEntries;
    return allEntries.filter(e => e.continent_list?.includes(activeContinent));
  }, [allEntries, activeContinent]);

  const continentsPlayed = userStatus?.continent_list?.filter(c => c !== 'Antarctica').length ?? 0;
  const countriesPlayed = userStatus?.countries_count ?? 0;
  const coursesPlayed = currentUserEntry?.courses_count ?? 0;
  const userTier = useMemo(() => getUserTier(countriesPlayed, continentsPlayed), [countriesPlayed, continentsPlayed]);
  const nextTier = useMemo(() => getNextTier(userTier.id), [userTier.id]);
  const userRank = currentUserEntry?.rank ?? userStatus?.global_rank ?? null;

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

  // Infinite scroll
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) fetchNextPage();
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const handleEntryClick = useCallback(() => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
  }, []);

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  const getMetricValue = (entry: any) => {
    switch (metric) {
      case 'continents': return entry.continents_count;
      case 'courses': return entry.courses_count;
      default: return entry.countries_count;
    }
  };

  const getPodiumRingColor = (rank: number): string | null => {
    switch (rank) {
      case 1: return 'hsl(var(--accent-amber))';
      case 2: return '#B8C6C9';
      case 3: return '#C4956A';
      default: return null;
    }
  };

  const podiumEntries = filteredEntries.slice(0, 3);

  // Virtualization
  const virtualizedContent = useMemo(() => {
    if (filteredEntries.length <= VIRTUALIZATION_THRESHOLD) return null;
    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);
    const viewportHeight = window.innerHeight;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(filteredEntries.length, startIndex + visibleCount);
    const totalHeight = filteredEntries.length * ROW_HEIGHT;
    const offsetY = startIndex * ROW_HEIGHT;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [filteredEntries.length, scrollTop]);

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
        <div>
          <LeaderboardStat value={getMetricValue(entry)} seasonColor={seasonThemeColor} />
        </div>
      </LeaderboardRow>
    </div>
  );

  // Tier progress
  const tierProgress = nextTier
    ? Math.min((countriesPlayed / nextTier.minCountries) * 100, 100)
    : 100;

  // Country list for flag passport
  const countryList = userStatus?.country_list ?? [];
  const flagsToShow = countryList.slice(0, MAX_FLAGS);

  // Initial loading
  if (isLoading && allEntries.length === 0) {
    return <ExplorationPageSkeleton />;
  }

  // Initial error
  if (isError && allEntries.length === 0 && !isLoading) {
    return <InitialErrorState onRetry={() => refetch()} />;
  }

  const hasUserData = user && userStatus && (countriesPlayed > 0 || coursesPlayed > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── DARK HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #2d1f3d 60%, #1f1535 100%)',
        padding: 'clamp(14px,3vw,18px) clamp(14px,4vw,18px) 0',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(247,147,30,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(247,147,30,0.04)', pointerEvents: 'none' }} />

        {/* Season label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'clamp(8px,2vw,12px)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(9px,2.5vw,11px)', fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Explorer Rankings · {getSeasonConfig(currentSeasonId).title}
          </span>
        </div>

        {/* Identity band — avatar, tier pill, progress bar, rank */}
        {hasUserData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(12px,3vw,16px)' }}>
            {/* Avatar */}
            {currentUserProfile?.profile_photo_url ? (
              <img
                src={currentUserProfile.profile_photo_url}
                alt=""
                style={{ width: 52, height: 52, borderRadius: '34%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: '34%', background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {(currentUserProfile?.display_name || '?').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Tier status + progress */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px,2.8vw,12px)', fontWeight: 500, fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 2 }}>
                Your Explorer Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Tier pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${userTier.color}22`, borderRadius: 8, padding: '3px 10px' }}>
                  <span style={{ fontSize: 13 }}>{userTier.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: userTier.color }}>{userTier.name}</span>
                </div>
              </div>
              {/* Progress bar to next tier */}
              {nextTier && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tierProgress}%`, background: userTier.color, borderRadius: 999, transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                    {countriesPlayed}/{nextTier.minCountries} → {nextTier.icon}
                  </span>
                </div>
              )}
            </div>

            {/* Rank */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px,2.4vw,10px)', fontWeight: 500, fontFamily: "'DM Sans', system-ui, sans-serif", textTransform: 'uppercase' }}>
                Global rank
              </span>
              <span style={{ color: '#fff', fontSize: 'clamp(22px,6vw,28px)', fontWeight: 900, fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1 }}>
                #{userRank ?? '—'}
              </span>
            </div>
          </div>
        )}

        {/* Stat pills row */}
        {hasUserData && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { val: coursesPlayed, label: 'Courses', icon: '⛳' },
              { val: countriesPlayed, label: 'Countries', icon: '🌍' },
              { val: continentsPlayed, label: 'Continents', icon: '🗺️' },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center', padding: '8px 4px',
                background: 'rgba(255,255,255,0.08)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#F7931E', lineHeight: 1.2 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* By Player / By Country tabs — flush to bottom */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { id: 'player' as const, label: '👤 By Player' },
            { id: 'country' as const, label: '🌍 By Country' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setViewMode(t.id)}
              style={{
                flex: 1, padding: 'clamp(8px,2vw,10px) 0', borderRadius: '8px 8px 0 0',
                border: 'none', cursor: 'pointer',
                fontSize: 'clamp(11px,3vw,13px)',
                fontWeight: viewMode === t.id ? 800 : 500,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                background: viewMode === t.id ? '#F8FAFC' : 'rgba(255,255,255,0.07)',
                color: viewMode === t.id ? '#0C0C0E' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s',
              }}
              className="active:scale-[0.97] transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIGHT BODY ZONE ── */}
      <div style={{ background: '#F8FAFC', flex: 1, padding: 'clamp(12px,3vw,16px)' }}>

        {/* Scope selector (player mode only) */}
        {viewMode === 'player' && (
          <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 3, marginBottom: 12 }}>
            {[
              { id: 'global' as const, label: '🌍 Global' },
              { id: 'friends' as const, label: '👥 Friends' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setScope(t.id)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: scope === t.id ? 800 : 500,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  background: scope === t.id ? '#FFFFFF' : 'none',
                  color: scope === t.id ? '#0C0C0E' : '#6B7280',
                  boxShadow: scope === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Countries Played — Flag passport card */}
        {hasUserData && countryList.length > 0 && (
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: '12px 14px', marginBottom: 12,
            border: '1px solid rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Countries Played
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {flagsToShow.map(country => (
                <div
                  key={country}
                  style={{
                    width: 34, height: 24, borderRadius: 5,
                    background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <CountryFlag country={country} size="sm" />
                </div>
              ))}
              {countryList.length > MAX_FLAGS && (
                <div style={{
                  width: 34, height: 24, borderRadius: 5,
                  border: '1.5px dashed rgba(245,166,35,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#F5A623',
                }}>
                  +{countryList.length - MAX_FLAGS}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tier progress — compact ladder + milestone card */}
        {hasUserData && (
          <ExplorerTierCard
            tier={userTier}
            nextTier={nextTier}
            countriesCount={countriesPlayed}
            continentsCount={continentsPlayed}
          />
        )}

        {/* Empty state */}
        {!isError && allEntries.length === 0 && !isLoading && (
          <LeaderboardEmpty
            title="No explorers yet"
            description={
              scope === 'friends'
                ? "None of your friends have explored yet"
                : "Rate courses in different countries to appear here!"
            }
          />
        )}

        {/* Content based on view mode */}
        {allEntries.length > 0 && (
          viewMode === 'player' ? (
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
                      {filteredEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map((entry, i) =>
                        renderEntry(entry, virtualizedContent.startIndex + i)
                      )}
                    </div>
                  </div>
                ) : (
                  filteredEntries.map((entry, i) => renderEntry(entry, i))
                )}
              </div>

              {hasNextPage && !isError && (
                <div ref={sentinelRef}>
                  {isFetchingNextPage && <ExplorationLeaderboardSkeleton />}
                </div>
              )}

              {isError && !isFetchingNextPage && allEntries.length > 0 && (
                <InlineRetryCard onRetry={() => fetchNextPage()} />
              )}

              {isError && isFetchingNextPage && allEntries.length > 0 && (
                <ExplorationLeaderboardSkeleton />
              )}
            </div>
          ) : (
            <CountryLeaderboard
              entries={allEntries}
              seasonColor={seasonThemeColor}
            />
          )
        )}
      </div>
    </div>
  );
}
