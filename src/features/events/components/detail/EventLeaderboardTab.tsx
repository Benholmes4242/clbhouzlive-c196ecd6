import React, { useState } from 'react';
import { Trophy, Medal, ChevronDown, ChevronUp } from 'lucide-react';
import { EventWithDetails } from '@/features/events/hooks/useEvent';
import { useEventLeaderboard } from '@/features/events/hooks/useScores';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  event: EventWithDetails;
}

type SortBy = 'stableford' | 'net' | 'gross';

export function EventLeaderboardTab({ event }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('stableford');
  const { data: leaderboard, isLoading } = useEventLeaderboard(event.id);

  const hasScoring = event.scoring_format !== 'none';

  if (!hasScoring) {
    return (
      <div className="text-center py-12 space-y-4">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="font-medium">No scoring for this event</p>
        <p className="text-sm text-muted-foreground">This event is set to "No Scoring"</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>
    );
  }

  // Sort leaderboard
  const sortedLeaderboard = [...(leaderboard || [])].sort((a, b) => {
    if (sortBy === 'stableford') {
      return (b.total_stableford || 0) - (a.total_stableford || 0);
    } else if (sortBy === 'net') {
      return (a.total_net || 999) - (b.total_net || 999);
    } else {
      return (a.total_gross || 999) - (b.total_gross || 999);
    }
  });

  const getPositionStyle = (index: number) => {
    if (index === 0) return 'bg-amber-100 text-amber-700 border-amber-300';
    if (index === 1) return 'bg-gray-100 text-gray-700 border-gray-300';
    if (index === 2) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex gap-2">
        {(['stableford', 'net', 'gross'] as SortBy[]).map(option => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors',
              sortBy === option ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {option === 'stableford' ? 'Points' : option}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
          <span className="font-semibold">Leaderboard</span>
          <span className="text-sm text-muted-foreground">
            {event.rounds?.length || 0} round{(event.rounds?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {sortedLeaderboard.length > 0 ? (
          <div className="divide-y divide-border">
            {sortedLeaderboard.map((entry, index) => {
              const name = entry.participant?.user?.display_name || entry.participant?.guest_name || 'Unknown';
              const score = sortBy === 'stableford' 
                ? entry.total_stableford 
                : sortBy === 'net' 
                  ? entry.total_net 
                  : entry.total_gross;
              const hasScore = score !== null && score !== 0;

              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border',
                    getPositionStyle(index)
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {entry.participant?.user?.profile_photo_url ? (
                      <img src={entry.participant.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
                        {name[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.rounds_played || 0} round{entry.rounds_played !== 1 ? 's' : ''} played
                      {entry.participant?.handicap_index && ` • HCP ${entry.participant.handicap_index}`}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {hasScore ? (
                      <>
                        <p className={cn(
                          'text-lg font-bold',
                          sortBy === 'stableford' ? 'text-primary' : ''
                        )}>
                          {sortBy === 'stableford' ? score : score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sortBy === 'stableford' ? 'pts' : sortBy === 'net' ? 'net' : 'gross'}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-muted-foreground">--</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No scores yet</p>
            <p className="text-xs text-muted-foreground mt-1">Scores will appear once players submit them</p>
          </div>
        )}
      </div>
    </div>
  );
}
