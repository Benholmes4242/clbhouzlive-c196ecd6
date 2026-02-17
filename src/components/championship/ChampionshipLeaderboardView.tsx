import React, { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronUp, Users, Building2 } from 'lucide-react';

import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
  useDivisionConfig,
  useSeasonCalendar,
} from '@/hooks/championship';
import {
  ChampionshipFilters,
  BeatRivalCTA,
  RivalVersusPanel,
} from './modules';
import { TrophyPodium } from './podium/TrophyPodium';
import { HallOfFamePodium } from './podium/HallOfFamePodium';
import { usePodiumSeasonal } from '@/hooks/championship/usePodiumSeasonal';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import { SeasonStatusPanel } from './season-status';
import { TimeModeToggle } from './TimeModeToggle';
import { DivisionLadderPanel } from './DivisionLadderPanel';
import { DivisionProgressPreview } from './DivisionProgressPreview';
import { LeaderboardRowV3 } from './LeaderboardRowV3';
import { RankCelebration } from './RankCelebration';
import { MotivationalCarousel } from './MotivationalCarousel';
import { HallOfFameHeader } from './HallOfFameHeader';
import { ClubSearchBar } from '@/components/leaderboards/exploration/ClubSearchBar';
import { CountrySelector } from '@/components/leaderboards/shared/CountrySelector';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import type { ChampionshipArenaMode, DivisionSlug, UserRival } from '@/types/championship';
import { DIVISION_ORDER, getDivisionIndex } from '@/types/championship';
import type { TimeFilter, PodiumScope } from '@/types/podium';
import { TIER_CONFIG } from '@/lib/clbhouzAchievementPalette';
import { supabase } from '@/integrations/supabase/client';

interface ChampionshipLeaderboardViewProps {
  className?: string;
}

/**
 * ChampionshipLeaderboardView - Main orchestrator for Championship Mode.
 * Simplified version with SeasonHubBanner, SimplePodium, and LeaderboardRowV3.
 */
export function ChampionshipLeaderboardView({ className }: ChampionshipLeaderboardViewProps) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const userId = user?.id;

  // Filter state
  const [arenaMode, setArenaMode] = useState<ChampionshipArenaMode>('global');
  const [divisionFilter, setDivisionFilter] = useState<DivisionSlug | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'seasonal' | 'all_time'>('seasonal');
  
  // UI state
  const [showDivisionLadder, setShowDivisionLadder] = useState(false);
  const [selectedRival, setSelectedRival] = useState<UserRival | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Club-related state
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  
  // Country-related state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Scroll position preservation refs for filter changes
  const scrollPositionRef = useRef<number>(0);
  const isFilterChangeRef = useRef<boolean>(false);

  // Fetch user's home club
  useEffect(() => {
    const fetchUserHomeClub = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('primary_club_id, golf_clubs!user_profiles_primary_club_id_fkey(id, name)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user home club:', error);
        return;
      }

      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        const clubData = Array.isArray(data.golf_clubs) ? data.golf_clubs[0] : data.golf_clubs;
        setUserHomeClubName(clubData?.name || null);
      }
    };

    fetchUserHomeClub();
  }, [userId]);

  // Auto-select home club when switching to club mode
  useEffect(() => {
    if (arenaMode === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [arenaMode, selectedClubId, userHomeClubId, userHomeClubName]);

  // Clear country when switching away from country mode
  useEffect(() => {
    if (arenaMode !== 'country') {
      setSelectedCountry(null);
    }
  }, [arenaMode]);

  // Handle club selection
  const handleClubSelect = useCallback((clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  }, []);

  // Convert arenaMode to PodiumScope
  const podiumScope: PodiumScope = arenaMode;
  const podiumMode = timeFilter === 'seasonal' ? 'seasonal' : 'all_time';

  // Compute clubId for queries - only pass when in club mode
  const queryClubId = arenaMode === 'club' ? selectedClubId : null;
  // Compute country for queries - only pass when in country mode
  const queryCountry = arenaMode === 'country' ? selectedCountry : null;

  // Data fetching
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    hasNextPage,
    fetchNextPage,
  } = useChampionshipLeaderboard({
    arenaMode,
    divisionFilter,
    timeFilter,
    clubId: queryClubId,
    country: queryCountry,
    pageSize: 50,
  });

  const { data: userStatus, isLoading: statusLoading } = useUserChampionshipStatus(userId);
  const { data: rivals, isLoading: rivalsLoading } = useUserRivals(userId, 5);
  const { data: divisions } = useDivisionConfig();
  const { data: seasonCalendar } = useSeasonCalendar();

  // Podium data fetching
  const { data: seasonalPodiumData } = usePodiumSeasonal({
    scope: podiumScope,
    divisionId: divisionFilter !== 'all' ? divisionFilter : undefined,
    clubId: queryClubId,
    country: queryCountry,
    currentUserId: userId,
    enabled: timeFilter === 'seasonal',
  });

  const { data: allTimePodiumData } = usePodiumAllTime({
    scope: podiumScope,
    clubId: queryClubId,
    country: queryCountry,
    currentUserId: userId,
    enabled: timeFilter === 'all_time',
  });

  // Transform podium data for TrophyPodium
  const podiumEntries = useMemo(() => {
    if (timeFilter !== 'seasonal' || !seasonalPodiumData) return [];
    return seasonalPodiumData;
  }, [timeFilter, seasonalPodiumData]);

  // Flatten paginated entries
  const entries = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.entries) ?? [];
  }, [leaderboardData]);

  // Get current season from calendar
  const currentSeason = useMemo(() => {
    return seasonCalendar?.find(s => s.is_current) ?? null;
  }, [seasonCalendar]);

  // Map season name to SeasonId for the new SeasonStatusPanel
  const mapToSeasonId = (name: string): SeasonId => {
    const lower = name.toLowerCase();
    if (lower.includes('pre-season') || lower.includes('preseason') || lower.includes('training')) return 'preseason';
    if (lower.includes('major')) return 'major';
    if (lower.includes('summer')) return 'summer';
    if (lower.includes('off-season') || lower.includes('offseason')) return 'offseason';
    return 'preseason';
  };

  // Prepare data for SeasonStatusPanel
  const currentSeasonId = useMemo<SeasonId>(() => {
    if (!currentSeason) return 'preseason';
    return mapToSeasonId(currentSeason.name);
  }, [currentSeason]);

  // Get current season theme color for podium (must be after currentSeasonId)
  const seasonThemeColor = useMemo(() => {
    const config = getSeasonConfig(currentSeasonId);
    return config.themeColor;
  }, [currentSeasonId]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!currentSeason) return 0;
    const startDate = new Date(currentSeason.start_date);
    const endDate = new Date(currentSeason.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = currentSeason.days_remaining ?? 0;
    return daysRemaining > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100;
  }, [currentSeason]);

  // Build seasonData for chips (days until available for locked seasons)
  const seasonData = useMemo<Record<SeasonId, { daysUntilAvailable?: number }>>(() => {
    const data: Record<SeasonId, { daysUntilAvailable?: number }> = {
      preseason: {},
      major: {},
      summer: {},
      offseason: {},
    };
    
    if (!seasonCalendar) return data;
    
    seasonCalendar.forEach(s => {
      const id = mapToSeasonId(s.name);
      if (s.days_until_start && s.days_until_start > 0) {
        data[id].daysUntilAvailable = s.days_until_start;
      }
    });
    
    return data;
  }, [seasonCalendar]);

  // Calculate motivational carousel data
  const currentUserEntry = useMemo(() => {
    return entries.find(e => e.is_current_user) || null;
  }, [entries]);

  const currentRank = currentUserEntry?.current_rank || null;
  const isInTop10 = currentRank !== null && currentRank <= 10;
  const isInTop3 = currentRank !== null && currentRank <= 3;

  // Note: Friend ahead/behind data not available in current entry type
  // Can be extended later when is_friend is added to the leaderboard entries
  const friendAhead = null;
  const friendBehind = null;

  // Get closest rival who is ahead
  const closestRivalAhead = useMemo(() => {
    if (!rivals?.length) return null;
    return rivals.find(r => r.gap > 0) || null;
  }, [rivals]);

  const handleLogCourse = () => {
    navigate('/courses');
  };

  const handleUserClick = (clickedUserId: string) => {
    navigate(`/golfer/${clickedUserId}`);
  };

  // Scroll-preserving filter handlers - capture scroll before state change
  const handleArenaModeChange = useCallback((mode: ChampionshipArenaMode) => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setArenaMode(mode);
  }, []);

  const handleDivisionFilterChange = useCallback((filter: DivisionSlug | 'all') => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setDivisionFilter(filter);
  }, []);

  // Restore scroll position after filter change and re-render
  useLayoutEffect(() => {
    if (isFilterChangeRef.current) {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        // Use rAF to ensure DOM has updated before restoring scroll
        requestAnimationFrame(() => {
          rootEl.scrollTop = scrollPositionRef.current;
        });
      }
      isFilterChangeRef.current = false;
    }
  }, [arenaMode, divisionFilter, entries]);

  // Scroll-to-top FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Build division ladder data
  const divisionLadderData = useMemo(() => {
    if (!divisions || !userStatus) return [];
    
    const currentIndex = getDivisionIndex(userStatus.division_slug);
    
    return divisions
      .sort((a, b) => a.tier_order - b.tier_order)
      .map((div, index) => {
        let status: 'locked' | 'current' | 'next' | 'completed' = 'locked';
        if (index < currentIndex) status = 'completed';
        else if (index === currentIndex) status = 'current';
        else if (index === currentIndex + 1) status = 'next';
        
        return {
          id: div.id,
          name: div.name,
          threshold: div.min_courses,
          color: div.color_hex,
          status,
        };
      });
  }, [divisions, userStatus]);

  // Get next division info
  const nextDivision = useMemo(() => {
    if (!userStatus) return { name: 'Next Division', coursesToNext: 0 };
    const currentIndex = getDivisionIndex(userStatus.division_slug);
    const nextSlug = DIVISION_ORDER[currentIndex + 1];
    const tierValues = Object.values(TIER_CONFIG);
    const nextConfig = nextSlug 
      ? tierValues.find(t => t.name?.toLowerCase().includes(nextSlug.replace('-club', '').replace('_', ' ')))
      : null;
    return {
      name: nextConfig?.name || 'Max Division',
      coursesToNext: userStatus.courses_to_next_division || 0,
    };
  }, [userStatus]);

  return (
    <div className={cn('flex flex-col px-4 py-4 space-y-6 pb-24', className)}>
      {/* 1. Season Status Panel - Only show in seasonal mode */}
      {timeFilter === 'seasonal' && currentSeason && (
        <SeasonStatusPanel
          currentSeasonId={currentSeasonId}
          daysRemaining={currentSeason.days_remaining ?? 0}
          progressPercent={progressPercent}
          seasonData={seasonData}
          isLoading={!seasonCalendar}
          onSeasonClick={(id) => console.log('Season chip clicked:', id)}
        />
      )}

      {/* 2. Time Filter Toggle - Centered */}
      <div className="flex justify-center">
        <TimeModeToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* 3. Podium - Show Trophy Podium for seasonal, Hall of Fame for all-time */}
      <div className="overflow-visible pt-2">
        {timeFilter === 'seasonal' && podiumEntries.length > 0 && (
          <TrophyPodium
            entries={podiumEntries}
            seasonThemeColor={seasonThemeColor}
            currentUserId={userId}
            onUserClick={handleUserClick}
          />
        )}
        {timeFilter === 'all_time' && allTimePodiumData && allTimePodiumData.length > 0 && (
          <HallOfFamePodium
            entries={allTimePodiumData}
            currentUserId={userId}
            onUserClick={handleUserClick}
          />
        )}
      </div>

      {/* 4. Beat Rival CTA */}
      {closestRivalAhead && (
        <BeatRivalCTA 
          rival={closestRivalAhead} 
          onLogCourse={handleLogCourse} 
        />
      )}

      {/* 5. Division Progress Preview & Ladder (collapsible) - Only in seasonal mode */}
      {timeFilter === 'seasonal' && divisionLadderData.length > 0 && userStatus && (
        <>
          <DivisionProgressPreview
            currentDivision={divisionLadderData.find(d => d.status === 'current') || null}
            nextDivision={divisionLadderData.find(d => d.status === 'next') || null}
            coursesToNext={userStatus.courses_to_next_division || 0}
            userCourses={userStatus.courses_this_season || 0}
            isExpanded={showDivisionLadder}
            onToggle={() => setShowDivisionLadder(!showDivisionLadder)}
            totalDivisions={divisionLadderData.length}
            completedCount={divisionLadderData.filter(d => d.status === 'completed').length}
          />
          
          {/* Full Division Ladder (expandable) */}
          {showDivisionLadder && (
            <DivisionLadderPanel
              divisions={divisionLadderData}
              userCourses={userStatus.courses_this_season}
              coursesToNext={nextDivision.coursesToNext}
              nextDivisionName={nextDivision.name}
            />
          )}
        </>
      )}

      {/* 6. Motivational Carousel - Only show in Season mode */}
      {timeFilter === 'seasonal' && currentUserEntry && (
        <MotivationalCarousel
          currentRank={currentRank}
          totalPlayers={entries.length}
          coursesThisSeason={currentUserEntry.courses_this_season}
          friendAhead={friendAhead ? {
            name: friendAhead.display_name?.split(' ')[0] || 'Friend',
            rank: friendAhead.current_rank,
            coursesAhead: friendAhead.courses_this_season - currentUserEntry.courses_this_season,
          } : null}
          friendBehind={friendBehind ? {
            name: friendBehind.display_name?.split(' ')[0] || 'Friend',
            rank: friendBehind.current_rank,
            coursesBehind: currentUserEntry.courses_this_season - friendBehind.courses_this_season,
          } : null}
          rivalAhead={closestRivalAhead ? {
            name: closestRivalAhead.display_name?.split(' ')[0] || 'Rival',
            rank: closestRivalAhead.current_rank ?? 0,
            coursesAhead: closestRivalAhead.gap ?? 0,
          } : null}
          coursesToNextRank={userStatus?.courses_to_next_division}
          isInTop10={isInTop10}
          isInTop3={isInTop3}
          streak={undefined}
        />
      )}

      {/* 7. Filters - Scope Toggle */}
      <div className="w-full">
        <ChampionshipFilters
          arenaMode={arenaMode}
          divisionFilter={divisionFilter}
          onArenaModeChange={handleArenaModeChange}
          onDivisionFilterChange={handleDivisionFilterChange}
        />
      </div>

      {/* 8. Club Search Bar (only when club mode is active) */}
      {arenaMode === 'club' && (
        <ClubSearchBar
          selectedClubId={selectedClubId}
          selectedClubName={selectedClubName}
          userHomeClubId={userHomeClubId}
          userHomeClubName={userHomeClubName}
          onClubSelect={handleClubSelect}
        />
      )}

      {/* 8b. Country Selector (only when country mode is active) */}
      {arenaMode === 'country' && (
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
        />
      )}
      <div className="min-h-[400px] relative" style={{ overflowAnchor: 'auto' }}>
        {/* Loading overlay - doesn't unmount the list */}
        {leaderboardLoading && entries.length > 0 && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center py-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm border border-border/50">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Updating...</span>
            </div>
          </div>
        )}
        
        {leaderboardLoading && entries.length === 0 ? (
          // Initial loading skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="py-3 px-4 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-11 h-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="w-8 h-8 bg-muted rounded" />
            </div>
          ))
        ) : entries.length === 0 && !leaderboardLoading ? (
          // Contextual empty states based on arena mode
          arenaMode === 'friends' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No friends yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Follow golfers to see them on your friends leaderboard
              </p>
            </div>
          ) : arenaMode === 'club' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No club members found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                No members from this club have joined the championship yet
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No players found</p>
            </div>
          )
        ) : (
          // Leaderboard List with space-y-2 between rows
          <div className={cn('transition-opacity duration-150 space-y-2', leaderboardLoading && 'opacity-60')}>
            {entries.map((entry) => (
              <LeaderboardRowV3
                key={entry.user_id}
                rank={entry.current_rank}
                name={entry.display_name}
                avatarUrl={entry.avatar_url}
                homeClubName={entry.home_club}
                courses={entry.courses_this_season}
                isCurrentUser={entry.is_current_user}
                onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
              />
            ))}
          </div>
        )}
        
        {/* Load more / End of list indicator */}
        {hasNextPage ? (
          <button
            onClick={() => fetchNextPage()}
            disabled={leaderboardLoading}
            className="w-full py-4 text-sm text-primary font-medium hover:bg-muted/30 active:scale-[0.98] transition-all rounded-xl"
          >
            {leaderboardLoading ? 'Loading...' : 'Load more'}
          </button>
        ) : entries.length > 0 ? (
          /* 10. End of List */
          <p className="text-center text-sm text-muted-foreground py-4">
            You've reached the end
          </p>
        ) : null}
      </div>

      {/* Rival Versus Panel (drawer) */}
      {userStatus && selectedRival && (
        <RivalVersusPanel
          isOpen={!!selectedRival}
          onClose={() => setSelectedRival(null)}
          rival={selectedRival}
          userStatus={userStatus}
        />
      )}

      {/* Rank Celebration */}
      {previousRank && userStatus && (
        <RankCelebration 
          previousRank={previousRank}
          currentRank={userStatus.current_rank}
          show={showCelebration}
          onComplete={() => {
            setShowCelebration(false);
            setPreviousRank(null);
          }}
        />
      )}

      {/* Scroll to Top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          "fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full",
          "bg-foreground/80 text-background shadow-lg backdrop-blur-sm",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out active:scale-[0.95]",
          showScrollTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
