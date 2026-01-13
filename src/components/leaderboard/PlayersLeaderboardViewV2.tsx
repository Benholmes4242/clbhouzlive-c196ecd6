/**
 * PlayersLeaderboardViewV2 - Rebuilt leaderboard with gamification
 * 
 * Features:
 * - Cinematic hero header
 * - Your Status card with rank/tier/progress
 * - Arena tabs (Global Elite, Regional Wars, Friends, Climbers, Nearby)
 * - Players From filter (country-based filtering)
 * - Your Rivals section
 * - Premium player cards with badges
 * - Region selector for Regional Wars
 * - Rival preview sheet
 * - Polish animations & transitions
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useTop100Leaderboard, LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { useNearbyPlayers } from '@/hooks/useNearbyPlayers';
import { useLeaderboardMilestones } from '@/hooks/useLeaderboardMilestones';
import { FLAGS } from '@/config/flags';
import { getMockLeaderboardV2Entries, mergeWithMockEntries } from '@/mocks/leaderboardV2MockGenerator';

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
  TimeRangeFilter,
  AchievementBanner,
  useAchievementDetection,
  RankHistorySheet,
  type ArenaMode,
  type LeaderboardRegion,
  type LeaderboardPlayerEntry,
  type LeaderboardUserStatus,
  type RivalPlayer,
  type AchievementType,
} from './v2';

import { PlayersFromFilter, type PlayersFromValue, getCountryName, ALL_COUNTRIES } from './v2/PlayersFromFilter';
import { NearbyEmptyState } from './v2/NearbyEmptyState';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

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
};

// Arena descriptions for helper text
const ARENA_DESCRIPTIONS: Record<ArenaMode, string> = {
  global: 'All-time Top 100 explorers worldwide',
  regional: 'Compete within your chosen Top 100 region list',
  friends: 'Your private competition',
  climbers: 'Biggest movers this month',
  nearby: 'Within 50 miles of your home club',
};

export function PlayersLeaderboardViewV2() {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  // UI state
  const [arenaMode, setArenaMode] = useState<ArenaMode>('global');
  const [region, setRegion] = useState<LeaderboardRegion>('worldwide');
  const [playersFrom, setPlayersFrom] = useState<PlayersFromValue>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');
  const [selectedRival, setSelectedRival] = useState<LeaderboardPlayerEntry | null>(null);
  const [rivalSheetOpen, setRivalSheetOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [dismissedAchievements, setDismissedAchievements] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Determine effective scope
  const effectiveScope = useMemo(() => {
    if (arenaMode === 'regional') {
      return REGION_TO_SCOPE[region];
    }
    return ARENA_TO_SCOPE[arenaMode];
  }, [arenaMode, region]);

  // Get current user profile with home club info
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile-extended', currentUserId],
    enabled: !!currentUserId,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url, home_club, home_club_id')
        .eq('id', currentUserId!)
        .single();
      
      if (!profile) return null;

      // Get home club country if available
      let homeClubCountry: string | null = null;
      if (profile.home_club_id) {
        const { data: club } = await supabase
          .from('golf_clubs')
          .select('country')
          .eq('id', profile.home_club_id)
          .single();
        homeClubCountry = club?.country || null;
      }

      return { ...profile, homeClubCountry };
    },
  });

  // Fetch leaderboard data with time range
  const { data, isLoading, isError, refetch } = useTop100Leaderboard({
    scope: effectiveScope,
    timeRange: timeRange,
    pageSize: 500,
  });

  // Fetch milestones for history sheet
  const { data: milestones = [], isLoading: milestonesLoading } = useLeaderboardMilestones(currentUserId);

  // Nearby players hook
  const nearbyData = useNearbyPlayers(currentUserId);

  // Friends are identified by is_friend flag from the RPC
  // No separate query needed - the RPC already marks friends

  // All entries from paginated data, optionally merged with mocks
  const allEntries = useMemo(() => {
    const rawEntries = data?.pages.flatMap(page => page.entries) || [];
    
    // Inject 100 mock players for busy-state testing when flag is enabled
    if (FLAGS.LEADERBOARD_V2_MOCK_100) {
      const mockEntries = getMockLeaderboardV2Entries();
      return mergeWithMockEntries(rawEntries, mockEntries);
    }
    
    return rawEntries;
  }, [data]);

  // Apply "Players From" filter
  const filteredByCountry = useMemo(() => {
    // Don't apply to Friends League
    if (arenaMode === 'friends') return allEntries;

    if (playersFrom === 'worldwide') return allEntries;

    const targetCountry = playersFrom === 'my-country' 
      ? currentUserProfile?.homeClubCountry 
      : playersFrom;

    if (!targetCountry) return allEntries;

    // Filter by country (from the country field or derive from home_club)
    return allEntries.filter(e => {
      // Check country field if available
      if (e.country) {
        return e.country === targetCountry || 
               e.country.toLowerCase() === targetCountry.toLowerCase();
      }
      // Fallback: match country name in home_club string
      const countryName = getCountryName(targetCountry);
      return e.home_club?.toLowerCase().includes(countryName.toLowerCase());
    });
  }, [allEntries, playersFrom, arenaMode, currentUserProfile?.homeClubCountry]);

  // Current user's entry
  const currentUserEntry = data?.pages[0]?.current_user_entry;

  // Find user's index in the filtered list
  const myIndex = useMemo(() => {
    if (!currentUserEntry) return -1;
    return filteredByCountry.findIndex(e => e.user_id === currentUserEntry.user_id);
  }, [filteredByCountry, currentUserEntry]);

  // Build user status model
  const userStatus: LeaderboardUserStatus | null = useMemo(() => {
    if (!currentUserEntry) return null;
    
    // Compute rank within filtered list
    const filteredRank = myIndex >= 0 ? myIndex + 1 : currentUserEntry.rank;
    const currentRank = playersFrom !== 'worldwide' ? filteredRank : currentUserEntry.rank;
    
    return {
      user_id: currentUserEntry.user_id,
      display_name: currentUserProfile?.display_name || currentUserEntry.display_name,
      avatar_url: currentUserProfile?.profile_photo_url || currentUserEntry.avatar_url,
      total_top100_played: currentUserEntry.total_top100_played,
      rank: currentRank,
      activeRegion: arenaMode === 'regional' ? region.toUpperCase() : undefined,
      timeRange: timeRange !== 'all_time' ? (timeRange === 'this_year' ? 'This Year' : 'This Month') : undefined,
    };
  }, [currentUserEntry, currentUserProfile, arenaMode, region, myIndex, playersFrom, timeRange]);

  // Track rank changes for achievement detection
  useEffect(() => {
    if (userStatus?.rank && previousRank !== userStatus.rank) {
      setPreviousRank(userStatus.rank);
    }
  }, [userStatus?.rank, previousRank]);

  // Achievement detection
  const detectedAchievements = useAchievementDetection({
    currentRank: userStatus?.rank || null,
    previousRank,
    bestRankAllTime: null, // TODO: Track from user profile
    timeRange,
  });

  // Compute rivals (above/current/below) from filtered list
  const rivals = useMemo(() => {
    if (myIndex < 0 || !currentUserEntry) {
      return { above: null, current: null, below: null };
    }

    const current: RivalPlayer = {
      user_id: currentUserEntry.user_id,
      display_name: currentUserProfile?.display_name || currentUserEntry.display_name,
      avatar_url: currentUserProfile?.profile_photo_url || currentUserEntry.avatar_url,
      total_top100_played: currentUserEntry.total_top100_played,
      rank: myIndex + 1,
      home_club: currentUserProfile?.home_club || currentUserEntry.home_club,
    };

    const aboveEntry = myIndex > 0 ? filteredByCountry[myIndex - 1] : null;
    const belowEntry = myIndex < filteredByCountry.length - 1 ? filteredByCountry[myIndex + 1] : null;

    const above: RivalPlayer | null = aboveEntry ? {
      user_id: aboveEntry.user_id,
      display_name: aboveEntry.display_name,
      avatar_url: aboveEntry.avatar_url,
      total_top100_played: aboveEntry.total_top100_played,
      rank: myIndex,
      home_club: aboveEntry.home_club,
    } : null;

    const below: RivalPlayer | null = belowEntry ? {
      user_id: belowEntry.user_id,
      display_name: belowEntry.display_name,
      avatar_url: belowEntry.avatar_url,
      total_top100_played: belowEntry.total_top100_played,
      rank: myIndex + 2,
      home_club: belowEntry.home_club,
    } : null;

    return { above, current, below };
  }, [myIndex, filteredByCountry, currentUserEntry, currentUserProfile]);

  // Filter entries based on arena mode
  const displayedEntries = useMemo((): LeaderboardPlayerEntry[] => {
    switch (arenaMode) {
      case 'global':
      case 'regional':
        return filteredByCountry.slice(0, 100).map((e, i) => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          home_club: e.home_club,
          total_top100_played: e.total_top100_played,
          rank: i + 1, // Re-rank within filtered list
        }));

      case 'friends': {
        // Use is_friend flag from RPC (marks mutual follows)
        const friendEntries = allEntries
          .filter(e => 
            (e.is_friend || e.user_id === currentUserId) && 
            e.total_top100_played > 0
          )
          .sort((a, b) => b.total_top100_played - a.total_top100_played)
          .map((e, i) => ({
            user_id: e.user_id,
            display_name: e.display_name,
            avatar_url: e.avatar_url,
            home_club: e.home_club,
            total_top100_played: e.total_top100_played,
            rank: i + 1,
          }));
        return friendEntries;
      }

      case 'climbers':
        // Sort by delta_rank (if available) or just show top movers
        return [...filteredByCountry]
          .filter((e: any) => e.delta_rank && e.delta_rank > 0)
          .sort((a: any, b: any) => (b.delta_rank || 0) - (a.delta_rank || 0))
          .slice(0, 50)
          .map((e: any, i) => ({
            user_id: e.user_id,
            display_name: e.display_name,
            avatar_url: e.avatar_url,
            home_club: e.home_club,
            total_top100_played: e.total_top100_played,
            rank: i + 1,
            delta_rank: e.delta_rank,
          }));

      case 'nearby':
        // Use nearby players hook data
        return nearbyData.players.map((p, i) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          home_club: p.home_club,
          total_top100_played: p.total_top100_played,
          rank: i + 1,
        }));

      default:
        return filteredByCountry.slice(0, 100).map((e, i) => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          home_club: e.home_club,
          total_top100_played: e.total_top100_played,
          rank: i + 1,
        }));
    }
  }, [filteredByCountry, allEntries, arenaMode, myIndex, nearbyData.players, currentUserId]);

  // Check if user is new (no Top 100s played)
  const isNewUser = !currentUserEntry || currentUserEntry.total_top100_played === 0;

  // Disabled arena modes for new users
  const disabledModes: ArenaMode[] = isNewUser ? ['nearby'] : [];

  // Rivals are only available on Global, Regional, and Friends modes
  const rivalsDisabled = arenaMode === 'climbers' || arenaMode === 'nearby';
  const rivalsDisabledReason = rivalsDisabled 
    ? 'Rivals are available in Global, Regional, and Friends leagues.' 
    : undefined;

  // Time range filter is relevant for Global, Regional, Climbers (not Friends/Nearby which use fixed contexts)
  const showTimeRangeFilter = arenaMode === 'global' || arenaMode === 'regional' || arenaMode === 'climbers';
  
  // Show Players From filter for these modes
  const showPlayersFromFilter = arenaMode === 'global' || arenaMode === 'regional' || arenaMode === 'climbers';

  // Handle rival click
  const handleViewRival = useCallback((userId: string) => {
    const player = allEntries.find(e => e.user_id === userId) || 
                   nearbyData.players.find(p => p.user_id === userId);
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
  }, [allEntries, nearbyData.players]);

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
    setDismissedAchievements(true); // Dismiss banner on tab switch
    // Reset region when leaving regional mode
    if (mode !== 'regional') {
      setRegion('worldwide');
    }
    // Reset playersFrom for Friends League (not applicable)
    if (mode === 'friends') {
      setPlayersFrom('worldwide');
    }
  };

  // Handle playersFrom filter change with transition
  const handlePlayersFromChange = (value: PlayersFromValue) => {
    setIsFilterTransitioning(true);
    setPlayersFrom(value);
    setDismissedAchievements(true); // Dismiss banner on filter change
    // Short delay for visual feedback
    setTimeout(() => setIsFilterTransitioning(false), 300);
  };

  // Handle time range filter change with transition
  const handleTimeRangeChange = (value: LeaderboardTimeRange) => {
    setIsFilterTransitioning(true);
    setTimeRange(value);
    setDismissedAchievements(false); // Reset achievements on time range change
    setTimeout(() => setIsFilterTransitioning(false), 300);
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

  // Nearby empty states
  const renderNearbyContent = () => {
    if (nearbyData.fallbackMode === 'none') {
      return <NearbyEmptyState variant="no-home-club" />;
    }
    if (nearbyData.players.length === 0) {
      return <NearbyEmptyState variant="no-nearby-players" />;
    }
    return null;
  };

  // Empty state for filtered results
  const renderEmptyState = () => {
    if (arenaMode === 'nearby') {
      return renderNearbyContent();
    }
    if (arenaMode === 'friends') {
      // Show empty state if only self in list (no actual friends)
      const hasOnlySelf = displayedEntries.length <= 1 && 
        displayedEntries[0]?.user_id === currentUserId;
      if (hasOnlySelf || displayedEntries.length === 0) {
        return <LeaderboardEmptyState type="friends-no-friends" />;
      }
    }
    if (arenaMode === 'climbers') {
      // Fast Climbers requires delta_rank from backend - show coming soon until implemented
      return <LeaderboardEmptyState type="rising-coming-soon" />;
    }
    if (playersFrom !== 'worldwide' && displayedEntries.length === 0) {
      const countryName = playersFrom === 'my-country' 
        ? getCountryName(currentUserProfile?.homeClubCountry || '')
        : getCountryName(playersFrom);
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <span className="text-2xl">🌍</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">
            No players from {countryName} yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-[240px] mb-4">
            Be the first to set the standard for your country!
          </p>
          <button
            onClick={() => setPlayersFrom('worldwide')}
            className="text-sm font-medium text-primary hover:underline"
          >
            View worldwide leaderboard
          </button>
        </div>
      );
    }
    return (
      <LeaderboardEmptyState 
        type="no-matches" 
        onResetFilters={() => setArenaMode('global')} 
      />
    );
  };

  // Check if Friends League should show empty state
  const showFriendsEmpty = arenaMode === 'friends' && 
    displayedEntries.length <= 1 && 
    displayedEntries[0]?.user_id === currentUserId;

  return (
    <div className="w-full" ref={listRef}>
      {/* A) Cinematic Hero */}
      <LeaderboardHero />

      {/* B) Your Status Card with animated progress */}
      {userStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <LeaderboardYourStatus
            user={userStatus}
            onViewRivals={scrollToUser}
            onViewHistory={() => setHistorySheetOpen(true)}
            rivalsDisabled={rivalsDisabled}
            rivalsDisabledReason={rivalsDisabledReason}
          />
        </motion.div>
      )}

      {/* Achievement Banner - after status card */}
      {!dismissedAchievements && detectedAchievements.length > 0 && (
        <AchievementBanner
          achievements={detectedAchievements}
          onDismiss={() => setDismissedAchievements(true)}
        />
      )}

      {/* New user encouragement */}
      {isNewUser && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-4 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
        >
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Log your first Top 100 course to join the race and track your progress.
          </p>
        </motion.div>
      )}

      {/* C) Arena Tabs with animation */}
      <div className="px-4 pt-5 pb-2">
        <LeaderboardArenaTabs
          activeMode={arenaMode}
          onChange={handleArenaModeChange}
          disabledModes={disabledModes}
        />
      </div>

      {/* Filters row: Players From + Time Range (for applicable modes) */}
      <AnimatePresence mode="wait">
        {(showPlayersFromFilter || showTimeRangeFilter) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-2 flex flex-wrap gap-3"
          >
            {showPlayersFromFilter && (
              <PlayersFromFilter
                value={playersFrom}
                onChange={handlePlayersFromChange}
                userCountry={currentUserProfile?.homeClubCountry}
              />
            )}
            {showTimeRangeFilter && (
              <TimeRangeFilter
                value={timeRange}
                onChange={handleTimeRangeChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Region Selector (for Regional Wars) */}
      <AnimatePresence mode="wait">
        {arenaMode === 'regional' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-3"
          >
            <LeaderboardRegionSelector
              value={region}
              onChange={setRegion}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby helper text */}
      {arenaMode === 'nearby' && nearbyData.userLocation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-2"
        >
          <p className="text-xs text-muted-foreground">
            {nearbyData.fallbackMode === 'nearby' 
              ? `Players within ${nearbyData.radiusUsed} miles of ${nearbyData.userLocation.clubName}`
              : `Players in ${nearbyData.userLocation.country}`
            }
          </p>
        </motion.div>
      )}

      {/* D) Your Rivals Section (only when user has rank) */}
      {rivals.current && !isNewUser && (arenaMode === 'global' || arenaMode === 'regional') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <LeaderboardRivalsSection
            playerAbove={rivals.above}
            currentUser={rivals.current}
            playerBelow={rivals.below}
            onViewLeaderboard={scrollToUser}
            onViewRival={handleViewRival}
          />
          <div className="h-px bg-border/30 mx-4 my-4" />
        </motion.div>
      )}

      {/* Time Range Helper Callout */}
      {timeRange !== 'all_time' && (
        <div className="px-4 py-2 mb-2">
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Showing {timeRange === 'this_year' ? 'this year' : 'this month'}'s rankings — lifetime progress is always preserved.
          </p>
        </div>
      )}

      {/* E) Leaderboard List with staggered animation */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {isFilterTransitioning ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <LeaderboardListSkeleton count={5} />
            </motion.div>
          ) : displayedEntries.length === 0 || showFriendsEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              {renderEmptyState()}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-border/30"
            >
              {displayedEntries.map((player, index) => {
                const isMe = currentUserEntry?.user_id === player.user_id;
                
                return (
                  <motion.div 
                    key={player.user_id} 
                    data-user-id={player.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: Math.min(index * 0.03, 0.5) // Cap delay at 0.5s
                    }}
                  >
                    <LeaderboardPlayerCard
                      player={player}
                      isCurrentUser={isMe}
                      showTrend={arenaMode === 'climbers'}
                      onClick={() => handleViewRival(player.user_id)}
                    />
                  </motion.div>
                );
              })}
              
              {/* End of list indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="py-8 px-6 text-center"
              >
                <p className="text-sm text-muted-foreground/60 font-medium">
                  End of leaderboard
                </p>
                {arenaMode !== 'climbers' && (
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    Check Fast Climbers to see who's moving up.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rival Preview Sheet */}
      <RivalPreviewSheet
        open={rivalSheetOpen}
        onOpenChange={setRivalSheetOpen}
        player={selectedRival}
      />

      {/* Rank History Sheet */}
      <RankHistorySheet
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        milestones={milestones}
        isLoading={milestonesLoading}
      />

      {/* Scroll to top button */}
      <ScrollToTopGlass />
    </div>
  );
}
