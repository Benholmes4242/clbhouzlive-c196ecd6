import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
} from '@/hooks/championship';
import {
  ChampionshipHeader,
  ChampionshipFilters,
  DivisionStatusCard,
  RivalsSection,
  ChampionshipLeaderboardList,
  ChampionshipFeedback,
  getContextualFeedback,
} from './modules';
import type { ChampionshipArenaMode, DivisionSlug } from '@/types/championship';

interface ChampionshipLeaderboardViewProps {
  className?: string;
}

/**
 * ChampionshipLeaderboardView - Main orchestrator for Championship Mode.
 * Composes all modules into the complete leaderboard experience.
 */
export function ChampionshipLeaderboardView({ className }: ChampionshipLeaderboardViewProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  // Filter state
  const [arenaMode, setArenaMode] = useState<ChampionshipArenaMode>('global');
  const [divisionFilter, setDivisionFilter] = useState<DivisionSlug | 'all'>('all');

  // Data fetching
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChampionshipLeaderboard({
    arenaMode,
    divisionFilter,
    pageSize: 50,
  });

  const { data: userStatus, isLoading: statusLoading } = useUserChampionshipStatus(userId);
  const { data: rivals, isLoading: rivalsLoading } = useUserRivals(userId, 5);

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

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with Season Info */}
      <ChampionshipHeader season={season} />

      {/* User's Division Status Card */}
      {userStatus && !statusLoading && (
        <DivisionStatusCard status={userStatus} className="mb-4" />
      )}

      {/* Contextual Feedback */}
      {feedback && (
        <ChampionshipFeedback
          type={feedback.type}
          message={feedback.message}
          className="mb-4"
        />
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
    </div>
  );
}
