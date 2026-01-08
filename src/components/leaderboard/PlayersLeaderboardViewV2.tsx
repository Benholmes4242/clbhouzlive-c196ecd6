/**
 * PlayersLeaderboardViewV2 - Rebuilt leaderboard with gamification
 * 
 * Features:
 * - Cinematic hero header
 * - Your Status card with rank/tier/progress
 * - Arena tabs (Global Elite, Regional Wars, Friends, Climbers, Nearby)
 * - Your Rivals section
 * - Premium player cards with badges
 * - Region selector for Regional Wars
 * - Rival preview sheet
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTop100Leaderboard, LeaderboardScope } from '@/hooks/useTop100Leaderboard';
import { useAuth } from '@/providers/AuthUserProvider';

import {
  LeaderboardHero,
  LeaderboardYourStatus,
  LeaderboardArenaTabs,
  LeaderboardRivalsSection,
  LeaderboardPlayerCard,
  LeaderboardRegionSelector,
  RivalPreviewSheet,
  LeaderboardFullSkeleton,
  LeaderboardListSkeleton,
  type ArenaMode,
  type LeaderboardRegion,
  type LeaderboardPlayerEntry,
  type LeaderboardUserStatus,
  type RivalPlayer,
} from './v2';

import { LeaderboardEmptyState } from './LeaderboardEmptyState';

// Map arena mode to scope
const ARENA_TO_SCOPE: Record<ArenaMode, LeaderboardScope> = {
  global: 'worldwide',
  regional: 'worldwide', // Will be overridden by region
  friends: 'worldwide',
  climbers: 'worldwide',
  nearby: 'worldwide',
};

// Map region to scope
const REGION_TO_SCOPE: Record<LeaderboardRegion, LeaderboardScope> = {
  worldwide: 'worldwide',
  gbi: 'gb-i-top-100',
  europe: 'europe-top-100',
  usa: 'usa-top-100',
  'asia-pacific': 'worldwide', // Fallback
};

export function PlayersLeaderboardViewV2() {
  const navigate = useNavigate();
  const { user: currentAuthUser } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);

  // UI state
  const [arenaMode, setArenaMode] = useState<ArenaMode>('global');
  const [region, setRegion] = useState<LeaderboardRegion>('worldwide');
  const [selectedRival, setSelectedRival] = useState<LeaderboardPlayerEntry | null>(null);
  const [rivalSheetOpen, setRivalSheetOpen] = useState(false);

  // Determine effective scope
  const effectiveScope = useMemo(() => {
    if (arenaMode === 'regional') {
      return REGION_TO_SCOPE[region];
    }
    return ARENA_TO_SCOPE[arenaMode];
  }, [arenaMode, region]);

  // Get current user profile
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', currentAuthUser?.id],
    enabled: !!currentAuthUser?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url, home_club')
        .eq('id', currentAuthUser!.id)
        .single();
      return data;
    },
  });

  // Fetch leaderboard data
  const { data, isLoading, isError, refetch } = useTop100Leaderboard({
    scope: effectiveScope,
    timeRange: 'all_time',
    pageSize: 500,
  });

  // All entries from paginated data
  const allEntries = useMemo(() => {
    return data?.pages.flatMap(page => page.entries) || [];
  }, [data]);

  // Current user's entry
  const currentUserEntry = data?.pages[0]?.current_user_entry;

  // Find user's index in the list
  const myIndex = useMemo(() => {
    if (!currentUserEntry) return -1;
    return allEntries.findIndex(e => e.user_id === currentUserEntry.user_id);
  }, [allEntries, currentUserEntry]);

  // Build user status model
  const userStatus: LeaderboardUserStatus | null = useMemo(() => {
    if (!currentUserEntry) return null;
    return {
      user_id: currentUserEntry.user_id,
      display_name: currentUserProfile?.display_name || currentUserEntry.display_name,
      avatar_url: currentUserProfile?.profile_photo_url || currentUserEntry.avatar_url,
      total_top100_played: currentUserEntry.total_top100_played,
      rank: currentUserEntry.rank,
      activeRegion: arenaMode === 'regional' ? region.toUpperCase() : undefined,
    };
  }, [currentUserEntry, currentUserProfile, arenaMode, region]);

  // Compute rivals (above/current/below)
  const rivals = useMemo(() => {
    if (myIndex < 0 || !currentUserEntry) {
      return { above: null, current: null, below: null };
    }

    const current: RivalPlayer = {
      user_id: currentUserEntry.user_id,
      display_name: currentUserProfile?.display_name || currentUserEntry.display_name,
      avatar_url: currentUserProfile?.profile_photo_url || currentUserEntry.avatar_url,
      total_top100_played: currentUserEntry.total_top100_played,
      rank: currentUserEntry.rank,
      home_club: currentUserProfile?.home_club || currentUserEntry.home_club,
    };

    const aboveEntry = myIndex > 0 ? allEntries[myIndex - 1] : null;
    const belowEntry = myIndex < allEntries.length - 1 ? allEntries[myIndex + 1] : null;

    const above: RivalPlayer | null = aboveEntry ? {
      user_id: aboveEntry.user_id,
      display_name: aboveEntry.display_name,
      avatar_url: aboveEntry.avatar_url,
      total_top100_played: aboveEntry.total_top100_played,
      rank: aboveEntry.rank,
      home_club: aboveEntry.home_club,
    } : null;

    const below: RivalPlayer | null = belowEntry ? {
      user_id: belowEntry.user_id,
      display_name: belowEntry.display_name,
      avatar_url: belowEntry.avatar_url,
      total_top100_played: belowEntry.total_top100_played,
      rank: belowEntry.rank,
      home_club: belowEntry.home_club,
    } : null;

    return { above, current, below };
  }, [myIndex, allEntries, currentUserEntry, currentUserProfile]);

  // Filter entries based on arena mode
  const displayedEntries = useMemo((): LeaderboardPlayerEntry[] => {
    switch (arenaMode) {
      case 'global':
      case 'regional':
        return allEntries.slice(0, 100).map(e => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          home_club: e.home_club,
          total_top100_played: e.total_top100_played,
          rank: e.rank,
        }));

      case 'friends':
        return allEntries
          .filter(e => e.is_friend && e.total_top100_played > 0)
          .map(e => ({
            user_id: e.user_id,
            display_name: e.display_name,
            avatar_url: e.avatar_url,
            home_club: e.home_club,
            total_top100_played: e.total_top100_played,
            rank: e.rank,
          }));

      case 'climbers':
        // Sort by delta_rank (if available) or just show top movers
        return [...allEntries]
          .filter((e: any) => e.delta_rank && e.delta_rank > 0)
          .sort((a: any, b: any) => (b.delta_rank || 0) - (a.delta_rank || 0))
          .slice(0, 50)
          .map((e: any) => ({
            user_id: e.user_id,
            display_name: e.display_name,
            avatar_url: e.avatar_url,
            home_club: e.home_club,
            total_top100_played: e.total_top100_played,
            rank: e.rank,
            delta_rank: e.delta_rank,
          }));

      case 'nearby':
        // TODO: Implement nearby based on location
        // For now, show around-you style
        if (myIndex < 0) return [];
        const start = Math.max(0, myIndex - 10);
        const end = Math.min(allEntries.length, myIndex + 11);
        return allEntries.slice(start, end).map(e => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          home_club: e.home_club,
          total_top100_played: e.total_top100_played,
          rank: e.rank,
        }));

      default:
        return allEntries.slice(0, 100).map(e => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          home_club: e.home_club,
          total_top100_played: e.total_top100_played,
          rank: e.rank,
        }));
    }
  }, [allEntries, arenaMode, myIndex]);

  // Check if user is new (no Top 100s played)
  const isNewUser = !currentUserEntry || currentUserEntry.total_top100_played === 0;

  // Disabled arena modes for new users
  const disabledModes: ArenaMode[] = isNewUser ? ['nearby'] : [];

  // Handle rival click
  const handleViewRival = useCallback((userId: string) => {
    const player = allEntries.find(e => e.user_id === userId);
    if (player) {
      setSelectedRival({
        user_id: player.user_id,
        display_name: player.display_name,
        avatar_url: player.avatar_url,
        home_club: player.home_club,
        total_top100_played: player.total_top100_played,
        rank: player.rank,
      });
      setRivalSheetOpen(true);
    }
  }, [allEntries]);

  // Scroll to user in list
  const scrollToUser = useCallback(() => {
    // Find and focus user's position
    if (listRef.current && myIndex >= 0) {
      const userRow = listRef.current.querySelector(`[data-user-id="${currentUserEntry?.user_id}"]`);
      userRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [myIndex, currentUserEntry]);

  // Handle arena mode change
  const handleArenaModeChange = (mode: ArenaMode) => {
    setArenaMode(mode);
    // Reset region when leaving regional mode
    if (mode !== 'regional') {
      setRegion('worldwide');
    }
  };

  // Loading state
  if (isLoading) {
    return <LeaderboardFullSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Couldn't load the leaderboard. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full" ref={listRef}>
      {/* A) Cinematic Hero */}
      <LeaderboardHero />

      {/* B) Your Status Card */}
      {userStatus && (
        <LeaderboardYourStatus
          user={userStatus}
          onViewRivals={scrollToUser}
        />
      )}

      {/* New user encouragement */}
      {isNewUser && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Log your first Top 100 course to join the race and track your progress.
          </p>
        </div>
      )}

      {/* C) Arena Tabs */}
      <div className="px-4 pt-5 pb-2">
        <LeaderboardArenaTabs
          activeMode={arenaMode}
          onChange={handleArenaModeChange}
          disabledModes={disabledModes}
        />
      </div>

      {/* Region Selector (for Regional Wars) */}
      {arenaMode === 'regional' && (
        <div className="px-4 pb-3">
          <LeaderboardRegionSelector
            value={region}
            onChange={setRegion}
          />
        </div>
      )}

      {/* D) Your Rivals Section (only when user has rank) */}
      {rivals.current && !isNewUser && (arenaMode === 'global' || arenaMode === 'regional') && (
        <>
          <LeaderboardRivalsSection
            playerAbove={rivals.above}
            currentUser={rivals.current}
            playerBelow={rivals.below}
            onViewLeaderboard={scrollToUser}
            onViewRival={handleViewRival}
          />
          <div className="h-px bg-border/30 mx-4 my-4" />
        </>
      )}

      {/* Season/Reset Callout */}
      <div className="px-4 py-2 mb-2">
        <p className="text-[11px] text-muted-foreground/60 text-center">
          Monthly seasons reset rankings — lifetime progress is always preserved.
        </p>
      </div>

      {/* E) Leaderboard List */}
      <div className="w-full">
        {displayedEntries.length === 0 ? (
          <div className="py-6">
            {arenaMode === 'friends' ? (
              <LeaderboardEmptyState type="friends-no-friends" />
            ) : arenaMode === 'climbers' ? (
              <LeaderboardEmptyState type="rising-no-data" />
            ) : (
              <LeaderboardEmptyState 
                type="no-matches" 
                onResetFilters={() => setArenaMode('global')} 
              />
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {displayedEntries.map((player) => {
              const isMe = currentUserEntry?.user_id === player.user_id;
              
              return (
                <div key={player.user_id} data-user-id={player.user_id}>
                  <LeaderboardPlayerCard
                    player={player}
                    isCurrentUser={isMe}
                    showTrend={arenaMode === 'climbers'}
                    onClick={() => handleViewRival(player.user_id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rival Preview Sheet */}
      <RivalPreviewSheet
        open={rivalSheetOpen}
        onOpenChange={setRivalSheetOpen}
        player={selectedRival}
      />
    </div>
  );
}
