import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard, LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { TOP100_TIER_STYLES } from '@/lib/top100RingStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Squircle } from '@/components/ui/squircle';

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

// Movement helper
function getMovementLabel(deltaRank?: number | null) {
  if (!deltaRank || deltaRank === 0) return { label: '—', direction: 'none' as const };
  if (deltaRank > 0) return { label: `▲ ${deltaRank}`, direction: 'up' as const };
  return { label: `▼ ${Math.abs(deltaRank)}`, direction: 'down' as const };
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

  const scope = mapFiltersToScope(filters);
  const timeRange = mapFiltersToTimeRange(filters);

  const { data, isLoading } = useTop100Leaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const currentUserEntry = data?.pages[0]?.current_user_entry;

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
            onClick={() => navigate(`/profile/${spotlight.user_id}?tab=top100`)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-600 text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            View profile
          </button>
        </div>
      )}

      {/* Your Position Card - Tappable */}
      {me && (
        <button
          type="button"
          onClick={() => navigate('/top100?tab=my-progress')}
          className="w-full rounded-2xl border border-border/70 bg-card/95 px-4 py-3 flex items-center justify-between gap-3 shadow-xs active:scale-[0.99] transition-all hover:bg-muted/30"
        >
          <div className="flex items-center gap-3">
            {/* Avatar with Squircle + white ring + achievement ring */}
            <div className="relative">
              {/* Achievement ring (outer) - 2px */}
              <Squircle width={52} height={52}>
                <div className="w-full h-full flex items-center justify-center" style={{
                  background: meClub ? TOP100_TIER_STYLES[meClub.tierId as keyof typeof TOP100_TIER_STYLES]?.mapFill || '#94a3b8' : '#94a3b8'
                }}>
                  {/* White ring (middle) - 1px */}
                  <Squircle width={48} height={48}>
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      {/* Avatar (inner) */}
                      <Squircle width={46} height={46}>
                        {me.avatar_url ? (
                          <img
                            src={me.avatar_url}
                            alt={me.display_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-[11px] font-semibold">
                            {me.display_name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                      </Squircle>
                    </div>
                  </Squircle>
                </div>
              </Squircle>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-muted-foreground">
                Your position
              </span>
              <span className="text-sm font-semibold">
                #{me.rank} · {me.total_top100_played} Top 100 courses
              </span>
              {meClub?.tierName && (
                <span className="text-xs text-muted-foreground">
                  {meClub.tierName}
                </span>
              )}
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

      {/* Player Rows with slide animation */}
      <div
        className={cn(
          'space-y-2 transition-all duration-150 ease-out',
          slideDir === 'next' && '-translate-x-3 opacity-90',
          slideDir === 'prev' && 'translate-x-3 opacity-90'
        )}
      >
        {paginatedEntries.map((entry: any) => {
          const club = getTop100Club(entry.total_top100_played);
          const movement = getMovementLabel(entry.delta_rank);

          const initials = entry.display_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={entry.user_id}
              type="button"
              onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
              className="w-full rounded-2xl border border-border/60 bg-card/95 px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/50 hover:shadow-sm transition-colors"
            >
              {/* Left: avatar + text (no rank badge) */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with Squircle + white ring + achievement ring - 20% bigger (44px) */}
                <div className="relative flex-shrink-0">
                  {/* Achievement ring (outer) - 2px */}
                  <Squircle width={48} height={48}>
                    <div className="w-full h-full flex items-center justify-center" style={{
                      background: TOP100_TIER_STYLES[club.tierId as keyof typeof TOP100_TIER_STYLES]?.mapFill || '#94a3b8'
                    }}>
                      {/* White ring (middle) - 1px */}
                      <Squircle width={44} height={44}>
                        <div className="w-full h-full bg-white flex items-center justify-center">
                          {/* Avatar (inner) */}
                          <Squircle width={42} height={42}>
                            {entry.avatar_url ? (
                              <img
                                src={entry.avatar_url}
                                alt={entry.display_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                                {initials}
                              </div>
                            )}
                          </Squircle>
                        </div>
                      </Squircle>
                    </div>
                  </Squircle>
                </div>

                {/* Name + club + tier */}
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-semibold leading-tight truncate">
                    #{entry.rank} {entry.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {entry.home_club || 'No club set'}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {entry.total_top100_played} Top 100s · {club.tierName || 'No tier'}
                  </span>
                </div>
              </div>

              {/* Right: numbers + movement - centered */}
              <div className="flex flex-col items-center gap-1 min-w-[72px] shrink-0">
                <span className="text-base font-semibold">{entry.total_top100_played}</span>
                <span className="text-[11px] text-muted-foreground">Top 100s</span>
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                    movement.direction === 'up' && 'border-emerald-500 text-emerald-600',
                    movement.direction === 'down' && 'border-red-500 text-red-600',
                    movement.direction === 'none' && 'border-border text-muted-foreground'
                  )}
                >
                  {movement.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {displayedEntries.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No players found with the selected filters.
          </p>
        </div>
      )}

      {/* Jump to my position */}
      {myPage !== null && myPage !== page && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPage(myPage)}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            Jump to my position (#{me?.rank})
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={!hasPrev}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 font-medium transition-colors',
              hasPrev
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Previous
          </button>

          <span className="text-xs text-muted-foreground min-w-[90px] text-center">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={!hasNext}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 font-medium transition-colors',
              hasNext
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
