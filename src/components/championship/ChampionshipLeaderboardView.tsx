import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
  useDivisionConfig,
  useSeasonCalendar,
} from '@/hooks/championship';
import {
  ChampionshipFilters,
  DivisionStatusCard,
  RivalsSection,
  ChampionshipLeaderboardList,
  ChampionshipFeedback,
  getContextualFeedback,
  DivisionLadder,
  BeatRivalCTA,
  RivalVersusPanel,
} from './modules';
import { Podium, TimeFilterToggle } from './podium';
import { SeasonHeroHeader } from './SeasonHeroHeader';
import { SeasonCalendarStrip } from './SeasonCalendarStrip';
import { PositionCard } from './PositionCard';
import { PodiumThreatBanner } from './PodiumThreatBanner';
import { InactivityNudge } from './InactivityNudge';
import { RankCelebration } from './RankCelebration';
import { getSeasonColor } from '@/lib/season-colors';
import type { ChampionshipArenaMode, DivisionSlug, UserRival } from '@/types/championship';
import { DIVISION_ORDER, getDivisionIndex } from '@/types/championship';
import type { TimeFilter, PodiumScope } from '@/types/podium';

interface ChampionshipLeaderboardViewProps {
  className?: string;
}

/**
 * ChampionshipLeaderboardView - Main orchestrator for Championship Mode.
 * Composes all modules into the complete leaderboard experience.
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

  // Flatten paginated entries
  const entries = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.entries) ?? [];
  }, [leaderboardData]);

  // Get season from first page
  const season = leaderboardData?.pages[0]?.season ?? null;

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
      icon: s.icon || '🏌️',
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

  // Get closest rival who is ahead (for Beat Rival CTA)
  const closestRivalAhead = useMemo(() => {
    if (!rivals?.length) return null;
    return rivals.find(r => r.gap > 0) || null;
  }, [rivals]);

  // Calculate days since last course for inactivity nudge
  // Note: Using streak_current as proxy - 0 streak suggests inactivity
  const daysSinceLastCourse = useMemo(() => {
    if (!userStatus) return 0;
    // If user has active streak, they're active
    if (userStatus.streak_current > 0) return 0;
    // Otherwise assume at least 7 days for nudge
    return 7;
  }, [userStatus]);

  // Get podium proximity info
  const podiumProximity = useMemo(() => {
    if (!entries.length || !userStatus) return null;
    const thirdPlace = entries.find(e => e.current_rank === 3);
    if (!thirdPlace) return null;
    const coursesToPodium = thirdPlace.courses_this_season - userStatus.courses_this_season;
    return {
      userPosition: userStatus.current_rank,
      coursesToPodium,
      thirdPlaceName: thirdPlace.display_name || 'Third place',
    };
  }, [entries, userStatus]);

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

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 1. Season Hero Header */}
      {currentSeason && (
        <div className="px-4">
          <SeasonHeroHeader
            seasonName={currentSeason.name}
            seasonTagline={currentSeason.tagline || ''}
            seasonIcon={currentSeason.icon || '🏌️'}
            daysRemaining={currentSeason.days_remaining || 0}
            totalDays={totalSeasonDays}
            seasonColor={seasonColors.primary}
          />
        </div>
      )}

      {/* 2. Season Calendar Strip */}
      {calendarSeasons.length > 0 && (
        <div className="px-4 mb-4">
          <SeasonCalendarStrip seasons={calendarSeasons} />
        </div>
      )}

      {/* 3. Time Filter Toggle */}
      <div className="flex justify-center px-4 mb-4">
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* 4. Podium - shows top 3 for current scope */}
      <Podium
        mode={podiumMode}
        scope={podiumScope}
        divisionId={divisionFilter !== 'all' ? divisionFilter : undefined}
        currentUserId={userId}
        onUserClick={handleUserClick}
      />

      {/* 5. Podium Threat Banner */}
      {podiumProximity && userStatus && userStatus.current_rank > 3 && (
        <div className="px-4">
          <PodiumThreatBanner
            userPosition={podiumProximity.userPosition}
            coursesToPodium={podiumProximity.coursesToPodium}
            thirdPlaceName={podiumProximity.thirdPlaceName}
          />
        </div>
      )}

      {/* 6. Your Position Card (enhanced) */}
      {userStatus && !statusLoading && (
        <div className="px-4 mb-4">
          <PositionCard
            rank={userStatus.current_rank}
            totalInDivision={100} // Could be fetched from division stats
            courses={userStatus.courses_this_season}
            streak={userStatus.streak_current}
            division={userStatus.division_name || 'Rookie'}
            divisionColor={userStatus.division_color || '#D9C7A3'}
            coursesToNextDivision={userStatus.courses_to_next_division || 0}
            nextDivision={DIVISION_ORDER[getDivisionIndex(userStatus.division_slug) + 1]?.replace('-club', ' Club') || 'Max Division'}
            isInPromotionZone={userStatus.zone === 'promotion'}
            threatAbove={closestRivalAhead ? {
              name: closestRivalAhead.display_name || 'Rival',
              coursesDiff: closestRivalAhead.gap,
            } : undefined}
            threatBelow={userStatus.closest_rival && userStatus.closest_rival.gap < 0 ? {
              name: userStatus.closest_rival.display_name || 'Rival',
              coursesDiff: Math.abs(userStatus.closest_rival.gap),
            } : undefined}
          />
        </div>
      )}

      {/* 7. Inactivity Nudge */}
      <div className="px-4">
        <InactivityNudge
          daysSinceLastCourse={daysSinceLastCourse}
          onLogCourse={handleLogCourse}
        />
      </div>

      {/* Beat Rival CTA - only show if behind a rival */}
      {closestRivalAhead && (
        <div className="px-4 mb-4">
          <BeatRivalCTA 
            rival={closestRivalAhead} 
            onLogCourse={handleLogCourse} 
          />
        </div>
      )}

      {/* Contextual Feedback */}
      {feedback && (
        <ChampionshipFeedback
          type={feedback.type}
          message={feedback.message}
          className="mb-4"
        />
      )}

      {/* Division Ladder (collapsible) */}
      {divisions && divisions.length > 0 && userStatus && (
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowDivisionLadder(!showDivisionLadder)}
            className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {showDivisionLadder ? '▼ Hide Division Ladder' : '▶ Show Division Ladder'}
          </button>
          {showDivisionLadder && (
            <DivisionLadder
              divisions={divisions}
              currentDivision={userStatus.division_slug}
              coursesPlayed={userStatus.courses_this_season}
              compact
            />
          )}
        </div>
      )}

      {/* Rivals Section */}
      {userId && (
        <RivalsSection
          rivals={rivals ?? []}
          closestRival={userStatus?.closest_rival ?? null}
          isLoading={rivalsLoading}
          className="mb-4"
        />
      )}

      {/* Filters */}
      <ChampionshipFilters
        arenaMode={arenaMode}
        divisionFilter={divisionFilter}
        onArenaModeChange={setArenaMode}
        onDivisionFilterChange={setDivisionFilter}
        className="mb-2"
      />

      {/* Leaderboard List */}
      <ChampionshipLeaderboardList
        entries={entries}
        isLoading={leaderboardLoading}
        hasNextPage={hasNextPage}
        onLoadMore={() => fetchNextPage()}
      />

      {/* Rival Versus Panel (drawer) */}
      {userStatus && selectedRival && (
        <RivalVersusPanel
          isOpen={!!selectedRival}
          onClose={() => setSelectedRival(null)}
          rival={selectedRival}
          userStatus={userStatus}
        />
      )}

      {/* Rank Celebration (triggered on position gain) */}
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
