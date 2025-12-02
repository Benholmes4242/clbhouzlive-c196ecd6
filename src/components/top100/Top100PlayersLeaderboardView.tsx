import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard, LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilters';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function Top100PlayersLeaderboardView() {
  const navigate = useNavigate();
  
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');
  const [countryCode, setCountryCode] = useState<string | null>(null);

  const { data, isLoading } = useTop100Leaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  
  // Apply country filter client-side
  const filteredEntries = countryCode
    ? allEntries.filter(e => e.country === countryCode)
    : allEntries;

  const topThree = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);

  const handleFiltersChange = (updates: {
    scope?: LeaderboardScope;
    timeRange?: LeaderboardTimeRange;
    countryCode?: string | null;
  }) => {
    if (updates.scope !== undefined) setScope(updates.scope);
    if (updates.timeRange !== undefined) setTimeRange(updates.timeRange);
    if (updates.countryCode !== undefined) setCountryCode(updates.countryCode);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3 items-end">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Top100LeaderboardFilters
        mode="players"
        scope={scope}
        timeRange={timeRange}
        countryCode={countryCode}
        onChange={handleFiltersChange}
      />

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Top players chasing the 100</h2>
          
          <div className="grid grid-cols-3 gap-3 items-end">
            {topThree.map((player, index) => {
              const club = getTop100Club(player.total_top100_played);
              const ringBorderClass = getTop100RingBorderClass(club.tierId as any);
              
              // Heights: #1 tallest, #2 second, #3 shortest
              const sizes = [
                { ring: 64, avatar: 44, nameSize: 'text-xs' },
                { ring: 72, avatar: 50, nameSize: 'text-sm' },
                { ring: 56, avatar: 40, nameSize: 'text-xs' },
              ];
              const size = sizes[index];

              const initials = player.display_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <button
                  key={player.user_id}
                  onClick={() => navigate(`/profile/${player.user_id}?tab=top100`)}
                  className={cn(
                    'flex flex-col items-center justify-end text-center gap-1.5 transition-transform active:scale-95',
                    index === 1 && 'translate-y-[-6px]'
                  )}
                >
                  {/* Ring + Avatar */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center rounded-[28px] border-[3px] shadow-lg transition-all',
                      ringBorderClass
                    )}
                    style={{ width: size.ring, height: size.ring }}
                  >
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.display_name}
                        className="rounded-[24px] object-cover"
                        style={{ width: size.avatar, height: size.avatar }}
                      />
                    ) : (
                      <div 
                        className="bg-muted flex items-center justify-center text-[11px] font-semibold rounded-[24px]"
                        style={{ width: size.avatar, height: size.avatar }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Position badge */}
                  <div className="text-[11px] font-medium text-muted-foreground">
                    #{index + 1}
                  </div>

                  {/* Name */}
                  <div className={cn('font-semibold truncate max-w-[5.5rem]', size.nameSize)}>
                    {player.display_name}
                  </div>

                  {/* Tier name */}
                  {club.tierName && (
                    <div className="text-[10px] text-muted-foreground">
                      {club.tierName}
                    </div>
                  )}

                  {/* Courses count */}
                  <div className="text-[10px] text-muted-foreground">
                    {player.total_top100_played} Top 100{player.total_top100_played === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Leaderboard List */}
      {rest.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Full leaderboard</h3>
          
          <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card/60 overflow-hidden">
            {rest.map((player, index) => {
              const rowRank = index + 4;
              const club = getTop100Club(player.total_top100_played);
              
              const initials = player.display_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <button
                  key={player.user_id}
                  onClick={() => navigate(`/profile/${player.user_id}?tab=top100`)}
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/30 text-left transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank */}
                    <span className="text-xs text-muted-foreground w-7 text-right font-medium">
                      #{rowRank}
                    </span>
                    
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center text-[11px] font-semibold">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Name + Club */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {player.display_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {player.home_club || 'No home club set'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end text-right flex-shrink-0">
                    {club.tierName && (
                      <span className="text-[11px] font-medium text-foreground">
                        {club.shortLabel}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {player.total_top100_played} Top 100{player.total_top100_played === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {filteredEntries.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No players found with the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}
