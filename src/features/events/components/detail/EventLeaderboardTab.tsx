import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { EventWithDetails } from '@/features/events/hooks/useEvent';
import { cn } from '@/lib/utils';

interface Props {
  event: EventWithDetails;
}

export function EventLeaderboardTab({ event }: Props) {
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

  // Placeholder leaderboard based on participants
  const players = event.participants?.filter(p => p.invitation_status === 'accepted') || [];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
          <span className="font-semibold">Leaderboard</span>
          <span className="text-sm text-muted-foreground">
            {event.scoring_format === 'stableford' ? 'Stableford' : 'Stroke Play'}
          </span>
        </div>
        
        {players.length > 0 ? (
          <div className="divide-y divide-border">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-slate-100 text-slate-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.user?.display_name || player.guest_name}</p>
                  {player.handicap_index && (
                    <p className="text-sm text-muted-foreground">HCP {player.handicap_index}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-muted-foreground">--</p>
                  <p className="text-xs text-muted-foreground">No scores</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No players yet</p>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Scores will update as players complete their rounds
      </p>
    </div>
  );
}
