import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LeaderboardStatusStrip } from './LeaderboardStatusStrip';
import { LeaderboardSpotlightSection } from './LeaderboardSpotlightSection';
import { LeaderboardPositionCard } from './LeaderboardPositionCard';
import { LeaderboardSegmentedControl, LeaderboardSegment } from './LeaderboardSegmentedControl';
import { LeaderboardPlayerRow } from './LeaderboardPlayerRow';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { getTop100Club } from '@/lib/top100Club';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import {
  USE_MOCK_LEADERBOARD_DATA,
  MOCK_CURRENT_USER_RANK,
  getMockTop100,
  getMockAroundYou,
  getMockFriends,
  getMockRising,
  getMockCurrentUser,
  MockLeaderboardPlayer,
} from '@/lib/mockLeaderboardData';

const PAGE_SIZE = 50;

// Transform mock player to display format
function transformMockPlayer(player: MockLeaderboardPlayer & { rank: number; isCurrentUser?: boolean }) {
  const club = getTop100Club(player.top100_played_global);
  return {
    user_id: player.user_id,
    display_name: player.display_name,
    avatar_url: player.avatar_url,
    total_top100_played: player.top100_played_global,
    rank: player.rank,
    home_club: player.home_club,
    club_tier: club.tierName,
    isCurrentUser: player.isCurrentUser,
  };
}

export function PlayersLeaderboardView() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<LeaderboardSegment>('around');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset page when segment changes
  useEffect(() => {
    setPage(1);
  }, [segment]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get current user's profile
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', currentUser?.id],
    enabled: !!currentUser?.id && !USE_MOCK_LEADERBOARD_DATA,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name')
        .eq('id', currentUser!.id)
        .single();
      return data;
    },
  });

  // Fetch leaderboard data (real)
  const { data, isLoading } = useTop100Leaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    pageSize: 500,
  });

  // Mock data logic
  const mockData = useMemo(() => {
    if (!USE_MOCK_LEADERBOARD_DATA) return null;

    let allPlayers: (MockLeaderboardPlayer & { rank: number; isCurrentUser?: boolean })[];
    
    switch (segment) {
      case 'top100':
        allPlayers = getMockTop100();
        break;
      case 'around':
        allPlayers = getMockAroundYou(MOCK_CURRENT_USER_RANK);
        break;
      case 'friends':
        allPlayers = getMockFriends();
        break;
      case 'rising':
        allPlayers = getMockRising();
        break;
      default:
        allPlayers = getMockTop100();
    }

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const paginated = allPlayers.slice(start, end);

    return {
      players: paginated.map(transformMockPlayer),
      total: allPlayers.length,
      hasMore: end < allPlayers.length,
      currentUser: getMockCurrentUser(),
    };
  }, [segment, page]);

  // Real data logic
  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const currentUserEntry = data?.pages[0]?.current_user_entry;

  // Find user's position (real data)
  const myIndex = currentUserEntry
    ? allEntries.findIndex((e: any) => e.user_id === currentUserEntry.user_id)
    : -1;

  // Determine if user is new (no position yet)
  const isNewUser = USE_MOCK_LEADERBOARD_DATA 
    ? false 
    : (!currentUserEntry || currentUserEntry.total_top100_played === 0);

  // Disable "Around You" for new users (real mode only)
  const disabledSegments: LeaderboardSegment[] = isNewUser ? ['around'] : [];

  // Default segment based on user status
  useEffect(() => {
    if (isNewUser && segment === 'around') {
      setSegment('top100');
    }
  }, [isNewUser, segment]);

  // Filter entries based on segment (real data)
  const displayedEntries = useMemo(() => {
    if (USE_MOCK_LEADERBOARD_DATA) return [];

    switch (segment) {
      case 'top100':
        return allEntries.slice(0, 100);
      
      case 'around':
        if (myIndex < 0) return [];
        const start = Math.max(0, myIndex - 5);
        const end = Math.min(allEntries.length, myIndex + 6);
        return allEntries.slice(start, end);
      
      case 'friends':
        return allEntries.filter((e: any) => e.is_friend && e.total_top100_played > 0);
      
      case 'rising':
        return [...allEntries]
          .filter((e: any) => e.delta_rank && e.delta_rank > 0)
          .sort((a: any, b: any) => (b.delta_rank || 0) - (a.delta_rank || 0))
          .slice(0, 50);
      
      default:
        return allEntries.slice(0, 100);
    }
  }, [allEntries, segment, myIndex]);

  // Build user position model for strip
  const meModel = USE_MOCK_LEADERBOARD_DATA
    ? mockData?.currentUser ? {
        user_id: mockData.currentUser.user_id,
        display_name: mockData.currentUser.display_name,
        avatar_url: mockData.currentUser.avatar_url,
        total_top100_played: mockData.currentUser.top100_played_global,
        rank: mockData.currentUser.rank,
      } : null
    : currentUserEntry && currentUserProfile ? {
        user_id: currentUserEntry.user_id,
        display_name: currentUserProfile.display_name || currentUserEntry.display_name,
        avatar_url: currentUserProfile.profile_photo_url || currentUserEntry.avatar_url,
        total_top100_played: currentUserEntry.total_top100_played,
        rank: currentUserEntry.rank,
      } : null;

  // Entries to render
  const entriesToRender = USE_MOCK_LEADERBOARD_DATA 
    ? mockData?.players || []
    : displayedEntries;

  const totalEntries = USE_MOCK_LEADERBOARD_DATA 
    ? mockData?.total || 0 
    : displayedEntries.length;

  const hasMore = USE_MOCK_LEADERBOARD_DATA 
    ? mockData?.hasMore || false 
    : false;

  const showingStart = (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, totalEntries);

  if (isLoading && !USE_MOCK_LEADERBOARD_DATA) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full rounded-sq-pill" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" ref={listRef}>
      {/* Your Position Status Strip - full bleed */}
      {meModel && (
        <LeaderboardStatusStrip user={meModel} />
      )}

      {/* Spotlight Section - Setting the Standard */}
      {meModel && meModel.total_top100_played > 0 && (
        <LeaderboardSpotlightSection />
      )}

      {/* New user encouragement */}
      {isNewUser && (
        <div className="mx-4 my-4 rounded-sq-md border border-border/60 bg-card/80 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Rate your first Top 100 course to join the leaderboard and track your progress.
          </p>
        </div>
      )}

      {/* Segmented Control */}
      <div className="py-3 px-4">
        <LeaderboardSegmentedControl
          value={segment}
          onChange={setSegment}
          disabledSegments={disabledSegments}
        />
      </div>

      {/* Player List - full bleed rows */}
      <div className="w-full">
        {entriesToRender.length === 0 ? (
          <div className="py-6">
            {segment === 'friends' ? (
              <LeaderboardEmptyState type="friends-no-friends" />
            ) : segment === 'around' && isNewUser ? (
              <LeaderboardEmptyState type="around-you-no-rank" />
            ) : segment === 'rising' ? (
              <LeaderboardEmptyState type="rising-no-data" />
            ) : (
              <LeaderboardEmptyState type="no-matches" onResetFilters={() => setSegment('top100')} />
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {entriesToRender.map((entry: any, idx: number) => {
              const isMe = USE_MOCK_LEADERBOARD_DATA 
                ? entry.isCurrentUser 
                : currentUserEntry?.user_id === entry.user_id;
              const globalIdx = (page - 1) * PAGE_SIZE + idx;
              const showMarker = globalIdx > 0 && globalIdx % 50 === 0;

              return (
                <React.Fragment key={entry.user_id}>
                  {/* Position marker every 50 rows */}
                  {showMarker && meModel && (
                    <LeaderboardPositionCard user={meModel} variant="compact" />
                  )}
                  <LeaderboardPlayerRow
                    entry={entry}
                    isCurrentUser={isMe}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {USE_MOCK_LEADERBOARD_DATA && totalEntries > PAGE_SIZE && (
        <div className="flex flex-col items-center gap-3 pt-2 pb-4 px-4">
          <div className="flex items-center gap-3">
            {page > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                className="rounded-sq-sm"
              >
                Previous {PAGE_SIZE}
              </Button>
            )}
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                className="rounded-sq-sm"
              >
                Next {PAGE_SIZE} players
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {showingStart}–{showingEnd} of {totalEntries} players
          </p>
        </div>
      )}
    </div>
  );
}
