import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardPositionCard } from './LeaderboardPositionCard';
import { LeaderboardSegmentedControl, LeaderboardSegment } from './LeaderboardSegmentedControl';
import { LeaderboardPlayerRow } from './LeaderboardPlayerRow';
import { EmptyFriendsState } from '@/components/shared/EmptyFriendsState';

const CHUNK_SIZE = 25;

export function PlayersLeaderboardView() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<LeaderboardSegment>('around');
  const listRef = useRef<HTMLDivElement>(null);

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
    enabled: !!currentUser?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name')
        .eq('id', currentUser!.id)
        .single();
      return data;
    },
  });

  // Fetch leaderboard data
  const { data, isLoading } = useTop100Leaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    pageSize: 500,
  });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const currentUserEntry = data?.pages[0]?.current_user_entry;

  // Find user's position
  const myIndex = currentUserEntry
    ? allEntries.findIndex((e: any) => e.user_id === currentUserEntry.user_id)
    : -1;

  // Determine if user is new (no position yet)
  const isNewUser = !currentUserEntry || currentUserEntry.total_top100_played === 0;

  // Disable "Around You" for new users
  const disabledSegments: LeaderboardSegment[] = isNewUser ? ['around'] : [];

  // Default segment based on user status
  useEffect(() => {
    if (isNewUser && segment === 'around') {
      setSegment('top100');
    }
  }, [isNewUser, segment]);

  // Filter entries based on segment
  const displayedEntries = useMemo(() => {
    switch (segment) {
      case 'top100':
        return allEntries.slice(0, 100);
      
      case 'around':
        if (myIndex < 0) return [];
        const start = Math.max(0, myIndex - 10);
        const end = Math.min(allEntries.length, myIndex + 11);
        return allEntries.slice(start, end);
      
      case 'friends':
        return allEntries.filter((e: any) => e.is_friend);
      
      case 'rising':
        // Sort by delta_rank (biggest positive changes)
        return [...allEntries]
          .filter((e: any) => e.delta_rank && e.delta_rank > 0)
          .sort((a: any, b: any) => (b.delta_rank || 0) - (a.delta_rank || 0))
          .slice(0, 50);
      
      default:
        return allEntries.slice(0, 100);
    }
  }, [allEntries, segment, myIndex]);

  // Build user position model for card
  const meModel = currentUserEntry && currentUserProfile ? {
    user_id: currentUserEntry.user_id,
    display_name: currentUserProfile.display_name || currentUserEntry.display_name,
    avatar_url: currentUserProfile.profile_photo_url || currentUserEntry.avatar_url,
    total_top100_played: currentUserEntry.total_top100_played,
    rank: currentUserEntry.rank,
  } : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-sq-md" />
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
    <div className="space-y-4" ref={listRef}>
      {/* Pinned Your Position Card */}
      {meModel && (
        <LeaderboardPositionCard user={meModel} variant="full" />
      )}

      {/* New user encouragement */}
      {isNewUser && (
        <div className="rounded-sq-md border border-border/60 bg-card/80 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Rate your first Top 100 course to join the leaderboard and track your progress.
          </p>
        </div>
      )}

      {/* Segmented Control - sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4">
        <LeaderboardSegmentedControl
          value={segment}
          onChange={setSegment}
          disabledSegments={disabledSegments}
        />
      </div>

      {/* Player List */}
      <div className="rounded-sq-md border border-border/50 bg-card/60 overflow-hidden">
        {displayedEntries.length === 0 ? (
          <div className="py-12 px-4">
            {segment === 'friends' ? (
              <EmptyFriendsState title="No friends on the leaderboard yet" />
            ) : segment === 'rising' ? (
              <p className="text-sm text-muted-foreground text-center">
                No rising players this month. Check back soon!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No players found.
              </p>
            )}
          </div>
        ) : (
          <>
            {displayedEntries.map((entry: any, idx: number) => {
              const isMe = currentUserEntry?.user_id === entry.user_id;
              const showMarker = idx > 0 && idx % 50 === 0;

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
          </>
        )}
      </div>

      {/* Gamification micro-moment */}
      {segment === 'around' && meModel && displayedEntries.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            One more round puts you closer to the top.
          </p>
        </div>
      )}
    </div>
  );
}
