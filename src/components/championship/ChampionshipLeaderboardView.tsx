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
import { ChampionshipPodiumProLayout, TimeFilterToggle } from './podium';
import { usePodiumSeasonal } from '@/hooks/championship/usePodiumSeasonal';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import { SeasonHeroBanner } from './SeasonHeroBanner';
import { SeasonCalendarStrip } from './SeasonCalendarStrip';
import { PerformanceStrip } from './PerformanceStrip';
import { ActivityNudgeRow } from './ActivityNudgeRow';
import { PromotionStatusBanner } from './PromotionStatusBanner';
import { DivisionLadderPanel } from './DivisionLadderPanel';
import { LeaderboardRowV2 } from './LeaderboardRowV2';
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

// Helper to get ordinal suffix
const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * ChampionshipLeaderboardView - Main orchestrator for Championship Mode.
 * Polished version with premium components and consistent design language.
 */
export function ChampionshipLeaderboardView({ className }: ChampionshipLeaderboardViewProps) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const userId = user?.id;

  // Filter state
  const [arenaMode, setArenaMode] = useState<ChampionshipArenaMode>('global');
  const [divisionFilter, setDivisionFilter] = useState<DivisionSlug | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('season');
  
  // UI state
  const [showDivisionLadder, setShowDivisionLadder] = useState(false);
  const [selectedRival, setSelectedRival] = useState<UserRival | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousRank, setPreviousRank] = useState<number | null>(null);

  // Convert arenaMode to PodiumScope
  const podiumScope: PodiumScope = arenaMode === 'nearby' ? 'nearby' : arenaMode;
  const podiumMode = timeFilter === 'season' ? 'seasonal' : 'all_time';

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
    enabled: timeFilter === 'season' && podiumScope !== 'nearby',
  });

  const { data: allTimePodiumData } = usePodiumAllTime({
    scope: podiumScope,
    currentUserId: userId,
    enabled: timeFilter === 'all_time' && podiumScope !== 'nearby',
  });

  // Transform podium data to Leader[] format for ChampionshipPodiumProLayout
  const podiumLeaders = useMemo(() => {
    const podiumData = timeFilter === 'season' ? seasonalPodiumData : allTimePodiumData;
    if (!podiumData || podiumData.length === 0) return [];

    return podiumData.map((entry) => {
      const isSeasonal = timeFilter === 'season';
      const statValue = isSeasonal 
        ? (entry as any).courses_logged || 0 
        : (entry as any).all_time_courses || 0;
      
      return {
        id: entry.user_id,
        name: entry.display_name,
        avatarUrl: entry.avatar_url,
        homeClubName: null, // Not available in podium data
        statValue,
        statLabel: 'courses',
        descriptor: entry.narrative_text || (isSeasonal ? 'Seasonal leader' : 'All-time legend'),
        rank: entry.podium_position as 1 | 2 | 3,
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

  // Transform season calendar for SeasonCalendarStrip
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
      daysUntilStart: s.days_until_start,
    }));
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

  // Days since last course for inactivity nudge
  const daysSinceLastCourse = useMemo(() => {
    if (!userStatus) return 0;
    if (userStatus.streak_current > 0) return 0;
    return 7;
  }, [userStatus]);

  const handleLogCourse = () => {
    navigate('/courses');
  };

  const handleUserClick = (clickedUserId: string) => {
    navigate(`/golfer/${clickedUserId}`);
  };

  // Season color
  const seasonColors = currentSeason ? getSeasonColor(currentSeason.name) : getSeasonColor('Pre-Season Training');

  // Calculate total days for hero header
  const totalSeasonDays = useMemo(() => {
    if (!currentSeason) return 90;
    const start = new Date(currentSeason.start_date);
    const end = new Date(currentSeason.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [currentSeason]);

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
    // Find matching tier from TIER_CONFIG object
    const tierValues = Object.values(TIER_CONFIG);
    const nextConfig = nextSlug 
      ? tierValues.find(t => t.name?.toLowerCase().includes(nextSlug.replace('-club', '').replace('_', ' ')))
      : null;
    return {
      name: nextConfig?.name || 'Max Division',
      coursesToNext: userStatus.courses_to_next_division || 0,
    };
  }, [userStatus]);

  // Progress percent for performance strip
  const progressPercent = useMemo(() => {
    if (!userStatus || !nextDivision.coursesToNext) return 100;
    const currentTierLevel = getTierLevel(userStatus.courses_this_season);
    const currentTier = TIER_CONFIG[currentTierLevel];
    const nextTierLevel = Math.min(8, currentTierLevel + 1) as keyof typeof TIER_CONFIG;
    const nextTier = TIER_CONFIG[nextTierLevel];
    if (!nextTier || currentTier.threshold === nextTier.threshold) return 100;
    const range = nextTier.threshold - currentTier.threshold;
    const progress = userStatus.courses_this_season - currentTier.threshold;
    return Math.min(100, (progress / range) * 100);
  }, [userStatus, nextDivision]);

  return (
    <div className={cn('flex flex-col space-y-4 pb-24 max-w-xl mx-auto', className)}>
      {/* 1. Season Hero Banner */}
      {currentSeason && (
        <div className="px-4">
          <SeasonHeroBanner
            seasonName={currentSeason.name}
            seasonTagline={currentSeason.tagline || ''}
            daysRemaining={currentSeason.days_remaining || 0}
            totalDays={totalSeasonDays}
            seasonColor={seasonColors.primary}
          />
        </div>
      )}

      {/* 2. Season Calendar Strip */}
      {calendarSeasons.length > 0 && (
        <div className="px-4">
          <SeasonCalendarStrip seasons={calendarSeasons} />
        </div>
      )}

      {/* 3. Time Filter Toggle */}
      <div className="px-4">
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* 4. Podium - New Pro Layout */}
      {podiumLeaders.length > 0 && podiumScope !== 'nearby' && (
        <ChampionshipPodiumProLayout
          leaders={podiumLeaders}
          mode={podiumMode}
          onLeaderPress={handleUserClick}
        />
      )}

      {/* 5. Performance Strip */}
      {userStatus && !statusLoading && (
        <div className="px-4">
          <PerformanceStrip
            divisionName={userStatus.division_name || 'Rookie'}
            divisionColor={userStatus.division_color || '#D9C7A3'}
            rankText={getOrdinalSuffix(userStatus.current_rank)}
            divisionSizeText="in division"
            coursesCount={userStatus.courses_this_season}
            streakDays={userStatus.streak_current}
            nextDivisionName={nextDivision.name}
            coursesToNext={nextDivision.coursesToNext}
            progressPercent={progressPercent}
            isInPromotionZone={userStatus.zone === 'promotion'}
          />
        </div>
      )}

      {/* 6. Activity Nudge */}
      <div className="px-4">
        <ActivityNudgeRow
          daysSinceLastLog={daysSinceLastCourse}
          onLogCourse={handleLogCourse}
        />
      </div>

      {/* 7. Promotion Status Banner - REMOVED */}

      {/* 8. Beat Rival CTA */}
      {closestRivalAhead && (
        <div className="px-4">
          <BeatRivalCTA 
            rival={closestRivalAhead} 
            onLogCourse={handleLogCourse} 
          />
        </div>
      )}

      {/* 9. Division Ladder (collapsible) */}
      {divisionLadderData.length > 0 && userStatus && (
        <div className="px-4">
          <Collapsible open={showDivisionLadder} onOpenChange={setShowDivisionLadder}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
              {showDivisionLadder ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showDivisionLadder ? 'Hide Division Ladder' : 'Show Division Ladder'}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <DivisionLadderPanel
                divisions={divisionLadderData}
                userCourses={userStatus.courses_this_season}
                coursesToNext={nextDivision.coursesToNext}
                nextDivisionName={nextDivision.name}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* 10. Contextual Feedback */}
      {feedback && (
        <ChampionshipFeedback
          type={feedback.type}
          message={feedback.message}
          className="mx-4"
        />
      )}

      {/* 11. Filters */}
      <ChampionshipFilters
        arenaMode={arenaMode}
        divisionFilter={divisionFilter}
        onArenaModeChange={setArenaMode}
        onDivisionFilterChange={setDivisionFilter}
      />

      {/* 12. Leaderboard List */}
      <div className="space-y-2 px-4">
        {leaderboardLoading && entries.length === 0 ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="py-3 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-11 h-11 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No players found</p>
          </div>
        ) : (
          entries.map((entry) => (
            <LeaderboardRowV2
              key={entry.user_id}
              rank={entry.current_rank}
              name={entry.display_name}
              avatarUrl={entry.avatar_url}
              homeClubName={entry.home_club}
              statText={`${entry.courses_this_season} courses`}
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
