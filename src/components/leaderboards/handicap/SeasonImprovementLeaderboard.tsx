import { useState } from 'react';
import { useSeasonImprovementLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

export function SeasonImprovementLeaderboard() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useSeasonImprovementLeaderboard({ scope });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No season data yet"
          description="Improvement is tracked throughout the championship season!"
        />
      </>
    );
  }

  const seasonName = entries[0]?.season_name;
  const daysRemaining = entries[0]?.days_remaining;

  return (
    <div className="space-y-4">
      {seasonName && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{seasonName}</span>
          {daysRemaining > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {daysRemaining} days left
            </span>
          )}
        </div>
      )}

      <LeaderboardScopeSelector value={scope} onChange={setScope} />

      <div className="space-y-1">
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.user_id}
            rank={entry.rank}
            userId={entry.user_id}
            displayName={entry.display_name}
            profilePhotoUrl={entry.profile_photo_url}
            homeClub={entry.home_club}
            isCurrentUser={entry.user_id === user?.id}
            isFriend={entry.is_friend}
          >
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <LeaderboardStat
                value={`-${entry.improvement.toFixed(1)}`}
                positive
              />
            </div>
            <LeaderboardStat
              value={entry.handicap_current.toFixed(1)}
              label="current"
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
