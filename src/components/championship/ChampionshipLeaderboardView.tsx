import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
  useDivisionConfig,
} from '@/hooks/championship';
import {
  ChampionshipHeader,
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
import { SeasonCalendar } from './SeasonCalendar';
import type { ChampionshipArenaMode, DivisionSlug, UserRival } from '@/types/championship';
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

  // Flatten paginated entries
  const entries = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.entries) ?? [];
  }, [leaderboardData]);

  // Get season from first page
  const season = leaderboardData?.pages[0]?.season ?? null;

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

  const handleLogCourse = () => {
    navigate('/courses');
  };

  const handleUserClick = (userId: string) => {
    navigate(`/golfer/${userId}`);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with Season Info */}
      <ChampionshipHeader season={season} />

      {/* Season Calendar Strip */}
      <div className="px-4 mb-4">
        <SeasonCalendar />
      </div>

      {/* Time Filter Toggle */}
      <div className="flex justify-center px-4 mb-4">
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Podium - shows top 3 for current scope */}
      <Podium
        mode={podiumMode}
        scope={podiumScope}
        divisionId={divisionFilter !== 'all' ? divisionFilter : undefined}
        currentUserId={userId}
        onUserClick={handleUserClick}
      />

      {/* User's Division Status Card */}
      {userStatus && !statusLoading && (
        <DivisionStatusCard 
          status={userStatus} 
          className="mb-4" 
        />
      )}

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
    </div>
  );
}
