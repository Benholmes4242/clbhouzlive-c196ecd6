import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
import { SimplePodium } from './podium/SimplePodium';
import { TimeFilterToggle } from './podium';
import { usePodiumSeasonal } from '@/hooks/championship/usePodiumSeasonal';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import { SeasonHubBanner } from './SeasonHubBanner';
import { TimeModeToggle } from './TimeModeToggle';
import { DivisionLadderPanel } from './DivisionLadderPanel';
import { LeaderboardRowV3 } from './LeaderboardRowV3';
import { RankCelebration } from './RankCelebration';
import { getSeasonColor } from '@/lib/season-colors';
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

  // Transform podium data to SimplePodium format
  const podiumUsers = useMemo(() => {
    const podiumData = timeFilter === 'seasonal' ? seasonalPodiumData : allTimePodiumData;
    if (!podiumData || podiumData.length === 0) return [];

    return podiumData.map((entry) => {
      const isSeasonal = timeFilter === 'seasonal';
      const courses = isSeasonal 
        ? (entry as any).courses_logged || 0 
        : (entry as any).all_time_courses || 0;
      
      return {
        id: entry.user_id,
        name: entry.display_name,
        avatarUrl: entry.avatar_url,
        courses,
        position: entry.podium_position as 1 | 2 | 3,
      };
    });
  }, [timeFilter, seasonalPodiumData, allTimePodiumData]);

  // Flatten paginated entries
  const entries = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.entries) ?? [];
  }, [leaderboardData]);

  // Get current season from calendar
  const currentSeason = useMemo(() => {
    return seasonCalendar?.find(s => s.is_current) ?? null;
  }, [seasonCalendar]);

  // Transform season calendar for SeasonHubBanner
  const calendarSeasons = useMemo(() => {
    if (!seasonCalendar) return [];
    return seasonCalendar.slice(0, 4).map(s => ({
      id: s.season_id,
      name: s.name,
      tagline: s.tagline || '',
      color: s.color || '#10B981',
      startDate: s.start_date,
      endDate: s.end_date,
      isCurrent: s.is_current,
      daysRemaining: s.days_remaining,
    }));
  }, [seasonCalendar]);

  // Build current season object for SeasonHubBanner
  const currentSeasonForHub = useMemo(() => {
    if (!currentSeason) return null;
    return {
      id: currentSeason.season_id,
      name: currentSeason.name,
      tagline: currentSeason.tagline || '',
      color: currentSeason.color || '#10B981',
      startDate: currentSeason.start_date,
      endDate: currentSeason.end_date,
      isCurrent: true,
      daysRemaining: currentSeason.days_remaining,
    };
  }, [currentSeason]);

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
      {/* 1. Season Hub Banner (includes season selector) */}
      {currentSeasonForHub && calendarSeasons.length > 0 && (
        <div className="px-3">
          <SeasonHubBanner
            seasons={calendarSeasons}
            currentSeason={currentSeasonForHub}
            onSeasonSelect={(id) => console.log('Season selected:', id)}
          />
        </div>
      )}

      {/* 2. Time Filter Toggle - Compact */}
      <TimeModeToggle value={timeFilter} onChange={setTimeFilter} />

      {/* 3. Simple Podium - No colors, no crown */}
      {podiumUsers.length > 0 && podiumScope !== 'nearby' && (
        <SimplePodium
          users={podiumUsers}
          onUserClick={handleUserClick}
        />
      )}

      {/* 4. Beat Rival CTA */}
      {closestRivalAhead && (
        <BeatRivalCTA 
          rival={closestRivalAhead} 
          onLogCourse={handleLogCourse} 
        />
      )}

      {/* 5. Division Ladder (collapsible) */}
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

      {/* 6. Contextual Feedback */}
      {feedback && (
        <div className="px-3">
          <ChampionshipFeedback
            type={feedback.type}
            message={feedback.message}
          />
        </div>
      )}

      {/* 7. Filters */}
      <div className="px-3">
        <ChampionshipFilters
          arenaMode={arenaMode}
          divisionFilter={divisionFilter}
          onArenaModeChange={setArenaMode}
          onDivisionFilterChange={setDivisionFilter}
        />
      </div>

      {/* 8. Leaderboard List - V3 Rows */}
      <div>
        {leaderboardLoading && entries.length === 0 ? (
          // Loading skeleton
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
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No players found</p>
          </div>
        ) : (
          entries.map((entry) => (
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
          ))
        )}
        
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={leaderboardLoading}
            className="w-full py-4 text-sm text-primary font-medium hover:bg-muted/30 transition-colors rounded-xl"
          >
            {leaderboardLoading ? 'Loading...' : 'Load more'}
          </button>
        )}
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
