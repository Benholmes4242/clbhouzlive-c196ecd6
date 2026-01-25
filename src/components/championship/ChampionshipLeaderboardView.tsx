import React, { useState, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
  useDivisionConfig,
  useSeasonCalendar,
} from '@/hooks/championship';
import {
  ChampionshipFilters,
  ChampionshipFeedback,
  getContextualFeedback,
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
import { LeaderboardRowV3 } from './LeaderboardRowV3';
import { RankCelebration } from './RankCelebration';
import { PromotionStatusBanner } from './PromotionStatusBanner';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import type { ChampionshipArenaMode, DivisionSlug, UserRival } from '@/types/championship';
import { DIVISION_ORDER, getDivisionIndex } from '@/types/championship';
import type { TimeFilter, PodiumScope } from '@/types/podium';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TIER_CONFIG, getTierLevel } from '@/lib/clbhouzAchievementPalette';

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

  // Scroll position preservation refs for filter changes
  const scrollPositionRef = useRef<number>(0);
  const isFilterChangeRef = useRef<boolean>(false);

  // Convert arenaMode to PodiumScope
  const podiumScope: PodiumScope = arenaMode === 'nearby' ? 'nearby' : arenaMode;
  const podiumMode = timeFilter === 'seasonal' ? 'seasonal' : 'all_time';

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
    currentUserId: userId,
    enabled: timeFilter === 'seasonal' && podiumScope !== 'nearby',
  });

  const { data: allTimePodiumData } = usePodiumAllTime({
    scope: podiumScope,
    currentUserId: userId,
    enabled: timeFilter === 'all_time' && podiumScope !== 'nearby',
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

  // Calculate contextual feedback
  const feedback = useMemo(() => {
    if (!userStatus) return null;
    return getContextualFeedback(
      userStatus.current_rank,
      userStatus.courses_this_season,
      userStatus.days_remaining,
      userStatus.zone
    );
  }, [userStatus]);

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
    <div className={cn('flex flex-col space-y-4 pb-24', className)}>
      {/* 1. Season Status Panel (replaces old SeasonHubBanner) */}
      {currentSeason && (
        <SeasonStatusPanel
          currentSeasonId={currentSeasonId}
          daysRemaining={currentSeason.days_remaining ?? 0}
          progressPercent={progressPercent}
          seasonData={seasonData}
          isLoading={!seasonCalendar}
          onSeasonClick={(id) => console.log('Season chip clicked:', id)}
        />
      )}

      {/* 2. Time Filter Toggle - Compact */}
      <div className="mb-4">
        <TimeModeToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* 3. Podium - Show Trophy Podium for seasonal, Hall of Fame for all-time */}
      {podiumScope !== 'nearby' && (
        <div className="overflow-visible">
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
      )}

      {/* 4. Promotion Status Banner - Only show in Season mode */}
      {timeFilter === 'seasonal' && userStatus && (
        <div className="px-3">
          <PromotionStatusBanner
            isInPromotionZone={userStatus.zone === 'promotion'}
            distanceToPromotion={userStatus.courses_to_next_division}
            justPromotedRecently={false}
            newDivisionName={undefined}
          />
        </div>
      )}

      {/* 5. Beat Rival CTA */}
      {closestRivalAhead && (
        <BeatRivalCTA 
          rival={closestRivalAhead} 
          onLogCourse={handleLogCourse} 
        />
      )}

      {/* 6. Division Ladder (collapsible) */}
      {divisionLadderData.length > 0 && userStatus && (
        <Collapsible open={showDivisionLadder} onOpenChange={setShowDivisionLadder}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full px-3">
            {showDivisionLadder ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showDivisionLadder ? 'Hide Division Ladder' : 'Show Division Ladder'}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-3">
            <DivisionLadderPanel
              divisions={divisionLadderData}
              userCourses={userStatus.courses_this_season}
              coursesToNext={nextDivision.coursesToNext}
              nextDivisionName={nextDivision.name}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 7. Contextual Feedback - Only show in Season mode */}
      {timeFilter === 'seasonal' && feedback && (
        <div className="px-3">
          <ChampionshipFeedback
            type={feedback.type}
            message={feedback.message}
          />
        </div>
      )}

      {/* 8. Filters */}
      <div className="px-3">
        <ChampionshipFilters
          arenaMode={arenaMode}
          divisionFilter={divisionFilter}
          onArenaModeChange={handleArenaModeChange}
          onDivisionFilterChange={handleDivisionFilterChange}
        />
      </div>

      {/* 9. Leaderboard List - V3 Rows with scroll anchoring */}
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
            <div key={i} className="py-3 px-3 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-11 h-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="w-8 h-8 bg-muted rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No players found</p>
          </div>
        ) : (
          // Always keep list in DOM to prevent scroll jump on filter change
          <div className={cn('transition-opacity duration-150', leaderboardLoading && 'opacity-60')}>
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
            className="w-full py-4 text-sm text-primary font-medium hover:bg-muted/30 transition-colors rounded-xl"
          >
            {leaderboardLoading ? 'Loading...' : 'Load more'}
          </button>
        ) : entries.length > 0 ? (
          <div className="w-full py-6 text-center">
            <p className="text-sm text-[#94A3B8]">You've reached the end</p>
          </div>
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
    </div>
  );
}
