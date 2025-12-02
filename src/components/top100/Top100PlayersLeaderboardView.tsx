import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard, LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Top100PlayersLeaderboardViewProps {
  filters: Top100LeaderboardFilters;
}

const PAGE_SIZE = 20;

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

export function Top100PlayersLeaderboardView({ filters }: Top100PlayersLeaderboardViewProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [viewScope, setViewScope] = useState<'all' | 'friends'>('all');

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
      // For now, just return all entries
    }

    return entries;
  }, [allEntries, filters.locationScope]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);
  const paginatedEntries = filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < filteredEntries.length;
  const hasPrev = page > 0;

  // Current user's position
  const me = currentUserEntry;
  const meClub = me ? getTop100Club(me.total_top100_played) : null;
  const nextMilestone = meClub ? (() => {
    const MILESTONES = [5, 10, 20, 50, 100, 200, 300, 400];
    const nextThreshold = MILESTONES.find(t => t > (me?.total_top100_played ?? 0));
    if (!nextThreshold) return null;
    const nextClub = getTop100Club(nextThreshold);
    const progressPct = Math.min(100, ((me?.total_top100_played ?? 0) / nextThreshold) * 100);
    return { tierName: nextClub.tierName, progressPct };
  })() : null;

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
      {/* Your Position Card */}
      {me && (
        <section className="rounded-2xl border border-border/70 bg-card/90 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar with ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[1.25rem] bg-foreground/5 blur-sm" />
              <div
                className={cn(
                  'relative h-12 w-12 rounded-[1.25rem] border-2 overflow-hidden',
                  meClub ? getTop100RingBorderClass(meClub.tierId as any) : ''
                )}
              >
                {me.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt={me.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center text-[11px] font-semibold">
                    {me.display_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
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
          {nextMilestone && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                Next: {nextMilestone.tierName}
              </span>
              <div className="w-24 h-1.5 rounded-full bg-border/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-accent"
                  style={{ width: `${nextMilestone.progressPct}%` }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Friends-only Toggle */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-full bg-muted/60 p-0.5 text-xs">
          <button
            type="button"
            className={cn(
              'px-2.5 py-0.5 rounded-full transition-colors',
              viewScope === 'all'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            )}
            onClick={() => setViewScope('all')}
          >
            All players
          </button>
          <button
            type="button"
            className={cn(
              'px-2.5 py-0.5 rounded-full transition-colors',
              viewScope === 'friends'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            )}
            onClick={() => setViewScope('friends')}
          >
            Friends only
          </button>
        </div>
      </div>

      {/* Player Rows */}
      <section className="space-y-2">
        {paginatedEntries.map((entry) => {
          const club = getTop100Club(entry.total_top100_played);
          const ringClass = getTop100RingBorderClass(club.tierId as any);

          const initials = entry.display_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={entry.user_id}
              type="button"
              onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
              className="w-full rounded-2xl border border-border/60 bg-card/90 px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/50 hover:shadow-sm transition-colors"
            >
              {/* Left: rank + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="inline-flex items-center justify-center rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  #{entry.rank}
                </div>

                {/* Avatar + ring */}
                <div className="relative">
                  <div
                    className={cn(
                      'relative h-9 w-9 rounded-[1.1rem] border-2 overflow-hidden',
                      ringClass
                    )}
                  >
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + club + tier */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {entry.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {entry.home_club || 'No club set'}
                  </span>
                  {club.tierName && (
                    <span className="text-[11px] text-muted-foreground">
                      {entry.total_top100_played} Top 100s · {club.tierName}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: numbers */}
              <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                <span className="text-sm font-semibold">
                  {entry.total_top100_played}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Top 100s
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Empty State */}
      {filteredEntries.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No players found with the selected filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => hasPrev && setPage((p) => Math.max(0, p - 1))}
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

          <span className="min-w-[90px] text-center text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => hasNext && setPage((p) => Math.min(totalPages - 1, p + 1))}
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
