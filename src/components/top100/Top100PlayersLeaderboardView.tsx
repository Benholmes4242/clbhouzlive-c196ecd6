import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard, LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { TOP100_TIER_STYLES } from '@/lib/top100RingStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';
import { EmptyFriendsState } from '@/components/shared/EmptyFriendsState';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ENABLE_TOP100_MOCK_PLAYERS } from '@/config/featureFlags';
import { FLAGS } from '@/config/flags';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { TOP100_MOCK_PLAYERS } from '@/mocks/top100MockPlayers';
import { getMockLeaderboardUsers, BENJAMIN_HOLMES_USER_ID } from '@/mocks/leaderboardMockUsers';
import { UnifiedPagination } from '@/components/ui/UnifiedPagination';
import { getProfilePathById } from '@/lib/profileRoutes';
import {
  WeeklyHighlightsCarousel,
  StreakBadge,
  RivalryCard,
  ClosestGoalsCarousel,
  TrophyIcons,
  parseBadgesFromJson,
} from './engagement';

interface Top100PlayersLeaderboardViewProps {
  filters: Top100LeaderboardFilters;
}

const PAGE_SIZE = 15;

// Map new filter format to legacy scope
function mapFiltersToScope(filters: Top100LeaderboardFilters): LeaderboardScope {
  if (filters.listSlug === 'all') return 'worldwide';
  if (filters.listSlug === 'global') return 'global-top-100';
  if (filters.listSlug === 'gb-i') return 'gb-i-top-100';
  if (filters.listSlug === 'usa') return 'usa-top-100';
  if (filters.listSlug === 'europe') return 'europe-top-100';
  return 'worldwide';
}

function mapFiltersToTimeRange(filters: Top100LeaderboardFilters): LeaderboardTimeRange {
  if (filters.timeRange === 'year') return 'this_year';
  if (filters.timeRange === 'month') return 'this_month';
  // 'week' not supported yet, fallback to all_time
  return 'all_time';
}

// Movement helper - supports both delta_rank (real data) and previous_rank (mock data)
function getMovementLabel(entry: any) {
  // First check delta_rank from real RPC data
  if (entry.delta_rank != null && entry.delta_rank !== 0) {
    if (entry.delta_rank > 0) return { label: `▲ ${entry.delta_rank}`, direction: 'up' as const };
    return { label: `▼ ${Math.abs(entry.delta_rank)}`, direction: 'down' as const };
  }
  
  // Fallback to previous_rank for mock data
  if (entry.previous_rank != null && entry.rank != null) {
    if (entry.rank < entry.previous_rank) {
      const diff = entry.previous_rank - entry.rank;
      return { label: `▲ ${diff}`, direction: 'up' as const };
    }
    if (entry.rank > entry.previous_rank) {
      const diff = entry.rank - entry.previous_rank;
      return { label: `▼ ${diff}`, direction: 'down' as const };
    }
  }
  
  return { label: '—', direction: 'none' as const };
}

export function Top100PlayersLeaderboardView({ filters }: Top100PlayersLeaderboardViewProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [viewScope, setViewScope] = useState<'all' | 'friends'>('all');
  const [slideDir, setSlideDir] = useState<'none' | 'next' | 'prev'>('none');

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get current user's profile for avatar
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('profile_photo_url')
        .eq('id', currentUser!.id)
        .single();
      return data;
    },
  });

  const scope = mapFiltersToScope(filters);
  const timeRange = mapFiltersToTimeRange(filters);

  const { data, isLoading } = useTop100Leaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

  const rawEntries = data?.pages.flatMap(page => page.entries) || [];
  const currentUserEntry = data?.pages[0]?.current_user_entry;

  // Check if current user is Benjamin Holmes (for 100-user mock injection)
  const isBenjaminHolmes = currentUser?.id === BENJAMIN_HOLMES_USER_ID;

  // Merge mock players if flag is enabled
  const allEntries = useMemo(() => {
    // Original 30 mock players (global feature flag)
    let entries = rawEntries;
    
    if (ENABLE_TOP100_MOCK_PLAYERS) {
      const realIds = new Set(rawEntries.map((e: any) => e.user_id));
      const mockPlayers = TOP100_MOCK_PLAYERS.filter(
        mock => !realIds.has(mock.user_id)
      );
      entries = [...entries, ...mockPlayers];
    }
    
    // Benjamin Holmes: inject 100 additional mock users for UI testing
    if (FLAGS.LEADERBOARD_MOCK_USERS_ENABLED && isBenjaminHolmes) {
      const existingIds = new Set(entries.map((e: any) => e.user_id));
      const leaderboardMocks = getMockLeaderboardUsers().filter(
        mock => !existingIds.has(mock.user_id)
      );
      entries = [...entries, ...leaderboardMocks];
    }
    
    // Sort by total_top100_played descending, then reassign ranks
    const sorted = [...entries].sort(
      (a: any, b: any) => (b.total_top100_played ?? 0) - (a.total_top100_played ?? 0)
    );
    
    // Reassign ranks after merge
    sorted.forEach((entry: any, idx) => {
      entry.rank = idx + 1;
    });
    
    return sorted;
  }, [rawEntries, isBenjaminHolmes]);

  // Apply location filter client-side
  const filteredEntries = useMemo(() => {
    let entries = allEntries;
    
    // Apply location scope filter
    if (filters.locationScope !== 'worldwide') {
      // TODO: Implement location filtering based on user country
    }

    return entries;
  }, [allEntries, filters.locationScope]);

  // Compute counts for toggle
  const totalPlayers = filteredEntries.length;
  const totalFriends = filteredEntries.filter((e: any) => e.is_friend).length;

  // Apply friends filter
  const displayedEntries = useMemo(() => {
    if (viewScope === 'friends') {
      return filteredEntries.filter((e: any) => e.is_friend);
    }
    return filteredEntries;
  }, [filteredEntries, viewScope]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(displayedEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);
  const paginatedEntries = displayedEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < displayedEntries.length;
  const hasPrev = page > 0;

  // Current user's position
  const me = currentUserEntry;
  const meClub = me ? getTop100Club(me.total_top100_played) : null;
  const nextMilestone = me ? (() => {
    const next = getNextTop100Club(me.total_top100_played);
    if (!next) return null;
    const progressPct = Math.min(100, ((me.total_top100_played) / next.threshold) * 100);
    return { tierName: next.tierName, progressPct };
  })() : null;

  // Jump to my position
  const myIndex = me
    ? displayedEntries.findIndex((e: any) => e.user_id === me.user_id)
    : -1;
  const myPage = myIndex >= 0 ? Math.floor(myIndex / PAGE_SIZE) : null;

  // Spotlight golfer (highest recent_top100s or is_spotlight flag)
  const spotlight = filteredEntries.find((e: any) => e.is_spotlight) ?? null;

  // Challenge: friend just ahead
  const friendsEntries = filteredEntries.filter((e: any) => e.is_friend);
  const aheadFriend = me
    ? friendsEntries
        .filter((f: any) => f.total_top100_played > me.total_top100_played)
        .sort((a: any, b: any) => a.total_top100_played - b.total_top100_played)[0]
    : null;

  // Pagination handlers with slide animation
  const handleNextPage = () => {
    if (!hasNext) return;
    setSlideDir('next');
    setTimeout(() => {
      setPage(p => Math.min(totalPages - 1, p + 1));
      setSlideDir('none');
    }, 120);
  };

  const handlePrevPage = () => {
    if (!hasPrev) return;
    setSlideDir('prev');
    setTimeout(() => {
      setPage(p => Math.max(0, p - 1));
      setSlideDir('none');
    }, 120);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MODULE 1: Weekly Highlights Carousel */}
      <WeeklyHighlightsCarousel currentUserId={currentUser?.id} />

      {/* Optional B: Golfer of the Week Spotlight */}
      {spotlight && (
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-amber-200">
              {spotlight.avatar_url ? (
                <img
                  src={spotlight.avatar_url}
                  alt={spotlight.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-amber-800">
                  {spotlight.display_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                Golfer of the week
              </span>
              <span className="text-sm font-semibold text-amber-900">
                {spotlight.display_name}
              </span>
              {(spotlight as any).recent_top100s != null && (
              <span className="text-[11px] text-amber-800">
                  +{(spotlight as any).recent_top100s ?? 0} Top 100s this period
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const path = getProfilePathById(spotlight.user_id, (spotlight as any).creator_only);
              navigate(`${path}?tab=top100`);
            }}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-600 text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            View profile
          </button>
        </div>
      )}

      {/* Your Position Section - No card, just page section */}
      {me && (
        <button
          type="button"
          onClick={() => navigate('/top100?tab=my-progress')}
          className="w-full px-4 py-4 flex items-center justify-between gap-3 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <SquircleAvatar
              size={48}
              src={currentUserProfile?.profile_photo_url || me.avatar_url}
              alt={me.display_name}
              fallback={me.display_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
              ringColor={meClub ? getRingColorForTotalPlayed(me.total_top100_played || 0) : null}
            />

            <div className="flex flex-col text-left">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Your position
              </span>
              <span className="text-sm font-semibold text-foreground">
                #{me.rank} · {me.total_top100_played} Top 100 courses
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {meClub?.tierName ? `${meClub.tierName} · ` : ''}You're setting the pace.
              </span>
            </div>
          </div>

          {/* Progress to next tier */}
          <div className="flex items-center gap-2">
            {nextMilestone && (
              <div className="flex flex-col items-end gap-1 min-w-[100px]">
                <span className="text-[11px] text-muted-foreground">
                  Next: <span className="font-medium">{nextMilestone.tierName}</span>
                </span>
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-[width]"
                    style={{ width: `${nextMilestone.progressPct}%` }}
                  />
                </div>
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      )}

      {/* MODULE 2: Streak Badge */}
      {me && <StreakBadge userId={currentUser?.id} />}

      {/* MODULE 3: Rivalry Card */}
      {me && <RivalryCard userId={currentUser?.id} userTop100Count={me.total_top100_played} />}

      {/* MODULE 4: Closest Goals Carousel */}
      {me && (
        <ClosestGoalsCarousel
          totalPlayed={me.total_top100_played}
          rivalName={aheadFriend?.display_name}
          rivalDifference={aheadFriend ? aheadFriend.total_top100_played - me.total_top100_played : undefined}
        />
      )}

      {/* Optional A: Challenge Card */}
      {me && (aheadFriend || friendsEntries.length > 0) && (
        <div className="rounded-2xl bg-card/90 border border-border/60 px-3.5 py-2.5 text-xs flex flex-col gap-1">
          {aheadFriend ? (
            <>
              <span className="font-semibold text-foreground">
                Challenge: catch {aheadFriend.display_name}
              </span>
              <span className="text-muted-foreground">
                They're {aheadFriend.total_top100_played - me.total_top100_played} Top 100s ahead of you.
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">You're leading your friends</span>
              <span className="text-muted-foreground">
                Set the pace by adding another Top 100 round this month.
              </span>
            </>
          )}
        </div>
      )}

      {/* All/Friends Toggle with counts */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-full bg-muted/60 p-1 text-xs font-medium">
          <button
            type="button"
            className={cn(
              'px-3 py-1 rounded-full transition-colors',
              viewScope === 'all'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground'
            )}
            onClick={() => setViewScope('all')}
          >
            All players ({totalPlayers})
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1 rounded-full transition-colors',
              viewScope === 'friends'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground'
            )}
            onClick={() => setViewScope('friends')}
          >
            Friends only ({totalFriends})
          </button>
        </div>
      </div>

      {/* Player Rows - full bleed with slide animation */}
      <div
        className={cn(
          'transition-all duration-150 ease-out',
          slideDir === 'next' && '-translate-x-3 opacity-90',
          slideDir === 'prev' && 'translate-x-3 opacity-90'
        )}
      >
        {paginatedEntries.map((entry: any) => {
          const club = getTop100Club(entry.total_top100_played);
          const movement = getMovementLabel(entry);

          const initials = entry.display_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          // Rank pill styling based on position
          const rankPillClass =
            entry.rank === 1
              ? 'border-amber-400 text-amber-600 bg-amber-50'
              : entry.rank === 2
              ? 'border-slate-300 text-slate-500 bg-slate-50'
              : entry.rank === 3
              ? 'border-orange-300 text-orange-500 bg-orange-50'
              : 'border-border text-muted-foreground bg-background';

          return (
            <button
              key={entry.user_id}
              data-user-id={entry.user_id}
              type="button"
              onClick={() => {
                const path = getProfilePathById(entry.user_id, (entry as any).creator_only);
                navigate(`${path}?tab=top100`);
              }}
              className="w-full border-b border-border/40 bg-card/95 px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors first:border-t"
            >
              {/* Left: avatar + text */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with new squircle spec */}
                <SquircleAvatar
                  size={52}
                  src={entry.avatar_url}
                  alt={entry.display_name}
                  fallback={initials}
                  ringColor={getRingColorForTotalPlayed(entry.total_top100_played || 0)}
                  className="flex-shrink-0"
                />

                {/* Name + club + tier + trophy icons */}
                <div className="flex flex-col min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold leading-tight truncate">
                      {entry.display_name}
                    </span>
                    {/* MODULE 5: Mini Trophy Icons */}
                    <TrophyIcons 
                      badges={parseBadgesFromJson((entry as any).recent_activity_badges)} 
                      maxIcons={2}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {entry.home_club || 'No club set'}
                  </span>
                  <span className="text-[11px] mt-0.5">
                    <span className="text-base font-semibold text-foreground">{entry.total_top100_played}</span>
                    <span className="text-muted-foreground/70 ml-1">Top 100s</span>
                    <span className="text-muted-foreground/50 mx-1">·</span>
                    <span className="text-muted-foreground/70">{club.tierName || 'No club'}</span>
                  </span>
                </div>
              </div>

              {/* Right: rank pill + movement pill */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Rank pill */}
                <span className={cn(
                  'text-[11px] font-semibold px-2.5 py-1 rounded-full border',
                  rankPillClass
                )}>
                  #{entry.rank}
                </span>
                {/* Movement pill with fade-in animation */}
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full border animate-in fade-in duration-150',
                    movement.direction === 'up' && 'border-emerald-500 text-emerald-600',
                    movement.direction === 'down' && 'border-red-500 text-red-600',
                    movement.direction === 'none' && 'border-slate-200 bg-slate-50 text-slate-400'
                  )}
                >
                  {movement.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State - different for friends vs all */}
      {displayedEntries.length === 0 && !isLoading && (
        viewScope === 'friends' ? (
          <EmptyFriendsState title="No friends chasing the Top 100 yet" />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No players found with the selected filters.
            </p>
          </div>
        )
      )}

      {/* Jump to my position - grey styling with highlight on scroll */}
      {myPage !== null && myPage !== page && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setPage(myPage);
              // Add highlight effect after page change
              setTimeout(() => {
                const myRow = document.querySelector(`[data-user-id="${me?.user_id}"]`);
                if (myRow) {
                  myRow.classList.add('ring-2', 'ring-slate-300', 'bg-slate-50/50');
                  setTimeout(() => {
                    myRow.classList.remove('ring-2', 'ring-slate-300', 'bg-slate-50/50');
                  }, 400);
                }
              }, 200);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-medium border border-slate-200 shadow-sm hover:bg-slate-200 transition-colors"
          >
            Jump to my position (#{me?.rank})
          </button>
        </div>
      )}

      {/* Pagination */}
      <UnifiedPagination
        page={page}
        total={displayedEntries.length}
        pageSize={PAGE_SIZE}
        hasNextPage={hasNext}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        itemLabel="players"
      />
    </div>
  );
}
