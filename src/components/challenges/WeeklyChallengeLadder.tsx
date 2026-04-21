import React from 'react';
import { Card } from '@/components/ui/card';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWeeklyChallengeLadder } from '@/hooks/useWeeklyChallengeLadder';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Trophy, Medal, Award } from 'lucide-react';

export const WeeklyChallengeLadder: React.FC = () => {
  const { user } = useSupabaseSession();
  const { data: currentSeason } = useCurrentSeason();
  const { data: ladder } = useWeeklyChallengeLadder(currentSeason?.id, user?.id);

  if (!ladder || ladder.entries.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Weekly ladder will appear here</p>
        </div>
      </Card>
    );
  }

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-slate-600" />;
    return null;
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Weekly Challenge Ladder</h2>
        <p className="text-sm text-muted-foreground">
          Compete for weekly rewards • Top 10 earn bonus shop currency
        </p>
      </div>

      <div className="space-y-2">
        {ladder.entries.map((entry, index) => {
          const isCurrentUser = entry.user_id === user?.id;
          const rank = entry.rank || index + 1;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-card hover:bg-accent/50'
              }`}
            >
              {/* Rank */}
              <div className="w-12 text-center">
                {getRankIcon(rank) || (
                  <span className="font-bold text-lg text-muted-foreground">#{rank}</span>
                )}
              </div>

              {/* Avatar & Name */}
              <SquircleAvatar
                src={entry.profile.profile_photo_url}
                alt={entry.profile.display_name || entry.profile.username || ''}
                userId={entry.user_id}
                size={40}
                hideRing
              />

              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                  {entry.profile.display_name || entry.profile.username}
                  {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                </p>
                <p className="text-sm text-muted-foreground">@{entry.profile.username}</p>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="font-bold text-lg">{entry.points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>

              {/* Reward indicator for top 10 */}
              {rank <= 10 && (
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Reward
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ladder.userEntry && !ladder.entries.find(e => e.user_id === user?.id) && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Your position:</p>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-12 text-center">
              <span className="font-bold text-lg">#{ladder.userEntry.rank || '—'}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{ladder.userEntry.points} points</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        {ladder.totalPlayers} players competing this week
      </div>
    </Card>
  );
};
